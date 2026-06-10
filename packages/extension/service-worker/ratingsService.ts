import { type IDBPDatabase } from "idb";
import { addWeeks } from "date-fns";
import {
  ErrorMessage,
  omit,
  programToHash,
  type CachedIMDBData,
  type IMDBData,
  type ProgramData,
} from "@common";
import RatingsCache, { type RatingsCacheSchema } from "@common/RatingsCache";
import TelemetryStore, {
  type TelemetryStoreSchema,
} from "@common/TelemetryStore";
import * as siftApiService from "@common/siftApiService";
import OmdbApiClient from "./OmdbApiClient";

let inProgress: Record<
  string,
  { resolve: (x: Required<IMDBData>) => void; reject: (e: Error) => void }[]
>;
let omdbApiClient: OmdbApiClient;
let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;

export async function initialize(db: IDBPDatabase) {
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
}

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

export async function getIMDBData(
  program: ProgramData,
  pageUrl: string,
): Promise<Required<IMDBData>> {
  return new Promise<Required<IMDBData>>((resolve, reject) => {
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

    try {
      const cached = await getCachedIMDBData(program);
      if (cached && cached.expiry > +new Date()) {
        imdbData = omit(cached, ["key"] as const);
        return;
      }

      const cachedImdbId = cached?.imdbId;

      // cachedImdbId may be '' (from a cached N/F rating), so we cannot
      //   use '??' operator below
      imdbData = await omdbApiClient.fetchIMDBData(cachedImdbId || program);

      if (!cachedImdbId && !imdbData.imdbId) {
        // we didn't have the program's imdb id, and the omdb api wasn't
        //   able to figure it out based on the program's details; let's see
        //   if sift's program-matching can do it
        const { imdbId: matchedImdbId } = await siftApiService.getMatchedImdbId(
          program,
          pageUrl,
        );

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
        const expiry = +addWeeks(
          new Date(),
          imdbData!.imdbRating === "N/F" ? 1 : 2,
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

export async function getCachedIMDBData(
  program: ProgramData,
): Promise<CachedIMDBData | undefined> {
  if (!ratingsCache) throw new Error(ErrorMessage.ratingsServiceNotInitialized);
  return await ratingsCache.get(programToHash(program));
}
