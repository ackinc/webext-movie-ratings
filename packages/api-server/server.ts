import "dotenv/config";

// initialize Sentry
import Sentry from "./instrument.ts";

import type { Database } from "better-sqlite3";
import { parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import cors from "@fastify/cors";
import { Type, type Static } from "typebox";
import {
  type SiftApiProgramMatching,
  siftApiProgramMatchSchemas,
  type UserMessage,
  userMessageSchema,
} from "sifttypes";
import { delayMs, pick } from "siftutils";
import { extensionIds } from "./constants.ts";
import {
  createProgramMatchRecord,
  getProgramMatchRecord,
  updateProgramMatchRecord,
} from "./helpers.ts";
import db from "./db.ts";
import logger from "./logger.ts";
import { querySearchEngine, getIndexLastUpdatedTime } from "./searchEngine.ts";

const env = pick(process.env, ["APP_ENV", "PORT"], true);

const server = createServer(db);
server.listen({ port: +env.PORT! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

function createServer(db: Database) {
  const fastify = Fastify({ loggerInstance: logger });
  fastify.register(cors, {
    origin:
      env.APP_ENV === "production"
        ? [
            extensionIds.chrome.map((id) => `chrome-extension://${id}`),
            extensionIds.edge.map((id) => `chrome-extension://${id}`),
            extensionIds.firefox.map((id) => `moz-extension://${id}`),
            "https://getsift.today",
          ].flat()
        : true,
  });

  fastify.setErrorHandler(function (error: Error, _request, reply) {
    const statusCode =
      "statusCode" in error ? (error.statusCode as number) : 500;
    if (statusCode < 500) {
      this.log.info(error);
    } else {
      this.log.error(error);
    }
    reply
      .status(statusCode)
      .send({ error: statusCode < 500 ? error.message : "Server error" });
    if (statusCode >= 500) {
      Sentry.captureException(error);
    }
  });

  // health check route
  const healthCheckRequestSchema = Type.Object({
    delayMs: Type.Optional(Type.Number()),
    error: Type.Optional(Type.String()),
    workThroughDelay: Type.Optional(Type.Boolean()),
  });
  fastify.get<{
    Querystring: Static<typeof healthCheckRequestSchema>;
    Reply: { 200: { status: string } };
  }>(
    "/",
    { schema: { querystring: healthCheckRequestSchema } },
    async function (request, reply) {
      const { delayMs: qDelayMs, error, workThroughDelay } = request.query;
      if (qDelayMs !== undefined) {
        if (workThroughDelay) {
          const endTime = +new Date() + qDelayMs;
          while (+new Date() < endTime);
        } else {
          await delayMs(qDelayMs);
        }
      }
      if (error !== undefined) throw new Error(error);

      reply.code(200).send({ status: "ok" });
    },
  );

  // program-matching route
  // Q: Why bother involving a db at all, when we are already querying
  //      the search engine directly in the request handler?
  // A: Want to leave the possibility of manual matching open, for
  //      those cases where the search engine doesn't throw up a
  //      suitable match
  fastify.get<{
    Querystring: SiftApiProgramMatching.Request;
    Reply: { 200: SiftApiProgramMatching.Response };
  }>(
    "/imdbId",
    {
      schema: {
        querystring: siftApiProgramMatchSchemas.request,
        response: { 200: siftApiProgramMatchSchemas.response },
      },
    } satisfies RouteShorthandOptions,
    async function (request, reply) {
      const seIndexLastUpdatedAt = await getIndexLastUpdatedTime();

      const program = { ...request.query };
      let row = getProgramMatchRecord(db, program);

      if (
        !row ||
        (row.status === "abandoned" &&
          parseISO(row.updatedAt) < seIndexLastUpdatedAt)
      ) {
        if (!row) {
          createProgramMatchRecord(db, {
            ...pick(program, ["title", "type", "year"]),
            meta: JSON.stringify({ originallyRequestedFrom: program.pageUrl }),
          });

          // If multiple instances of the server are running, a race condition
          //   may cause the createProgramMatchRecord call above above to no-op
          //   even if the previous getProgramMatchRecord call returned nothing
          // Because of this, we cannot rely on the lastInsertRowId attr of the
          //   return value of the createProgramMatchRecord call above; the
          //   seemingly unnecessary getProgramMatchRecord below is actually
          //   required
          row = getProgramMatchRecord(db, program);
        }

        const [bestMatch] = await querySearchEngine(program);
        updateProgramMatchRecord(db, row!.id, {
          status: bestMatch ? "matched" : "abandoned",
          imdbId: bestMatch ? bestMatch.imdbId : null,
        });

        row = getProgramMatchRecord(db, row!.id)!;
      }

      if (row.status === "pending") {
        reply.code(200).send({ status: "pending" });
        return;
      }

      if (row.status === "matched") {
        reply.code(200).send({ status: "matched", imdbId: row.imdbId! });
        return;
      }

      // row.status === 'abandoned'
      reply.code(200).send({ status: "abandoned" });
    },
  );

  // receive user messages
  fastify.post<{
    Body: UserMessage;
    Reply: { 200: { status: string } };
  }>(
    "/messages",
    { schema: { body: userMessageSchema } } satisfies RouteShorthandOptions,
    async function (request, reply) {
      const { email, category, message } = request.body;
      const { changes } = db
        .prepare(
          "INSERT INTO messages (email, category, message) VALUES (?, ?, ?)",
        )
        .run(email ?? null, category, message);
      if (changes != 1) throw new Error(`Insertion failed`);
      reply.code(200).send({ status: "ok" });
    },
  );

  return fastify;
}

async function cleanup(signal: "SIGINT" | "SIGTERM") {
  logger.info(`Received ${signal}. Exiting ...`);
  await server.close();
  db.close();
  await Sentry.close();
  process.exit(0);
}
