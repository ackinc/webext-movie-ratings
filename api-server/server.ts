import "dotenv/config";
import { differenceInDays, parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import { type Database } from "better-sqlite3";
import { abandonedMatchStatusExpiryInDays } from "./constants.ts";
import { programSchema, programMatchResponseSchema } from "./schemas.ts";
import type {
  Program,
  ProgramMatchRecord,
  ProgramMatchResponse,
} from "./types.ts";

export function createServer(db: Database) {
  const fastify = Fastify({ logger: true });

  // health check
  fastify.get("/", function (_request, reply) {
    reply.send({ status: "ok" });
  });

  fastify.get<{ Querystring: Program; Reply: { 200: ProgramMatchResponse } }>(
    "/imdbId",
    {
      schema: {
        querystring: programSchema,
        response: { 200: programMatchResponseSchema },
      },
    } satisfies RouteShorthandOptions,
    function (request, reply) {
      const program = request.query;
      const row = db
        .prepare(
          `SELECT * FROM titles
           WHERE title = $title
             ${"type" in program ? " AND type = $type " : ""}
             ${"year" in program ? " AND year = $year " : ""}`,
        )
        .get(request.query) as ProgramMatchRecord | undefined;

      if (!row) {
        db.prepare(
          `INSERT INTO titles ("title", "type", "year", "meta")
           VALUES (?, ?, ?, ?)`,
        ).run(
          program.title,
          program.type ?? "\\N",
          program.year ?? 0,
          JSON.stringify({ originallyRequestedFrom: program.pageUrl }),
        );
        reply.code(200).send({ status: "pending" });
        return;
      }

      // makes future parseISO calls treat the string as representing
      //   a UTC date, instead of a date in the current system timezone
      row.createdAt = row.createdAt.replace(" ", "T") + "Z";
      row.updatedAt = row.updatedAt.replace(" ", "T") + "Z";

      if (row.status === "pending") {
        reply.code(200).send({ status: "pending" });
        return;
      }

      if (row.status === "matched") {
        reply.code(200).send({ status: "matched", imdbId: row.imdbId! });
        return;
      }

      if (
        row.status === "abandoned" &&
        differenceInDays(new Date(), parseISO(row.updatedAt)) >
          abandonedMatchStatusExpiryInDays
      ) {
        db.prepare(`UPDATE titles SET status = ? WHERE id = ?`).run(
          "pending",
          row.id,
        );
        reply.code(200).send({ status: "pending" });
        return;
      }

      reply.code(200).send({ status: "abandoned" });
    },
  );

  return fastify;
}
