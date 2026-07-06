import "dotenv/config";

// initialize Sentry
import Sentry from "./instrument.ts";

import { parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import cors from "@fastify/cors";
import { Type, type Static } from "typebox";
import {
  type SiftApiProgramMatching,
  siftApiProgramMatchSchemas,
  type UserMessage,
  userMessageSchema,
  type Notification,
  notificationSchema,
} from "sifttypes";
import { delayMs, pick } from "siftutils";
import { extensionIds } from "./constants.ts";
import * as dbService from "./dbService.ts";
import * as emailService from "./emailService.ts";
import logger from "./logger.ts";
import { querySearchEngine, getIndexLastUpdatedTime } from "./searchEngine.ts";

const env = pick(
  process.env,
  ["APP_ENV", "PORT", "SIFT_API_KEY", "WEBSITE_URL"],
  true,
);

const server = createServer();
server.listen({ port: +env.PORT! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

function createServer() {
  const fastify = Fastify({ loggerInstance: logger });
  fastify.register(cors, {
    origin:
      env.APP_ENV === "production"
        ? [
            extensionIds.chrome.map((id) => `chrome-extension://${id}`),
            extensionIds.edge.map((id) => `chrome-extension://${id}`),
            extensionIds.firefox.map((id) => `moz-extension://${id}`),
            env.WEBSITE_URL!,
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
      if (env.APP_ENV === "development") {
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
      }

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
      const program = { ...request.query };

      let row = dbService.createProgramMatchRecord(
        {
          ...pick(program, ["title", "type", "year"]),
          meta: JSON.stringify({ originallyRequestedFrom: program.pageUrl }),
        },
        "ON CONFLICT DO NOTHING",
      );

      if (
        row.status === "pending" ||
        (row.status === "abandoned" &&
          parseISO(row.updatedAt) < (await getIndexLastUpdatedTime()))
      ) {
        const [bestMatch] = await querySearchEngine(program);
        row = dbService.updateProgramMatchRecord(row.id, {
          status: bestMatch ? "matched" : "abandoned",
          imdbId: bestMatch ? bestMatch.imdbId : null,
        });
      }

      if (row.status === "matched") {
        return reply.code(200).send({ status: "matched", imdbId: row.imdbId! });
      }

      if (row.status === "abandoned") {
        return reply.code(200).send({ status: "abandoned" });
      }

      /* row.status === 'pending' */
      throw new Error(`Unexpected status '${row.status}' for row id ${row.id}`);
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
      dbService.createMessageRecord(request.body);
      reply.code(200).send({ status: "ok" });

      if (env.APP_ENV === "production") {
        emailService
          .sendToDev({
            subject: "Sift: message from user",
            body: JSON.stringify(request.body, null, 2),
          })
          .catch((error) => Sentry.captureException(error));
      }
    },
  );

  // post a notification
  fastify.post<{
    Headers: { authorization: string };
    Body: Notification;
    Reply: { 200: { status: string }; 400: { error: string } };
  }>(
    "/notifications",
    {
      schema: {
        headers: {
          type: "object",
          properties: { authorization: { type: "string" } },
          required: ["authorization"],
        },
        body: notificationSchema,
      },
      preHandler: ensureAuthorized,
    } satisfies RouteShorthandOptions,
    async function (request, reply) {
      try {
        dbService.createNotification(request.body);
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.startsWith("UNIQUE constraint failed")
        ) {
          reply.code(400).send({
            error: `notificationId '${request.body.notificationId}' already exists`,
          });
          return;
        }
        throw e;
      }

      reply.code(200).send({ status: "ok" });
    },
  );

  // get latest notifications
  // TODO: limit results and paginate
  const getNotificationsRequestSchema = Type.Object({
    from: Type.Number(),
  });
  fastify.get<{
    Querystring: Static<typeof getNotificationsRequestSchema>;
    Reply: { 200: { notifications: Required<Notification>[] } };
  }>(
    "/notifications",
    {
      schema: {
        querystring: getNotificationsRequestSchema,
        response: {
          200: Type.Object({ notifications: Type.Array(notificationSchema) }),
        },
      },
    } satisfies RouteShorthandOptions,
    async function (request, reply) {
      const notificationRecords = dbService.getNotificationsSince(
        request.query.from,
      );
      reply.code(200).send({
        notifications: notificationRecords.map((nr) => ({
          ...pick(nr, ["notificationId", "targetPage", "content"]),
          timestamp: +parseISO(nr.createdAt),
        })),
      });
    },
  );

  return fastify;
}

async function ensureAuthorized(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply,
) {
  if (
    request.headers.authorization?.replace(/^Bearer /, "") !== env.SIFT_API_KEY!
  ) {
    reply.code(403).send({ status: "UNAUTHORIZED" });
  }
}

async function cleanup(signal: "SIGINT" | "SIGTERM") {
  logger.info(`Received ${signal}. Exiting ...`);
  await server.close();
  dbService.closeConnection();
  await Sentry.close();
  process.exit(0);
}
