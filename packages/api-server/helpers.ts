import * as emailService from "./services/emailService.ts";
import { supportedSites, type Sitename, type IndexedImdbTitle } from "siftcore";
import { pick } from "siftutils";
import type { ProgramMatchRecord, RawProgramMatchRecord } from "./types.ts";

const env = pick(process.env, ["SIFT_API_URL", "SIFT_API_KEY"], true);

export async function sendAdminEmailToUpdateIncorrectMatch(
  record: ProgramMatchRecord | RawProgramMatchRecord,
) {
  const rowMeta = JSON.parse(record.meta!) as {
    token: string;
    suggestedMatches: IndexedImdbTitle[];
    userSelectedImdbId: IndexedImdbTitle["imdbId"] | "none-of-the-above" | null;
  };
  const suggestions = rowMeta.suggestedMatches.map((m) => ({
    ...m,
    notes: [
      m.imdbId === record.imdbId ? "isPreviousMatch" : null,
      m.imdbId === rowMeta.userSelectedImdbId ? "isUserSelectedMatch" : null,
    ]
      .filter((x) => x)
      .join(", "),
    pmUpdateLink: `${env.SIFT_API_URL}/update-match-reported-incorrect?authToken=${env.SIFT_API_KEY}&id=${record.id}&token=${rowMeta.token}&suggestedImdbId=${m.imdbId}`,
  }));
  await emailService.sendToDev({
    subject: "Sift: update incorrect match",
    body: emailService.precompiledTemplates.updateIncorrectMatchAdminEmail({
      matchRecord: record,
      searchUrl:
        (supportedSites[record.site as Sitename].search || "#") + record.title,
      suggestions,
      userIndicatedNOTA: rowMeta.userSelectedImdbId === "none-of-the-above",
    }),
  });
}
