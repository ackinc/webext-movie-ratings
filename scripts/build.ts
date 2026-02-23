import "dotenv/config";
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import * as fse from "fs-extra";
import chokidar from "chokidar";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
import { pick } from "./common.ts";

const env = pick(
  process.env,
  ["OMDB_API_KEY", "SENTRY_AUTH_TOKEN"],
  true,
) as Record<string, string>;

const devMode = process.argv.includes("--dev");
const uploadSrcMapsToSentry = process.argv.includes("--sentry-upload-srcmaps");

const ALLOWED_TARGETS = ["edge", "firefox", "chrome"];
const target =
  process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ??
  "chrome";
if (!ALLOWED_TARGETS.includes(target)) {
  throw new Error(`Invalid target: ${target}`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(__dirname, "../src");
const destDir = path.resolve(__dirname, "../dist");

const staticFiles = ["popup/index.html"].map((f) => path.join(srcDir, f));
const manifestFiles = [`manifest.json`, `${target}/manifest.json`].map((f) =>
  path.join(rootDir, f),
);
const config: esbuild.BuildOptions = {
  entryPoints: [
    { in: path.join(srcDir, "content-script/index.ts"), out: "content-script" },
    {
      in: path.join(srcDir, "content-script/urlchange-dispatcher.ts"),
      out: "urlchange-dispatcher",
    },
    { in: path.join(srcDir, "service-worker.ts"), out: "service-worker" },
    { in: path.join(srcDir, "popup/main.jsx"), out: "popup/main" },
  ],
  bundle: true,
  define: {
    "BUILDTIME_ENV.OMDB_API_KEY": `"${env["OMDB_API_KEY"]}"`,
    "BUILDTIME_ENV.DEBUG_MODE": devMode ? "true" : "false",
  },
  loader: {
    ".svg": "dataurl",
  },
  logLevel: devMode ? "info" : "warning",
  outdir: destDir,
  target: "es2020",

  // haven't been able to make sourcemaps work for the devconsole
  //   debugging experience when also using sentryEsbuildPlugin
  //   to upload them to Sentry
  // ^WTF is this comment, you fuck?
  sourcemap: devMode ? "inline" : "linked",
  plugins: [
    uploadSrcMapsToSentry
      ? sentryEsbuildPlugin({
          authToken: env["SENTRY_AUTH_TOKEN"],
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

if (!devMode) {
  await esbuild.build(config);
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
      `[watch] build started (change: "${path.relative(rootDir, args[0])}")`,
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
