import "dotenv/config";
import * as path from "node:path";
import { Meilisearch, type Index, type IndexObject } from "meilisearch";
import { type Batch, processFile, isMovieOrSeries } from "./common.ts";

const { IMDB_DATA_DIR, MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

// https://www.meilisearch.com/docs/capabilities/indexing/how_to/import_large_datasets#choose-the-right-payload-size
const BATCH_SIZE = 100000;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = await prepareIndex(client);

const canonDocumentsByImdbId = new Map<string, Document>();
await processFile(
  path.join(IMDB_DATA_DIR!, "title.basics.tsv"),
  processBatchFromBasicsFile,
  isMovieOrSeries,
  { batchSize: BATCH_SIZE },
);
await processFile(
  path.join(IMDB_DATA_DIR!, "title.akas.tsv"),
  processBatchFromAkasFile,
  (line: string) => canonDocumentsByImdbId.has(line.split("\t")[0]!),
  { batchSize: BATCH_SIZE },
);

// helpers

interface Document {
  id: string;
  imdbId: string;
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

function getDocumentsFromBasicsFileLine(line: string): [Document, Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const type = ["movie", "tvMovie"].includes(parts[1]!) ? "movie" : "series";
  const year = parts[5] === "\\N" ? null : +parts[5]!;
  return [
    makeDocument({ imdbId, title: parts[2]!, type, year }),
    makeDocument({ imdbId, title: parts[3]!, type, year }),
  ];
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
    // pkeys in meilisearch indexes can't have non-alnum chars allowed in b64
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
    if (idx % 2 === 0) canonDocumentsByImdbId.set(doc.imdbId, doc);
  });
}

async function processBatchFromAkasFile(batch: Batch) {
  const documents = batch.flatMap(([, line]) =>
    getDocumentsFromAkasFileLine(line),
  );
  await index.addDocuments(documents);
}
