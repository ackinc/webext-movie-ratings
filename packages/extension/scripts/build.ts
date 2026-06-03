#!/usr/bin/env node

import "dotenv/config";
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import * as fse from "fs-extra";
import chokidar from "chokidar";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
import { pick } from "siftutils";

const APP_ENV = process.env["APP_ENV"] ?? "production";
const { OMDB_API_KEY, SENTRY_AUTH_TOKEN } = pick(
  process.env,
  ["OMDB_API_KEY", "SENTRY_AUTH_TOKEN"],
  true,
) as Record<string, string>;

const watchMode = process.argv.includes("--watch");
const uploadSrcMapsToSentry = process.argv.includes("--sentry-upload-srcmaps");

const ALLOWED_TARGETS = ["edge", "firefox", "chrome"];
const TARGET_BROWSER =
  process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ??
  "chrome";
if (!ALLOWED_TARGETS.includes(TARGET_BROWSER)) {
  throw new Error(`Invalid target: ${TARGET_BROWSER}`);
}

const SIFT_API_URL =
  APP_ENV === "development"
    ? "http://localhost:3000"
    : "https://api.getsift.today";
const SIFT_WEBSITE_URL =
  APP_ENV === "development" ? "http://localhost:3001" : "https://getsift.today";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, "..");
const destDir = path.resolve(__dirname, "../dist");

const staticFiles = [
  "popup/index.html",
  APP_ENV === "production" ? null : "dashboard/index.html",
]
  .filter((f) => f !== null)
  .map((f) => path.join(srcDir, f));
const manifestFiles = [
  `manifest.json`,
  `manifest.${APP_ENV}.json`,
  `misc/${TARGET_BROWSER}/manifest.json`,
  `misc/${TARGET_BROWSER}/manifest.${APP_ENV}.json`,
]
  .map((f) => path.join(srcDir, f))
  .filter((f) => {
    try {
      fs.accessSync(f);
      return true;
    } catch (e) {
      return false;
    }
  });
const config: esbuild.BuildOptions = {
  entryPoints: [
    { in: path.join(srcDir, "content-script/index.ts"), out: "content-script" },
    {
      in: path.join(srcDir, "content-script/urlchange-dispatcher.ts"),
      out: "urlchange-dispatcher",
    },
    { in: path.join(srcDir, "service-worker/index.ts"), out: "service-worker" },
    { in: path.join(srcDir, "popup/main.tsx"), out: "popup/main" },
    APP_ENV === "production"
      ? null
      : { in: path.join(srcDir, "dashboard/main.jsx"), out: "dashboard/main" },
  ].filter((x) => x !== null),
  bundle: true,
  define: {
    APP_ENV: `"${APP_ENV}"`,
    OMDB_API_KEY: `"${OMDB_API_KEY}"`,
    ISOLATED_CONTENT_SCRIPT_PATH: `"./content-script.js"`,
    MAIN_CONTENT_SCRIPT_PATH: `"./urlchange-dispatcher.js"`,
    FF_TELEMETRY_ENABLED: `${["development", "testing"].includes(APP_ENV)}`,

    // in testing-env (browseOTT script), we need the loop running in backgrounded tabs
    FF_HALT_LOOP_WHEN_PAGE_NOT_VISIBLE: `${["production", "development"].includes(APP_ENV)}`,

    TARGET_BROWSER: `"${TARGET_BROWSER}"`,

    SIFT_API_URL: `"${SIFT_API_URL}"`,
    SIFT_WEBSITE_URL: `"${SIFT_WEBSITE_URL}"`,
  },
  loader: {
    ".styles.css": "text",
    ".css": "css",
    ".png": "dataurl",
    ".svg": "dataurl",
  },
  logLevel: "info",
  metafile: false, // for debugging
  outdir: destDir,
  target: "es2020",
  sourcemap: uploadSrcMapsToSentry ? "linked" : "inline",
  plugins: [
    uploadSrcMapsToSentry
      ? sentryEsbuildPlugin({
          authToken: SENTRY_AUTH_TOKEN,
          org: "none-t24",
          project: "sift-web-ext",
        })
      : null,
  ].filter((x) => x),
};

// was previously using the copy-loader within esbuild to copy static
//   files, but the introduction of the sentryEsbuildPlugin broke
//   this process; the plugin seems to be forcing esbuild to use file
//   loader instead of copy loader for html files, which produces
//   undesirable output
// in general, esbuild seems focused on bundling js and css, and support
//   for html is not great
await Promise.all([copyStaticFiles(staticFiles), createManifest()]);

if (!watchMode) {
  const result = await esbuild.build(config);
  if (config.metafile) {
    fs.writeFileSync("meta.json", JSON.stringify(result.metafile));
  }
  process.exit(0);
}

const staticFileWatcher = chokidar
  .watch(staticFiles)
  .on("change", filewatchWrapper(copyStaticFiles));

const manifestFileWatcher = chokidar
  .watch(manifestFiles)
  .on("change", filewatchWrapper(createManifest));

const ctx = await esbuild.context(config);
await ctx.watch();

process.on("SIGINT", cleanup);

// helpers

type filechangeListener = (p: string, stats: fs.Stats | undefined) => void;
function filewatchWrapper(fn: filechangeListener): filechangeListener {
  return async (...args) => {
    console.log(
      `[watch] build started (change: "${path.relative(srcDir, args[0])}")`,
    );
    await fn(...args);
    console.log(`[watch] build finished`);
  };
}

async function copyStaticFiles(files: string | string[]) {
  await Promise.all(
    (Array.isArray(files) ? files : [files]).map((f) =>
      copyFile(f, path.join(destDir, path.relative(srcDir, f))),
    ),
  );
}

async function createManifest() {
  const manifest = (
    await Promise.all(
      manifestFiles.map((f) => fs.promises.readFile(f, { encoding: "utf-8" })),
    )
  ).reduce((acc, x) => ({ ...acc, ...JSON.parse(x) }), {});

  const destPath = path.join(destDir, "manifest.json");
  await fs.promises.writeFile(
    destPath,
    await prettier.format(JSON.stringify(manifest), { filepath: destPath }),
  );
}

async function copyFile(src: string, dest: string) {
  await fse.ensureDir(path.dirname(dest));
  await fs.promises.copyFile(src, dest);
}

function cleanup() {
  console.log("Received SIGINT. Exiting ...");
  staticFileWatcher.close();
  manifestFileWatcher.close();
  ctx.dispose();
}
