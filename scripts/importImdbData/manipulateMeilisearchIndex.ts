import "dotenv/config";
import { Meilisearch } from "meilisearch";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const argv = yargs(hideBin(process.argv))
  .option("info", {
    boolean: true,
    default: false,
  })
  .option("stats", {
    boolean: true,
    default: false,
  })
  .option("list", {
    number: true,
  })
  .option("search", {
    string: true,
  })
  .option("clear", {
    boolean: true,
    default: false,
  })
  .option("delete", {
    boolean: true,
    default: false,
  })
  .parseSync();

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index<Document>("imdb");

if (argv.info || argv.stats) {
  console.log(await index.getRawInfo(), await index.getStats());
} else if (argv.list) {
  console.log(await index.getDocuments({ limit: argv.list }));
} else if (argv.search) {
  console.log(await index.search(argv.search));
} else if (argv.clear) {
  await index.deleteAllDocuments();
} else if (argv.delete) {
  await index.delete();
}
