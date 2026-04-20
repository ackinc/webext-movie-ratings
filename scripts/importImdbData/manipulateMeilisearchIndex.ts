import "dotenv/config";
import { Meilisearch } from "meilisearch";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;
const argv = process.argv.slice(2);

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index<Document>("imdb");

if (argv.length === 0 || argv.includes("--stats") || argv.includes("--info")) {
  console.log(await index.getRawInfo(), await index.getStats());
  process.exit(0);
}

if (argv.some((x) => x.startsWith("--list"))) {
  const limit = +argv.find((arg) => arg.startsWith("--list"))!.split("=")[1]!;
  console.log(await index.getDocuments({ limit }));
  process.exit(0);
}

if (argv.some((arg) => arg.startsWith("--search"))) {
  const searchTerm = argv
    .find((arg) => arg.startsWith("--search"))!
    .split("=")[1];
  console.log(await index.search(searchTerm));
  process.exit(0);
}

if (argv.includes("--clear")) {
  await index.deleteAllDocuments();
  process.exit(0);
}

if (argv.includes("--delete")) {
  await index.delete();
  process.exit(0);
}
