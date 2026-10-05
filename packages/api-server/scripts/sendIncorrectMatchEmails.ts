#!/usr/bin/env node

import "dotenv/config";
import { addHours, format } from "date-fns";
import { type IndexedImdbTitle } from "siftcore";
import { pick } from "siftutils";
import dbService from "../dbService.ts";
import * as emailService from "../emailService.ts";
import type { RawProgramMatchRecord } from "../types.ts";
import logger from "../logger.ts";

const env = pick(process.env, ["SIFT_API_KEY", "SIFT_API_URL"], true);

const cutoffTime = format(addHours(new Date(), -1), "yyyy-MM-dd HH:mm:ss");
logger.debug(`cutoffTime: ${cutoffTime}`);

const rows = dbService
  .prepare<unknown[], RawProgramMatchRecord>(
    `
  SELECT * FROM titles
  WHERE status = 'reportedIncorrect'
  AND meta ->> 'adminEmailSent' IS NOT TRUE
  AND updatedAt < ?`,
  )
  .all(cutoffTime);

logger.info(`Found ${rows.length} records`);

for (const row of rows) {
  const rowMeta = JSON.parse(row.meta!) as {
    token: string;
    suggestedMatches: IndexedImdbTitle[];
    userSelectedMatch: IndexedImdbTitle | null;
  };
  const suggestions = rowMeta.suggestedMatches.map((m) => ({
    ...m,
    notes: [
      m.imdbId === row.imdbId ? "isPreviousMatch" : null,
      m.id === rowMeta.userSelectedMatch?.id ? "isUserSelectedMatch" : null,
    ]
      .filter((x) => x)
      .join(", "),
    pmUpdateLink: `${env.SIFT_API_URL!}/update-match-reported-incorrect?authToken=${env.SIFT_API_KEY!}&id=${row.id}&token=${rowMeta.token}&suggestionId=${m.id}`,
  }));
  await emailService.sendToDev({
    subject: "Sift: update incorrect match",
    body: emailService.precompiledTemplates.updateIncorrectMatchAdminEmail({
      matchRecord: row,
      suggestions,
    }),
  });

  dbService.updateProgramMatchRecord(row.id, {
    meta: JSON.stringify({ ...rowMeta, adminEmailSent: true }),
  });
}

logger.info("Done");
