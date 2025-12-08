const fs = require("node:fs");
const path = require("node:path");

const allowedVersionBumpTypes = ["major", "minor", "patch"];
const versionBumpType = process.argv[2]?.replace(/^--/, "") ?? "patch";
const writeFiles = process.argv.includes("--write");

if (!allowedVersionBumpTypes.includes(versionBumpType)) {
  console.error(
    `Error. Usage: node bumpVersion.cjs [TYPE] [--write]
    TYPE: one of "--major", "--minor", "--patch" (default)`
  );
  process.exit(1);
}

const projectRoot = path.join(__dirname, "..");
const fileList = [
  "package.json",
  "chrome/manifest.json",
  "firefox/manifest.json",
].map((f) => path.join(projectRoot, f));

let oldVersion;
let newVersion;

fileList.forEach((f) => {
  const contents = require(f);
  oldVersion = contents.version;
  newVersion = bumpVersion(contents.version, versionBumpType);
  contents.version = newVersion;

  if (writeFiles) {
    fs.writeFileSync(f, JSON.stringify(contents, null, 2));
  }
});

console.log(`Bumped version from ${oldVersion} to ${newVersion}`);

function bumpVersion(oldVersion, versionBumpType) {
  let [major, minor, patch] = oldVersion.split(".").map((x) => +x);

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
