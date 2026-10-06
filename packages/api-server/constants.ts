import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const extensionIds = {
  chrome: [
    "pfnhkljamlclkackkndllofcfhihacna", // CWS
    "ocdolfllmmikkhckpeggnkehehdgoalo", // unpacked
  ],
  edge: ["odgepppomekmdiifmjmocpjhopdmgjnl"],
  firefox: ["4c906ec0-98c8-47e7-a309-8824c57decce"],
};

export const imdbDataFileUrls = [
  "https://datasets.imdbws.com/title.basics.tsv.gz",
  "https://datasets.imdbws.com/title.akas.tsv.gz",
];

export const emailTemplatesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "./email-templates",
);
