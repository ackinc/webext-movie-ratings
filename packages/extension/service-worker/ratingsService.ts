import { type IDBPDatabase } from "idb";
import { add } from "date-fns";
import {
  pick,
  omit,
  getSetting,
  programToHash,
  hostToSitename,
  type CachedIMDBData,
  type IMDBData,
  type ProgramData,
  type Program,
} from "@common";
import RatingsCache, { type RatingsCacheSchema } from "@common/RatingsCache";
import TelemetryStore, {
  type TelemetryStoreSchema,
} from "@common/TelemetryStore";
import * as siftApiService from "@common/siftApiService";
import OmdbApiClient from "./OmdbApiClient";

/* interface */

export interface RatingsService {
  getCachedIMDBData(
    program: ProgramData,
    pageUrl: string,
  ): Promise<CachedIMDBData | undefined>;
  getIMDBData(program: ProgramData, pageUrl: string): Promise<IMDBData>;
  markRatingAsIncorrect(
    program: Omit<Program, "node" | "container">,
    imdbData: IMDBData,
    pageUrl: string,
  ): Promise<void>;
  undoMarkRatingAsIncorrect(
    program: Omit<Program, "node" | "container">,
    imdbData: IMDBData,
    pageUrl: string,
  ): Promise<void>;
}

let inProgress: Record<
  string,
  { resolve: (x: IMDBData) => void; reject: (e: Error) => void }[]
>;
let omdbApiClient: OmdbApiClient;
let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;
const ratingCacheDurations = {
  // NOTE: WHY_CACHE_ON_PROGRAM_MATCHING_ERROR
  // Q: Why cache the result on a program-matching error, instead
  //      of just throwing like we would for a regular error?
  // A: So we have a 'breadcrumb' we can use to detect this state
  //      the next time we need to get the rating for this program
  onProgramMatchingError: { minutes: -1 },
  onRatingNotFound: { weeks: 1 },
  onRatingFound: { weeks: 2 },
};

export async function initialize(db: IDBPDatabase): Promise<RatingsService> {
  inProgress = {};
  omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);
  ratingsCache = await RatingsCache.create(
    db as IDBPDatabase<RatingsCacheSchema>,
  );
  if (FF_TELEMETRY_ENABLED) {
    telemetryStore = await TelemetryStore.create(
      db as IDBPDatabase<TelemetryStoreSchema>,
    );
  }
  return {
    getIMDBData,
    getCachedIMDBData,
    markRatingAsIncorrect,
    undoMarkRatingAsIncorrect,
  };
}

/* implementation details */

async function fetchWithAddedTelemetry(
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> {
  const startTime = +new Date();

  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_REQUEST_MADE",
      data: { startTime },
    });
  }

  const response = await fetch(...args);
  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_RESPONSE_RECEIVED",
      data: {
        startTime,
        durationMs: +new Date() - startTime,
      },
    });
  }

  return response;
}

