#!/usr/bin/env node

// this script will be run on the production machine, which as of 20261014
//   is very resource constrained (2GB RAM), so we're going out of our way to
//   keep memory usage low
// specifically, this is the reason we don't store titles in canonDocumentsByImdbId,
//   which necessitates two passes over title.basics.tsv

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { isEqual } from "lodash-es";
import { Meilisearch, type Index, type IndexObject } from "meilisearch";
import { delayMs, pick } from "siftutils";
import type { IndexedImdbTitle } from "siftcore";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  type Batch,
  type ImdbId,
  checkColnames,
  processFile,
  isMovieOrSeries,
} from "./common.ts";
import baseLogger from "../services/logger.ts";

type Document = IndexedImdbTitle;

const __filename = path.basename(fileURLToPath(import.meta.url));
const {
  APP_ENV,
  IMDB_DATA_DIR,
  MEILISEARCH_MASTER_KEY,
  MEILISEARCH_INDEX_NAME,
  MEILISEARCH_URL,
} = pick(
  process.env,
  [
    "APP_ENV",
    "IMDB_DATA_DIR",
    "MEILISEARCH_MASTER_KEY",
    "MEILISEARCH_INDEX_NAME",
    "MEILISEARCH_URL",
  ],
  true,
);

const requiredFiles = {
  BASICS: {
    filename: "title.basics.tsv",
    colnames: [
      "tconst",
      "titleType",
      "primaryTitle",
      "originalTitle",
      null,
      "startYear",
    ],
  },
  AKAS: {
    filename: "title.akas.tsv",
    colnames: ["titleId", null, "title"],
  },
  RATINGS: {
    filename: "title.ratings.tsv",
    colnames: ["tconst", "averageRating", "numVotes"],
  },
} as const;
Object.values(requiredFiles).forEach(({ filename, colnames }) =>
  checkColnames(path.join(IMDB_DATA_DIR!, filename), colnames),
);

const argv = yargs(hideBin(process.argv))
  .option("batchSize", {
    number: true,
    // https://www.meilisearch.com/docs/capabilities/indexing/how_to/import_large_datasets#choose-the-right-payload-size
    default: APP_ENV === "development" ? 100000 : 20000,
  })
  .parseSync();
const { batchSize } = argv;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = await prepareIndex(client, MEILISEARCH_INDEX_NAME!);

const logger = baseLogger.child({ script: __filename });
const startTime = new Date();
let durationMs: number;

const canonDocumentsByImdbId = new Map<
  ImdbId,
  // only storing the data we need to keep memory usage low
  Pick<Document, "type" | "year" | "rating">
>();

/* STAGE 1: populate canonDocumentsByImdbId */

await processFile(
  path.join(IMDB_DATA_DIR!, requiredFiles.BASICS.filename),
  extractCanonData,
  isMovieOrSeries,
  {
    batchSize: batchSize,
    logger,
    logProgressEveryNLines: batchSize,
  },
);
durationMs = +new Date() - +startTime;
logger.info(`Finished first pass of basics file at T=${durationMs}ms`);

await processFile(
  path.join(IMDB_DATA_DIR!, requiredFiles.RATINGS.filename),
  addRatingsToCanonData,
  (line: string) => canonDocumentsByImdbId.has(line.split("\t")[0]!),
  {
    batchSize: batchSize,
    logger,
    logProgressEveryNLines: batchSize,
  },
);
durationMs = +new Date() - +startTime;
logger.info(`Finished processing ratings file at T=${durationMs}ms`);

/* STAGE 2: add docs to index */

const taskUids: number[] = [];

// second pass of basics file - add docs to index
await processFile(
  path.join(IMDB_DATA_DIR!, requiredFiles.BASICS.filename),
  addDocsFromBasicsFile,
  isMovieOrSeries,
  {
    batchSize: batchSize,
    logger,
    logProgressEveryNLines: batchSize,
  },
);
durationMs = +new Date() - +startTime;
logger.info(`Finished processing basics file at T=${durationMs}ms`);

await processFile(
  path.join(IMDB_DATA_DIR!, requiredFiles.AKAS.filename),
  addDocsFromAkasFile,
  (line: string) => canonDocumentsByImdbId.has(line.split("\t")[0]!),
  { batchSize: batchSize, logger, logProgressEveryNLines: batchSize },
);
durationMs = +new Date() - +startTime;
logger.info(`Finished processing akas file at T=${durationMs}ms`);

/* STAGE 3: wait until all tasks are [succeeded, failed, or canceled] */

logger.info(`A total of ${taskUids.length} tasks were added to meilisearch`);

