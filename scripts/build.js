import "dotenv/config";
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import * as prettier from "prettier";

const devMode = process.argv.includes("--dev");

const ALLOWED_TARGETS = ["edge", "firefox", "chrome"];
const target =
  process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ??
  "chrome";
if (!ALLOWED_TARGETS.includes(target)) {
  throw new Error(`Invalid target: ${target}`);
}

const __filename = stripScheme(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(__dirname, "../src");
const destDir = path.resolve(__dirname, "../dist");

const config = {
  entryPoints: [
    path.join(srcDir, "content-script.ts"),
    path.join(srcDir, "urlchange-dispatcher.ts"),
    path.join(srcDir, "service-worker.ts"),
    path.join(srcDir, "popup/index.html"),
    { in: path.join(srcDir, "popup/main.jsx"), out: "popup/main" },
  ],
  bundle: true,
  define: {
    "BUILDTIME_ENV.OMDB_API_KEY": `"${process.env.OMDB_API_KEY}"`,
    "BUILDTIME_ENV.DEBUG_MODE": devMode ? "true" : "false",
  },
  entryNames: "[dir]/[name]",
  loader: {
    ".json": "copy",
    ".html": "copy",
  },
  logLevel: devMode ? "info" : "warning",
  outdir: destDir,
  sourcemap: devMode ? "inline" : false,
  target: "es2020",
};

await makeAndMoveManifest(target);

if (devMode) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}

function stripScheme(url) {
  return url.replace(/^[^:]+:\/\//, "");
}

async function makeAndMoveManifest(target) {
  const [template, browserSpecificUpdates] = (
    await Promise.all(
      ["./manifest.json", `${target}/manifest.json`]
        .map((filename) => path.join(rootDir, filename))
        .map((filename) =>
          fs.promises.readFile(filename, { encoding: "utf-8" })
        )
    )
  ).map(JSON.parse);

  const destPath = path.join(destDir, "manifest.json");
  await fs.promises.writeFile(
    destPath,
    await prettier.format(
      JSON.stringify({ ...template, ...browserSpecificUpdates }),
      { filepath: destPath }
    )
  );
}
