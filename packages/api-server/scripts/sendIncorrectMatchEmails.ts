#!/usr/bin/env node

import "dotenv/config";
import { addHours, format } from "date-fns";
import dbService from "../services/dbService.ts";
import type { RawProgramMatchRecord } from "../types.ts";
import { sendAdminEmailToUpdateIncorrectMatch } from "../helpers.ts";
import logger from "../services/logger.ts";

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
  await sendAdminEmailToUpdateIncorrectMatch(row);
  dbService.updateProgramMatchRecord(row.id, {
    meta: JSON.stringify({ ...JSON.parse(row.meta!), adminEmailSent: true }),
  });
}

logger.info("Done");
