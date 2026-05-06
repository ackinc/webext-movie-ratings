import "dotenv/config";
import type { Database } from "better-sqlite3";
import { parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import cors from "@fastify/cors";
import {
  type SiftApiProgramMatching,
  siftApiProgramMatchSchemas,
} from "sifttypes";
import { extensionIds } from "./constants.ts";
import { getProgramMatchRecord } from "./helpers.ts";
import loggerInstance from "./logger.ts";
import { querySearchEngine, getIndexLastUpdatedTime } from "./searchEngine.ts";

const { APP_ENV } = process.env;

export function createServer(db: Database) {
  const fastify = Fastify({ loggerInstance });
  fastify.register(cors, {
    origin:
      APP_ENV === "production"
        ? [
            extensionIds.cws ? `chrome-extension://${extensionIds.cws}` : "",
            extensionIds.eas ? `chrome-extension://${extensionIds.eas}` : "",
            extensionIds.mas ? `moz-extension://${extensionIds.mas}` : "",
          ].filter((x) => x)
        : true,
  });

  // TODO: db as decorator

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
  });

  // health check route
  fastify.get("/", function (_request, reply) {
    reply.send({ status: "ok" });
  });

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
        // We insert the row synchronously when we find it doesn't already
        //   exist because if another request arrives for the same program
        //   before we're finished with this request, we do not want it to
        //   attempt another insert (which would risk lastInsertRowId being
        //   undefined in the handler of that request)
        const { changes, lastInsertRowid } = db
          .prepare(
            `INSERT INTO titles ("title", "type", "year", "meta")
           VALUES (?, ?, ?, ?)
           ON CONFLICT DO NOTHING`,
          )
          .run(
            program.title,
            program.type ?? "\\N",
            program.year ?? 0,
            JSON.stringify({ originallyRequestedFrom: program.pageUrl }),
          );

        const [bestMatch] = await querySearchEngine(program);
        db.prepare(`UPDATE titles SET status = ?, imdbId = ? WHERE id = ?`).run(
          bestMatch ? "matched" : "abandoned",
          bestMatch ? bestMatch.imdbId : null,
          // the insert could only have failed if the row already existed
          changes === 0 ? row!.id : lastInsertRowid,
        );

        row = getProgramMatchRecord(db, lastInsertRowid)!;
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

  return fastify;
}
