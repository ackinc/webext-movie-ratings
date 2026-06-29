#!/usr/bin/env node

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Meilisearch, type Index, type IndexObject } from "meilisearch";
import { pick } from "siftutils";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  type Batch,
  type ImdbId,
  checkColnames,
  processFile,
  isMovieOrSeries,
} from "./common.ts";
import baseLogger from "../logger.ts";

const __filename = path.basename(fileURLToPath(import.meta.url));
const { APP_ENV, IMDB_DATA_DIR, MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } =
  pick(
    process.env,
    ["APP_ENV", "IMDB_DATA_DIR", "MEILISEARCH_MASTER_KEY", "MEILISEARCH_URL"],
    true,
  );

const argv = yargs(hideBin(process.argv))
  .option("batchSize", {
    number: true,
    // https://www.meilisearch.com/docs/capabilities/indexing/how_to/import_large_datasets#choose-the-right-payload-size
    default: APP_ENV === "development" ? 100000 : 20000,
  })
  .parseSync();
const { batchSize } = argv;

await Promise.all(
  ["title.basics.tsv", "title.akas.tsv"].map((filename) =>
    fs.promises.access(path.join(IMDB_DATA_DIR!, filename)),
  ),
);

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = await prepareIndex(client);

const logger = baseLogger.child({ script: __filename });
const startTime = new Date();

const canonDocumentsByImdbId = new Map<
  ImdbId,
  // only storing the data we need to keep memory usage low
  Pick<Document, "type" | "year">
>();
const basicsFilepath = path.join(IMDB_DATA_DIR!, "title.basics.tsv");
checkColnames(basicsFilepath, [
  "tconst",
  "titleType",
  "primaryTitle",
  "originalTitle",
  null,
  "startYear",
]);
await processFile(basicsFilepath, processBatchFromBasicsFile, isMovieOrSeries, {
  batchSize: batchSize,
  logger,
  logProgressEveryNLines: batchSize,
});

const akasFilepath = path.join(IMDB_DATA_DIR!, "title.akas.tsv");
checkColnames(akasFilepath, ["titleId", null, "title"]);
await processFile(
  akasFilepath,
  processBatchFromAkasFile,
  (line: string) => canonDocumentsByImdbId.has(line.split("\t")[0]!),
  { batchSize: batchSize, logger, logProgressEveryNLines: batchSize },
);

const durationMs = +new Date() - +startTime;
logger.info(`Completed in (${durationMs}ms)`);

// helpers

interface Document {
  id: string;
  imdbId: ImdbId;
  title: string;
  type: "movie" | "series";
  year: number | null;
}

async function prepareIndex(client: Meilisearch): Promise<Index<Document>> {
  const indexName = "imdb";
  let index = client.index<Document>(indexName);
  let rawInfo: IndexObject | null = null;

  try {
    rawInfo = await index.getRawInfo();
    if (rawInfo.primaryKey !== "id") {
      // will fail if index already has documents
      await client.updateIndex(indexName, { primaryKey: "id" });
    }
  } catch (_e) {
    if (rawInfo) await client.deleteIndex(indexName);
    await client.createIndex(indexName, { primaryKey: "id" });
    index = client.index<Document>(indexName);
  }

  const searchAttrs = await index.getSearchableAttributes();
  if (!(searchAttrs.length === 1 && searchAttrs[0] === "title")) {
    await index.updateSearchableAttributes(["title"]);
  }

  return index;
}

function getDocumentsFromBasicsFileLine(line: string): Document[] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const type = ["movie", "tvMovie"].includes(parts[1]!) ? "movie" : "series";
  const year = parts[5] === "\\N" ? null : +parts[5]!;
  return [
    makeDocument({ imdbId, title: parts[2]!, type, year }),
    parts[2] === parts[3]
      ? null
      : makeDocument({ imdbId, title: parts[3]!, type, year }),
  ].filter((x) => x !== null);
}

function getDocumentsFromAkasFileLine(line: string): [Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const title = parts[2]!;
  const { type, year } = canonDocumentsByImdbId.get(imdbId)!;
  return [makeDocument({ imdbId, title, type, year })];
}

function makeDocument(partialDoc: Omit<Document, "id">): Document {
  const { title, type, year } = partialDoc;
  return {
    ...partialDoc,
    // meilisearch index pkeys can't have the non-alnum chars allowed in b64
    id: Buffer.from([title, type, year].join("::"))
      .toString("base64")
      .replace(/[+/=]/g, "_"),
  };
}

async function processBatchFromBasicsFile(batch: Batch) {
  const documents = batch.flatMap(([, line]) =>
    getDocumentsFromBasicsFileLine(line),
  );
  await index.addDocuments(documents);
  documents.forEach((doc, idx) => {
    // first doc returned by getDocumentsFromBasicsFileLine is canon
    if (idx === 0)
      canonDocumentsByImdbId.set(doc.imdbId, pick(doc, ["type", "year"]));
  });
}

async function processBatchFromAkasFile(batch: Batch) {
  const documents = batch.flatMap(([, line]) =>
    getDocumentsFromAkasFileLine(line),
  );
  await index.addDocuments(documents);
}
