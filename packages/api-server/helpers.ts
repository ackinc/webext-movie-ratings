import { Map as ImmutableMap, Set as ImmutableSet } from "immutable";
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
  };
  const suggestions = rowMeta.suggestedMatches.map((m) => ({
    ...m,
    notes: [m.imdbId === record.imdbId ? "isPreviousMatch" : null]
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
      userIndicatedNOTA: false,
    }),
  });
}

type CandidateId = string;
type VoterId = string;
interface ElectionOptions<
  K extends string,
  T extends { [P in K]: string } & { id: number },
> {
  isValidVote?: (vote: T) => boolean;
  minValidVotes?: number;
  minVotePercForWin?: number | ((nValidVotes: number) => number);
}
// one vote per voter, with later votes overriding previous
export function runElection<
  K extends string,
  T extends { [P in K]: string } & { id: number },
>(
  votes: T[],
  candidateIdField: K,
  voterIdField: K,
  {
    isValidVote = (_vote: T) => true,
    minValidVotes = 3,
    minVotePercForWin = 50,
  }: ElectionOptions<K, T> = {},
): string | null {
  const { voted, leader, nVotesForLeader } = votes
    .filter(isValidVote)
    .sort((a, b) => b.id - a.id)
    .reduce(
      (acc, vote) => {
        const { [candidateIdField]: cdtId, [voterIdField]: voterId } = vote;
        if (acc.voted.has(voterId)) return acc;

        const nVotesForCurCdt = (acc.votes.get(cdtId)?.size ?? 0) + 1;
        const thereIsNewLeader = nVotesForCurCdt > acc.nVotesForLeader;
        return {
          voted: acc.voted.add(voterId),
          votes: acc.votes.set(
            cdtId,
            (acc.votes.get(cdtId) ?? ImmutableSet<VoterId>()).add(voterId),
          ),
          leader: thereIsNewLeader ? cdtId : acc.leader,
          nVotesForLeader: thereIsNewLeader
            ? nVotesForCurCdt
            : acc.nVotesForLeader,
        };
      },
      {
        voted: ImmutableSet<VoterId>(),
        votes: ImmutableMap<CandidateId, ImmutableSet<VoterId>>(),
        leader: null,
        nVotesForLeader: 0,
      } as {
        voted: ImmutableSet<VoterId>;
        votes: ImmutableMap<CandidateId, ImmutableSet<VoterId>>;
        leader: CandidateId | null;
        nVotesForLeader: number;
      },
    );
  if (voted.size < minValidVotes) return null;

  const minVotesForWin =
    (voted.size *
      (typeof minVotePercForWin === "function"
        ? minVotePercForWin(voted.size)
        : minVotePercForWin)) /
    100;
  if (nVotesForLeader < minVotesForWin) return null;

  return leader;
}
