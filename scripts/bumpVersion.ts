import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

type VersionBumpType = "major" | "minor" | "patch";
const versionBumpType = process.argv[2]?.replace(/^--/, "") ?? "patch";
const writeFiles = !process.argv.includes("--nowrite");

if (!isAllowedVersionBumpType(versionBumpType)) {
  console.error(
    `Error. Usage: node bumpVersion.cjs [TYPE] [--nowrite]
    TYPE: one of "--major", "--minor", "--patch" (default)`,
  );
  process.exit(1);
}

const projectRoot = path.join(__dirname, "..");
const fileList = ["package.json", "manifest.json"].map((f) =>
  path.join(projectRoot, f),
);

let oldVersion: string;
let newVersion: string;
for (const f of fileList) {
  const contents = await import(f);
  oldVersion ??= contents.version;
  newVersion ??= bumpVersion(contents.version, versionBumpType);
  contents.version = newVersion;

  if (writeFiles) {
    fs.writeFileSync(f, JSON.stringify(contents, null, 2));

    // prevents prettier autoformatting causing unwanted changes
    //   when manifest files are manually edited later
    execSync(`npx prettier ${f} --write`, { stdio: "pipe" });
  }
}

const logMsg = `Bumped version: v${oldVersion!} to v${newVersion!}`;

if (writeFiles) {
  try {
    execSync(
      `git add ${fileList
        .map((x) => `"${x}"`)
        .join(" ")} && git commit -m "${logMsg}"`,
      { stdio: "pipe" },
    );
    execSync(`git tag v${newVersion!}`, { stdio: "pipe" });
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

console.log(logMsg);

// HELPERS

function bumpVersion(oldVersion: string, versionBumpType: VersionBumpType) {
  let [major, minor, patch] = oldVersion.split(".").map((x) => +x) as [
    number,
    number,
    number,
  ];

  switch (versionBumpType) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
    default:
      throw new Error(`Invalid versionBumpType: ${versionBumpType}`);
  }

  return [major, minor, patch].join(".");
}

function isAllowedVersionBumpType(s: string): s is VersionBumpType {
  return s in ["major", "minor", "patch"];
}
