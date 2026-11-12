import crypto from "node:crypto";
import * as fs from "node:fs";
import { saltFilepath } from "../constants.ts";
import { regenerateSalt } from "../helpers.ts";

try {
  fs.accessSync(saltFilepath);
} catch (e) {
  regenerateSalt();
}

export async function ipToCountry(ip: string): Promise<string> {
  const resp = await fetch(`https://api.country.is/${ip}`);
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
