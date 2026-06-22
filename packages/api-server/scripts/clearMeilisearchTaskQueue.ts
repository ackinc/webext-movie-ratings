#!/usr/bin/env node

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Meilisearch } from "meilisearch";
import { pick } from "siftutils";
import baseLogger from "../logger.ts";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = pick(
  process.env,
  ["APP_ENV", "IMDB_DATA_DIR", "MEILISEARCH_MASTER_KEY", "MEILISEARCH_URL"],
  true,
);
const __filename = path.basename(fileURLToPath(import.meta.url));
const logger = baseLogger.child({ script: __filename });

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});

const tasksToCancel = await getPendingTasks();
logger.info(`Found ${tasksToCancel.length} pending tasks`);
await client.tasks.cancelTasks({ uids: tasksToCancel.map((t) => t.uid) });
logger.info(`All pending tasks cancelled.`);

async function getPendingTasks() {
  const pendingTasks = [];
  let next: number | null = null;
  do {
    const response = await client.tasks.getTasks({
      statuses: ["enqueued", "processing"],
      limit: 1000,
      from: next,
    });
    pendingTasks.push(...response.results);
    next = response.next;
  } while (next !== null);
  return pendingTasks;
}
