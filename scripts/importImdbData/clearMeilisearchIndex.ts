import "dotenv/config";
import { Meilisearch } from "meilisearch";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index<Document>("imdb");
await index.deleteAllDocuments();
// await index.delete();
