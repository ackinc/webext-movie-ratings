import "dotenv/config";
import Database from "better-sqlite3";
import { createServer } from "./server.ts";

const db = new Database(process.env["DB_PATH"], { fileMustExist: true });
db.pragma("journal_mode = WAL");

const server = createServer(db);
server.listen({ port: +process.env["PORT"]! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
