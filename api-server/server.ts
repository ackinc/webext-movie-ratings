import "dotenv/config";
import { differenceInDays, parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import Database from "better-sqlite3";
import { abandonedMatchStatusExpiryInDays, MatchStatus } from "./constants.ts";
import { programSchema, programMatchResponseSchema } from "./schemas.ts";
import type {
  Program,
  ProgramMatchRecord,
  ProgramMatchResponse,
} from "./types.ts";

const db = new Database(process.env["DB_PATH"], { fileMustExist: true });
db.pragma("journal_mode = WAL");

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
      response: {
        200: programMatchResponseSchema,
      },
    },
  } satisfies RouteShorthandOptions,
  function (request, reply) {
    const program = request.query;
    const row = db
      .prepare(
        `SELECT * FROM titles
         WHERE title = $title
           ${"type" in program ? " AND type = $type " : ""}
           ${"year" in program ? " AND year = $year " : ""}
           AND source = $website`,
      )
      .get(request.query) as ProgramMatchRecord | undefined;

    if (!row) {
      db.prepare(
        `INSERT INTO titles ("title", "type", "year", "source")
         VALUES (?, ?, ?, ?)`,
      ).run(program.title, program.type, program.year, program.website);
      reply.code(200).send({ status: MatchStatus.pending });
      return;
    }

    // makes future parseISO calls treat the string as representing
    //   a UTC date, instead of a date in the current system timezone
    row.createdAt = row.createdAt.replace(" ", "T") + "Z";
    row.updatedAt = row.updatedAt.replace(" ", "T") + "Z";

    if (row.status === MatchStatus.pending) {
      reply.code(200).send({ status: MatchStatus.pending });
      return;
    }

    if (row.status === MatchStatus.matched) {
      reply
        .code(200)
        .send({ status: MatchStatus.matched, imdbId: row.imdbId! });
      return;
    }

    if (
      row.status === MatchStatus.abandoned &&
      differenceInDays(new Date(), parseISO(row.updatedAt)) >
        abandonedMatchStatusExpiryInDays
    ) {
      db.prepare(`UPDATE titles SET status = ? WHERE id = ?`).run(
        MatchStatus.pending,
        row.id,
      );
      reply.code(200).send({ status: MatchStatus.pending });
      return;
    }

    reply.code(200).send({ status: MatchStatus.abandoned });
  },
);

fastify.listen({ port: +process.env["PORT"]! }, function (err, _address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
