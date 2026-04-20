import "dotenv/config";
import Database from "better-sqlite3";

const { DB_PATH } = process.env;

const db = new Database(DB_PATH!);

db.exec('DELETE FROM "imdbTitleAliases";');
db.exec('DELETE FROM "imdbTitles";');

// db.exec('DROP TRIGGER IF EXISTS "update_imdbTitleAliases_updatedAt";');
// db.exec('DROP TABLE IF EXISTS "imdbTitleAliases";');
// db.exec('DROP TRIGGER IF EXISTS "update_imdbTitles_updatedAt";');
// db.exec('DROP TABLE IF EXISTS "imdbTitles";');
