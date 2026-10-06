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
    userSelectedMatch: IndexedImdbTitle;
  };
  const suggestions = rowMeta.suggestedMatches.map((m) => ({
    ...m,
    notes: [
      m.imdbId === record.imdbId ? "isPreviousMatch" : null,
      m.id === rowMeta.userSelectedMatch.id ? "isUserSelectedMatch" : null,
    ]
      .filter((x) => x)
      .join(", "),
    pmUpdateLink: `${env.SIFT_API_URL}/update-match-reported-incorrect?authToken=${env.SIFT_API_KEY}&id=${record.id}&token=${rowMeta.token}&suggestionId=${m.id}`,
  }));
  await emailService.sendToDev({
    subject: "Sift: update incorrect match",
    body: emailService.precompiledTemplates.updateIncorrectMatchAdminEmail({
      matchRecord: record,
      searchUrl:
        (supportedSites[record.site as Sitename].search || "#") + record.title,
      suggestions,
    }),
  });
}