async function getIMDBData(
  program: Omit<Program, "node" | "container">,
  pageUrl: string,
): Promise<IMDBData> {
  const cached = await getCachedIMDBData(program, pageUrl);
  if (cached && cached.expiry > +new Date()) {
    return omit(cached, ["key"] as const);
  }

  return new Promise<IMDBData>((resolve, reject) => {
    const key = programToHash(program);
    if (key in inProgress) {
      inProgress[key]!.push({ resolve, reject });
    } else {
      inProgress[key] = [{ resolve, reject }];
      helper(key);
    }
  });

  async function helper(key: string) {
    let imdbData: IMDBData | null = null;
    let error: Error | null = null;

    const siftProgramMatchingEnabled = Boolean(
      await getSetting("errorReportingOptIn"),
    );

    try {
      const skipOptimisticOmdbRequest =
        siftProgramMatchingEnabled && cached?.imdbRating === "N/M";
      if (skipOptimisticOmdbRequest) {
        // if we're here, it means the last time this function was called for
        //   this program, there was:
        //   a) an N/F response from omdb api
        //   b) a (temporary) error from the sift program-matching api
        // we'll skip the optimistic omdb api request because we'll
        //   just get an N/F again
      } else {
        // the cached imdbId may be '' (from a cached N/F rating), so we
        //   cannot use '??' operator below
        imdbData = await omdbApiClient.fetchIMDBData(cached?.imdbId || program);
      }

      if (siftProgramMatchingEnabled && !cached?.imdbId && !imdbData?.imdbId) {
        // we didn't have the program's imdb id, and the omdb api wasn't
        //   able to figure it out based on the program's details; let's see
        //   if sift's program-matching can do it
        const { imdbId: matchedImdbId } = await siftApiService
          .getMatchedImdbId(program, pageUrl)
          .catch(() => (imdbData = { imdbId: "", imdbRating: "N/M" }));

        if (matchedImdbId) {
          // try to get the imdb data from omdb by querying with the
          //   imdb id we just matched this program to
          imdbData = await omdbApiClient.fetchIMDBData(matchedImdbId);
        }
      }
    } catch (e) {
      error =
        e instanceof Error
          ? e
          : new Error("Error fetching imdb data", { cause: e });
    } finally {
      if (error) {
        inProgress[key]!.forEach(({ reject }) => reject(error!));
        delete inProgress[key];
      } else {
        const expiry = +add(
          new Date(),
          imdbData!.imdbRating === "N/M"
            ? // See NOTE: WHY_CACHE_ON_PROGRAM_MATCHING_ERROR
              ratingCacheDurations.onProgramMatchingError
            : imdbData!.imdbRating === "N/F"
              ? ratingCacheDurations.onRatingNotFound
              : ratingCacheDurations.onRatingFound,
        );
        inProgress[key]!.forEach(({ resolve }) =>
          resolve({ ...imdbData!, expiry }),
        );
        delete inProgress[key];

        await ratingsCache.putOne({ ...imdbData!, expiry, key });
      }
    }
  }
}

async function getCachedIMDBData(
  program: Omit<Program, "node" | "container">,
  pageUrl: string,
): Promise<CachedIMDBData | undefined> {
  const cached = await ratingsCache.get(programToHash(program));

  const incorrectRatingReportKey = getIncorrectRatingReportKey(
    program,
    pageUrl,
  );
  const wasReportedIncorrect = Boolean(
    await ratingsCache.getIncorrectRatingReport(incorrectRatingReportKey),
  );

  return cached ? Object.assign(cached, { wasReportedIncorrect }) : cached;
}

async function markRatingAsIncorrect(
  program: Omit<Program, "node" | "container">,
  imdbData: IMDBData,
  pageUrl: string,
) {
  const key = getIncorrectRatingReportKey(program, pageUrl);
  await ratingsCache.putIncorrectRatingReport({
    key,
    ...program,
    ...imdbData,
    wasReportedIncorrect: true,
    pageUrl,
    reportedAt: +new Date(),
  });

  // TODO: send after a delay, and make it cancelable, so the user has time to
  //   undo a misclick
  await siftApiService.sendUserFeedback(
    JSON.stringify({
      ...program,
      ...pick(imdbData, ["imdbId", "imdbRating"]),
      pageUrl,
    }),
    undefined,
    "incorrect-rating-report",
  );
}

export async function undoMarkRatingAsIncorrect(
  program: Omit<Program, "node" | "container">,
  _imdbData: IMDBData,
  pageUrl: string,
) {
  const key = getIncorrectRatingReportKey(program, pageUrl);
  await ratingsCache.removeIncorrectRatingReport(key);
}

function getIncorrectRatingReportKey(
  program: Omit<Program, "node" | "container">,
  pageUrl: string,
) {
  const site = hostToSitename[new URL(pageUrl).hostname]!;
  return [programToHash(program), site].join("|");
}
