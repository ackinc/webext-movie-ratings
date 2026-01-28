import "dotenv/config";
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import * as prettier from "prettier";
import * as fse from "fs-extra";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

const env = pick(
  process.env,
  ["OMDB_API_KEY", "SENTRY_AUTH_TOKEN"],
  true,
) as Record<string, string>;

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

// was previously using the copy-loader within esbuild to copy this
//   file, but the introduction of the sentryEsbuildPlugin broke
//   this process (outfile name for popup/index.html was mangled
//   and the file itself was in destDir instead of destDir/popup)
await copyFile(
  path.join(srcDir, "popup/index.html"),
  path.join(destDir, "popup/index.html"),
);
await makeAndMoveManifest(target);

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
  logLevel: devMode ? "info" : "warning",
  outdir: destDir,
  target: "es2020",

  // haven't been able to make sourcemaps work for the devconsole
  //   debugging experience when also using sentryEsbuildPlugin
  //   to upload them to Sentry
  sourcemap: devMode ? "inline" : "linked",
  plugins: devMode
    ? []
    : [
        sentryEsbuildPlugin({
          authToken: env["SENTRY_AUTH_TOKEN"],
          org: "none-t24",
          project: "sift-web-ext",
        }),
      ],
};

if (devMode) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}

function stripScheme(url: string) {
  return url.replace(/^[^:]+:\/\//, "");
}

async function makeAndMoveManifest(target: string) {
  const [template, browserSpecificUpdates] = (
    await Promise.all(
      ["./manifest.json", `${target}/manifest.json`]
        .map((filename) => path.join(rootDir, filename))
        .map((filename) =>
          fs.promises.readFile(filename, { encoding: "utf-8" }),
        ),
    )
  ).map((x) => JSON.parse(x));

  const destPath = path.join(destDir, "manifest.json");
  await fs.promises.writeFile(
    destPath,
    await prettier.format(
      JSON.stringify({ ...template, ...browserSpecificUpdates }),
      { filepath: destPath },
    ),
  );
}

async function copyFile(src: string, dest: string) {
  await fse.ensureDir(path.dirname(dest));
  await fs.promises.copyFile(src, dest);
}

// importing this function from 'src/common/utils.ts' fails because node
//   requires file-extensions to be specified for all imports, and the imports
//   in the files inside src are currently not written that way
type IsOptional = boolean;
function pick(
  obj: Record<string, unknown>,
  keys: string[] | Record<string, IsOptional>,
  defaultRequired: boolean = false,
): Record<string, unknown> {
  if (Array.isArray(keys))
    keys = keys.reduce((acc, k) => ({ ...acc, [k]: defaultRequired }), {});

  const retval: Record<string, unknown> = {};

  for (const k in keys) {
    const isRequired = keys[k];

    if (!(k in obj) && isRequired)
      throw new Error(`Required key ${k} is absent`);

    retval[k] = obj[k];
  }

  return retval;
}
