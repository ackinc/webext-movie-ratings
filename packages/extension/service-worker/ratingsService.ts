import { type IDBPDatabase } from "idb";
import { add } from "date-fns";
import { urlToSitename, type Sitename } from "siftcore";
import { dedupe, pick } from "siftutils";
import {
  omit,
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
  getCachedIMDBData: typeof getCachedIMDBData;
  getIMDBData: typeof getIMDBData;
  markRatingAsIncorrect: typeof markRatingAsIncorrect;
  undoMarkRatingAsIncorrect: typeof undoMarkRatingAsIncorrect;
  changeMatchedImdbTitleForProgram: typeof changeMatchedImdbTitleForProgram;
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
    changeMatchedImdbTitleForProgram,
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

function getMergedProgramData(
  program: Omit<Program, "node" | "container">,
): ProgramData {
  return (program.linked ?? []).reduce(
    (acc, p) => {
      if (!("type" in acc) && "type" in p) acc.type = p.type;
      if (!("year" in acc) && "year" in p) acc.year = p.year;
      return acc;
    },
    pick(program, ["title", "type", "year"]),
  );
}

async function getIMDBData(
  program: Omit<Program, "node" | "container">,
  pageUrl: string,
): Promise<IMDBData> {
  const site = urlToSitename(pageUrl);

  const cached = await getCachedIMDBData(program, pageUrl);
  if (cached && cached.expiry > +new Date()) {
    return omit(cached, ["key"] as const);
  }

  return new Promise<IMDBData>((resolve, reject) => {
    const key = pickleProgram(program);
    // TODO: think through potential race conditions here
    //   What if a nhpn req w/o ohpn link is in-progress when
    //   a new nhpn-ohpn-linked msg arrives
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

    // we want to give our rating providers the best chance of
    //   accurately matching this program by giving them all the
    //   data we have about it
    // this data may be spread across multiple linked program-nodes,
    //   for ex: a non-hover pnode and its associated on-hover pnode
    const programData = getMergedProgramData(program);

    try {
      if (cached?.imdbRating === "N/M") {
        // if we're here, it means the last time this function was called for
        //   this program, there was:
        //   a) an N/F response from omdb api
        //   b) a (temporary) error from the sift program-matching api
        // we'll skip the optimistic omdb api request because we'll
        //   just get an N/F again
      } else {
        // the cached imdbId may be '' (from a cached N/F rating), so we
        //   cannot use '??' operator below
        imdbData = await omdbApiClient.fetchIMDBData(
          cached?.imdbId || programData,
        );
      }

      if (!(cached?.imdbId || imdbData?.imdbId)) {
        // we didn't have the program's imdb id, and (if we didn't skip the
        //   optimistic omdb api request above) omdb wasn't able to
        //   figure it out based on the program's details; let's see if sift's
        //   program-matching can do it
        imdbData = await siftApiService.fetchIMDBData(programData, pageUrl);
      }

      const expiry = +add(
        new Date(),
        imdbData!.imdbRating === "N/M"
          ? // See NOTE: WHY_CACHE_ON_PROGRAM_MATCHING_ERROR
            ratingCacheDurations.onProgramMatchingError
          : imdbData!.imdbRating === "N/F"
            ? ratingCacheDurations.onRatingNotFound
            : ratingCacheDurations.onRatingFound,
      );

      await Promise.all([
        // non-site-specific cache-entry
        ratingsCache.putOne({
          ...imdbData!,
          expiry,
          key: pickleProgram(programData),
        }),
        // site-specific cache entries for the program, each of the linked
        //   pnodes and for the combined programData object we sent to the
        //   rating-providers in the first place
        ratingsCache.put(
          [program, programData, ...(program.linked ?? [])].map((p) => ({
            ...imdbData!,
            expiry,
            key: pickleProgram(p, site),
          })),
        ),
      ]);

      inProgress[key]!.forEach(({ resolve }) =>
        resolve({ ...imdbData!, expiry }),
      );
    } catch (e) {
      error =
        e instanceof Error
          ? e
          : new Error("Error fetching imdb data", { cause: e });
      inProgress[key]!.forEach(({ reject }) => reject(error!));
    } finally {
      delete inProgress[key];
    }
  }
}

async function getCachedIMDBData(
  program: Omit<Program, "node" | "container">,
  pageUrl: string,
): Promise<CachedIMDBData | undefined> {
  const site = urlToSitename(pageUrl);
  return (
    (await ratingsCache.get(pickleProgram(program, site))) ??
    (await ratingsCache.get(pickleProgram(program)))
  );
}

async function markRatingAsIncorrect(
  program: Omit<Program, "node" | "container">,
  imdbData: IMDBData,
  pageUrl: string,
) {
  const site = urlToSitename(pageUrl);
  const expiry = +add(new Date(), ratingCacheDurations.onRatingFound);
  const cacheKeysToUpdate = dedupe(
    [program, getMergedProgramData(program), ...(program.linked ?? [])].map(
      (p) => pickleProgram(p, site),
    ),
  );
  const updateObj = {
    ...pick(imdbData, ["imdbId", "imdbRating"]),
    expiry,
    wasReportedIncorrect: true,
  };
  await ratingsCache.put(
    cacheKeysToUpdate.map((key) => ({ ...updateObj, key })),
  );

  return await siftApiService.reportIncorrectProgramMatch(
    program,
    imdbData.imdbId,
    pageUrl,
  );
}

async function undoMarkRatingAsIncorrect(
  program: Omit<Program, "node" | "container">,
  imdbData: IMDBData,
  pageUrl: string,
) {
  const site = urlToSitename(pageUrl);
  const expiry = +add(new Date(), ratingCacheDurations.onRatingFound);
  const cacheKeysToUpdate = dedupe(
    [program, getMergedProgramData(program), ...(program.linked ?? [])].map(
      (p) => pickleProgram(p, site),
    ),
  );
  const updateObj = {
    ...pick(imdbData, ["imdbId", "imdbRating"]),
    expiry,
    wasReportedIncorrect: false,
  };
  await ratingsCache.put(
    cacheKeysToUpdate.map((key) => ({ ...updateObj, key })),
  );
}

async function changeMatchedImdbTitleForProgram(
  program: Omit<Program, "node" | "container">,
  imdbData: IMDBData | null,
  pageUrl: string,
  serverSideRowId: number | undefined,
  token: string | undefined,
) {
  const site = urlToSitename(pageUrl);

  if (imdbData) {
    const expiry = +add(new Date(), ratingCacheDurations.onRatingFound);
    const cacheKeysToUpdate = dedupe(
      [program, getMergedProgramData(program), ...(program.linked ?? [])].map(
        (p) => pickleProgram(p, site),
      ),
    );
    const updateObj = {
      ...pick(imdbData, ["imdbId", "imdbRating"]),
      wasReportedIncorrect: false,
      expiry,
    };
    await ratingsCache.put(
      cacheKeysToUpdate.map((key) => ({ ...updateObj, key })),
    );
  }

  if (serverSideRowId && token) {
    siftApiService.updateIncorrectMatchReport({
      id: serverSideRowId,
      token,
      suggestedImdbId: imdbData?.imdbId ?? "",
    });
  }
}

function pickleProgram(program: ProgramData, site?: Sitename): string {
  const { title, type, year } = program;
  // using btoa directly on a title with non-latin1 chars (without
  //   encoding to utf-8 first) will cause an error to be thrown
  const utf8EncodedTitle = String.fromCharCode(
    ...new TextEncoder().encode(title),
  );
  return (
    btoa(
      [utf8EncodedTitle.replace(/[^\w\s]/g, "").toLowerCase(), type, year, site]
        .filter(Boolean)
        .join("|"),
    ) + (site ? `|${site}` : ``)
  );
}
