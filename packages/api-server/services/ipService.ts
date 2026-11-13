import crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { pick } from "siftutils";
import { saltFilepath } from "../constants.ts";
import { regenerateSalt } from "../helpers.ts";

const { IP_GEOLOOKUP_API_URL } = pick(
  process.env,
  ["IP_GEOLOOKUP_API_URL"],
  true,
);

try {
  fs.accessSync(saltFilepath);
} catch (e) {
  regenerateSalt();
}

export async function ipToCountry(ip: string): Promise<string> {
  const resp = await fetch(path.join(IP_GEOLOOKUP_API_URL!, ip));
  const { error, country } = await resp.json();
  if (error)
    throw new Error(`ip-country lookup error: ${error.code}: ${error.message}`);
  return country as string;
}

export function ipToHash(ip: string): string {
  const salt = fs.readFileSync(saltFilepath, "utf-8");
  return crypto
    .createHash("sha1")
    .update(salt + ip)
    .digest("hex");
}
