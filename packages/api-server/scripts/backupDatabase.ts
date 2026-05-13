#!/usr/bin/env node

import "../instrument.ts";

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Database from "better-sqlite3";
import { pick } from "siftutils";
import baseLogger from "../logger.ts";

const __filename = path.basename(fileURLToPath(import.meta.url));
const env = pick(
  process.env,
  ["AWS_REGION", "AWS_S3_BUCKET_NAME", "DB_PATH"],
  true,
);

const backupPath = path.join(path.dirname(env.DB_PATH!), "db_backup.sqlite");
const logger = baseLogger.child({ script: __filename });

const db = new Database(env.DB_PATH!);
db.pragma("journal_mode = WAL");

const s3Client = new S3Client({ region: env.AWS_REGION! });

try {
  await db.backup(backupPath);
  logger.info("db backup created");

  await uploadBackupToS3();
  logger.info("db backup uploaded to s3");
} catch (e) {
  const err = e instanceof Error ? e : new Error(`${e}`);
  err.message = `db backup failed: ${err.message}`;
  logger.error(err);

  throw err;
}

// we don't have to worry about deleting older backups here; the s3
//   bucket has a lifecycle rule that takes care of this

// helpers

async function uploadBackupToS3() {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME!,
    Key: "sift-db-backup.sqlite",
    Body: fs.createReadStream(backupPath),
  });
  await s3Client.send(command);
}
