import "dotenv/config";
import * as esbuild from "esbuild";
import * as path from "node:path";

const devMode = process.argv.includes("--dev");

const ALLOWED_TARGETS = ["firefox", "chrome"];
const target =
  process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ??
  "chrome";
if (!ALLOWED_TARGETS.includes(target)) {
  throw new Error(`Invalid target: ${target}`);
}

const __filename = stripScheme(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, "../src");
const destDir = path.resolve(__dirname, "../dist");

const config = {
  entryPoints: [
    path.join(srcDir, "content-script.js"),
    path.join(srcDir, "urlchange-dispatcher.js"),
    path.join(srcDir, "service-worker.js"),
    path.resolve(__dirname, `../${target}/manifest.json`),
  ],
  bundle: true,
  define: {
    "BUILDTIME_ENV.OMDB_API_KEY": `"${process.env.OMDB_API_KEY}"`,
    "BUILDTIME_ENV.DEBUG_MODE": devMode ? "true" : "false",
  },
  entryNames: "[name]",
  loader: {
    ".json": "copy",
  },
  logLevel: devMode ? "info" : "warning",
  outdir: destDir,
  sourcemap: devMode ? "inline" : false,
};

if (devMode) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}

function stripScheme(url) {
  return url.replace(/^[^:]+:\/\//, "");
}