do {
  const result = await client.tasks.getTasks({
    uids: taskUids,
    statuses: ["enqueued", "processing"],
  });
  if (result.total === 0) break;
  logger.info(`Waiting for ${result.total} tasks to complete ...`);
  await delayMs(5000);
} while (true);

const failedTasks = await client.tasks.getTasks({
  uids: taskUids,
  statuses: ["failed"],
});
const nFailedDocs = failedTasks.results.reduce(
  (acc, t) => acc + t.details!.receivedDocuments!,
  0,
);
logger.info(
  `All tasks finished. There were ${failedTasks.total} / ${taskUids.length} failed tasks, covering ${nFailedDocs} documents.`,
);

// helpers

async function prepareIndex(
  client: Meilisearch,
  indexName: string,
): Promise<Index<Document>> {
  let index = client.index<Document>(indexName);
  let rawInfo: IndexObject | null = null;

  try {
    rawInfo = await index.getRawInfo();
    if (rawInfo.primaryKey !== "id") {
      // will fail if index already has documents
      await client.updateIndex(indexName, { primaryKey: "id" }).waitTask();
    }
  } catch (_e) {
    if (rawInfo) await client.deleteIndex(indexName).waitTask();
    await client.createIndex(indexName, { primaryKey: "id" }).waitTask();
    index = client.index<Document>(indexName);
  }

  const desiredSettings = {
    searchableAttributes: ["title", "imdbId"],
    filterableAttributes: ["imdbId"],
  };
  const actualSettings = await client.index(indexName).getSettings();
  if (
    !isEqual(
      desiredSettings,
      pick(actualSettings, Object.keys(desiredSettings)),
    )
  ) {
    await client.index(indexName).updateSettings(desiredSettings).waitTask();
  }

  return index;
}

async function extractCanonData(batch: Batch) {
  batch.forEach(([, line]) => {
    // first doc returned by getDocumentsFromBasicsFileLine is the canonDoc
    //   for particular Imdb Id
    const [{ imdbId, type, year, rating }] =
      getDocumentsFromBasicsFileLine(line);
    canonDocumentsByImdbId.set(imdbId, { type, year, rating });
  });
}

async function addRatingsToCanonData(batch: Batch) {
  batch.forEach(([, line]) => {
    const [imdbId, rating] = line.split("\t");
    canonDocumentsByImdbId.get(imdbId!)!.rating = +rating!;
  });
}

async function addDocsFromBasicsFile(batch: Batch) {
  const documents = batch.flatMap(([, line]) =>
    getDocumentsFromBasicsFileLine(line),
  );
  const { taskUid } = await index.addDocuments(
    documents.map((d) => ({
      ...d,
      rating: canonDocumentsByImdbId.get(d.imdbId)?.rating ?? null,
    })),
  );
  taskUids.push(taskUid);
}

async function addDocsFromAkasFile(batch: Batch) {
  const documents = batch.flatMap(([, line]) =>
    getDocumentsFromAkasFileLine(line),
  );
  const { taskUid } = await index.addDocuments(
    documents.map((d) => ({
      ...d,
      rating: canonDocumentsByImdbId.get(d.imdbId)?.rating ?? null,
    })),
  );
  taskUids.push(taskUid);
}

function getDocumentsFromBasicsFileLine(
  line: string,
): [Document] | [Document, Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const type = ["movie", "tvMovie"].includes(parts[1]!) ? "movie" : "series";
  const year = parts[5] === "\\N" ? null : +parts[5]!;
  const rating = canonDocumentsByImdbId.get(imdbId)?.rating ?? null;
  return [
    makeDocument({ imdbId, title: parts[2]!, type, year, rating }),
    parts[2] === parts[3]
      ? null
      : makeDocument({ imdbId, title: parts[3]!, type, year, rating }),
  ].filter((x) => x !== null) as [Document] | [Document, Document];
}

function getDocumentsFromAkasFileLine(line: string): [Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const title = parts[2]!;
  const { type, year, rating } = canonDocumentsByImdbId.get(imdbId)!;
  return [makeDocument({ imdbId, title, type, year, rating })];
}

function makeDocument(partialDoc: Omit<Document, "id">): Document {
  const { imdbId, title } = partialDoc;
  return {
    ...partialDoc,
    // In meilisearch, a document identifier can be of type integer or string,
    //   only composed of alphanumeric characters (a-z A-Z 0-9), hyphens (-)
    //   and underscores (_), and can not be more than 511 bytes.
    // In the IMDB database, there are some very long titles that are in
    //   languages like Japanese, which take up to 4-bytes per char in utf-8
    // Ensuring the length of the id is limited, as we do with the `.slice`
    //   call below, prevents a meilisearch addOrUpdateDocuments task failure
    id: Buffer.from([imdbId, title].join("::"))
      .toString("base64url")
      .slice(0, 511),
  };
}
