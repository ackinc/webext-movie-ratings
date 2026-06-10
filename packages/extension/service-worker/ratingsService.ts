import { addWeeks } from "date-fns";
import { type IMDBData, type ProgramData } from "@common";
import TelemetryStore from "@common/TelemetryStore";
import * as siftApiService from "@common/siftApiService";
import OmdbApiClient from "./OmdbApiClient";

let telemetryStore: TelemetryStore;
let omdbApiClient: OmdbApiClient;
let inProgress: Record<
  string,
  { resolve: (x: ImdbDataFetchResult) => void; reject: (e: Error) => void }[]
>;

export function initialize(teleStore: TelemetryStore) {
  omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);
  telemetryStore = teleStore;
  inProgress = {};
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

interface ImdbDataFetchResult {
  imdbData: IMDBData;
  expiry: Date;
}
export async function fetchIMDBData(
  imdbIdOrProgram: string | ProgramData,
  pageUrl: string,
): Promise<ImdbDataFetchResult> {
  return new Promise<ImdbDataFetchResult>((resolve, reject) => {
    const key = getKey();
    if (key in inProgress) {
      inProgress[key]!.push({ resolve, reject });
    } else {
      inProgress[key] = [{ resolve, reject }];
      helper(key);
    }
  });

  async function helper(key: string) {
    let result: ImdbDataFetchResult;
    let error: Error;
    try {
      let imdbData = await omdbApiClient.fetchIMDBData(imdbIdOrProgram);

      if (!(typeof imdbIdOrProgram === "string" || imdbData.imdbID)) {
        // we didn't have the program's imdb id, and the omdb api wasn't
        //   able to figure it out based on the program's details; let's see
        //   if sift's program-matching can do it
        const { imdbId: matchedImdbId } = await siftApiService.getMatchedImdbId(
          imdbIdOrProgram as ProgramData,
          pageUrl,
        );

        if (matchedImdbId) {
          // try to get the imdb data from omdb by querying with the
          //   imdb id we just matched this program to
          imdbData = await omdbApiClient.fetchIMDBData(matchedImdbId);
        }
      }

      result = {
        imdbData,
        expiry: addWeeks(new Date(), imdbData.imdbRating === "N/F" ? 1 : 2),
      };
    } catch (e) {
      error =
        e instanceof Error
          ? e
          : new Error("Error fetching imdb data", { cause: e });
    } finally {
      inProgress[key]!.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(result),
      );
      delete inProgress[key];
    }
  }

  function getKey() {
    if (typeof imdbIdOrProgram === "string") return imdbIdOrProgram;
    return JSON.stringify(imdbIdOrProgram);
  }
}
