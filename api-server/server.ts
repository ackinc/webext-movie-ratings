import "dotenv/config";
import { differenceInDays, parseISO } from "date-fns";
import Fastify, { type RouteShorthandOptions } from "fastify";
import Database from "better-sqlite3";
import { Type, type Static } from "typebox";

const db = new Database(process.env["DB_PATH"], { fileMustExist: true });
db.pragma("journal_mode = WAL");

const fastify = Fastify({ logger: true });

const DAYS_AFTER_WHICH_TO_RETRY_MATCHING_ABANDONED_TITLES = 30;

fastify.get("/", function (_request, reply) {
  reply.send({ hello: "world" });
});

const titleSchema = Type.Object({
  title: Type.String(),
  website: Type.String(),
});
type TitleType = Static<typeof titleSchema>;
interface TitleFromDb {
  id: number;
  titleFromSource: string;
  source: string;
  status: "pending" | "matched" | "abandoned";
  matchedImdbId: string | null;
  createdAt: string;
  updatedAt: string;
}
const matchResponseSchema = Type.Object({
  status: Type.Enum(["pending", "matched", "abandoned"]),
  imdbId: Type.Optional(Type.String()),
});
type MatchResponseType = Static<typeof matchResponseSchema>;
fastify.get<{ Querystring: TitleType; Reply: { 200: MatchResponseType } }>(
  "/imdbId",
  {
    schema: {
      querystring: titleSchema,
      response: {
        200: matchResponseSchema,
      },
    },
  } satisfies RouteShorthandOptions,
  function (request, reply) {
    const { title: titleFromSource, website } = request.query;
    const row = db
      .prepare(
        'SELECT * FROM titles WHERE "titleFromSource" = ? AND source = ?',
      )
      .get(titleFromSource, website) as TitleFromDb | undefined;

    if (!row) {
      db.prepare(
        'INSERT INTO titles ("titleFromSource", "source") VALUES (?, ?)',
      ).run(titleFromSource, website);
      reply.code(200).send({ status: "pending" });
      return;
    }

    // makes future parseISO calls treat the string as representing
    //   a UTC date, instead of a date in the current system timezone
    row["createdAt"] = row["createdAt"].replace(" ", "T") + "Z";
    row["updatedAt"] = row["updatedAt"].replace(" ", "T") + "Z";

    if (row["status"] === "pending") {
      reply.code(200).send({ status: "pending" });
      return;
    }

    if (row["status"] === "matched") {
      reply
        .code(200)
        .send({ status: "matched", imdbId: row["matchedImdbId"]! });
      return;
    }

    if (
      row["status"] === "abandoned" &&
      differenceInDays(new Date(), parseISO(row["updatedAt"])) >
        DAYS_AFTER_WHICH_TO_RETRY_MATCHING_ABANDONED_TITLES
    ) {
      db.prepare("UPDATE titles SET status = ? WHERE id = ?").run(
        "pending",
        row["id"],
      );
      reply.code(200).send({ status: "pending" });
      return;
    }

    reply.code(200).send({ status: "abandoned" });
  },
);

fastify.listen({ port: +process.env["PORT"]! }, function (err, _address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
