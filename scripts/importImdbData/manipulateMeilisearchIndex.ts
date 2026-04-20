import "dotenv/config";
import { Meilisearch } from "meilisearch";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index<Document>("imdb");

await yargs(hideBin(process.argv))
  .command(
    ["$0", "info", "stats"],
    "get basic info about the index",
    {},
    async () => console.log(await index.getRawInfo(), await index.getStats()),
  )
  .command(
    ["list"],
    "list documents in index",
    { limit: { number: true, default: 10 } },
    async (argv) =>
      console.log(await index.getDocuments({ limit: argv.limit! })),
  )
  .command(
    ["search"],
    "search for documents matching the query",
    {
      query: { string: true, demandOption: true },
      limit: { number: true, default: 10 },
    },
    async (argv) =>
      console.log(await index.search(argv.query, { limit: argv.limit })),
  )
  .command(["clear"], "remove all documents from the index", {}, async () => {
    await index.deleteAllDocuments();
  })
  .command(["delete"], "delete the index", {}, async () => {
    await index.delete();
  })
  .parse();
