import "dotenv/config";
import * as path from "node:path";
import { Meilisearch, type Index } from "meilisearch";
import { type Batch, processFile, isMovieOrSeries } from "./common.ts";

const { IMDB_DATA_DIR, MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

// https://www.meilisearch.com/docs/capabilities/indexing/how_to/import_large_datasets#choose-the-right-payload-size
const BATCH_SIZE = 100000;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index<Document>("imdb");
await prepareIndex(index);

const canonDocumentsByImdbId = new Map<string, Document>();
await processFile(
  path.join(IMDB_DATA_DIR!, "title.basics.tsv"),
  async (batch: Batch) => {
    const documents = batch.flatMap(([, line]) =>
      getDocumentsFromBasicsFileLine(line),
    );
    await index.addDocuments(documents);
    documents.forEach((doc, idx) => {
      // first doc returned by getDocumentsFromBasicsFileLine is canon
      if (idx % 2 === 0) canonDocumentsByImdbId.set(doc.imdbId, doc);
    });
  },
  isMovieOrSeries,
  { batchSize: BATCH_SIZE },
);
await processFile(
  path.join(IMDB_DATA_DIR!, "title.akas.tsv"),
  async (batch: Batch) => {
    const documents = batch.flatMap(([, line]) =>
      getDocumentsFromAkasFileLine(line),
    );
    await index.addDocuments(documents);
  },
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

async function prepareIndex(index: Index<Document>) {
  const searchableAttributes = await index.getSearchableAttributes();
  if (searchableAttributes.length === 1 && searchableAttributes[0] === "title")
    return;
  await index.updateSearchableAttributes(["title"]);
}

function getDocumentsFromBasicsFileLine(line: string): [Document, Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const type = ["movie", "tvMovie"].includes(parts[1]!) ? "movie" : "series";
  const year = parts[5] === "\\N" ? null : +parts[5]!;
  return [
    {
      id: Buffer.from([parts[2]!, type, year].join("::")).toString("base64"),
      imdbId,
      title: parts[2]!,
      type,
      year,
    },
    {
      id: Buffer.from([parts[3]!, type, year].join("::")).toString("base64"),
      imdbId,
      title: parts[3]!,
      type,
      year,
    },
  ];
}

function getDocumentsFromAkasFileLine(line: string): [Document] {
  const parts = line.split("\t");
  const imdbId = parts[0]!;
  const title = parts[2]!;
  const { type, year } = canonDocumentsByImdbId.get(imdbId)!;
  return [
    {
      id: Buffer.from([title, type, year].join("::")).toString("base64"),
      imdbId,
      title,
      type,
      year,
    },
  ];
}
