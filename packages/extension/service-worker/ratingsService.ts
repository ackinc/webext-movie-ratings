import { addWeeks, addMinutes } from "date-fns";
import { type SiftApiProgramMatching } from "sifttypes";
import { type IMDBData, type ProgramData } from "@common";
import TelemetryStore from "@common/TelemetryStore";
import * as siftApiService from "@common/siftApiService";
import OmdbApiClient from "./OmdbApiClient";

let telemetryStore: TelemetryStore;
let omdbApiClient: OmdbApiClient;

export function initialize(teleStore: TelemetryStore) {
  omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);
  telemetryStore = teleStore;
}

interface ImdbDataFetchResult {
  imdbData: IMDBData;
  expiry: Date;
  error: Error | undefined;
}
export async function fetchIMDBData(
  imdbIdOrProgram: string | ProgramData,
  pageUrl: string,
): Promise<ImdbDataFetchResult> {
  let imdbData = await omdbApiClient.fetchIMDBData(imdbIdOrProgram);
  // represents whether we have the imdbId for the program
  let matchStatus:
    | SiftApiProgramMatching.Response["status"]
    | "error"
    | undefined = undefined;
  let error: Error | undefined = undefined;

  if (typeof imdbIdOrProgram === "string" || imdbData.imdbID) {
    matchStatus = "matched";
  } else {
    // we didn't have the program's imdb id, and the omdb api wasn't
    //   able to figure it out based on the program's details; let's see
    //   if sift's program-matching can do it
    let matchedImdbId;
    try {
      ({ status: matchStatus, imdbId: matchedImdbId } =
        await siftApiService.getMatchedImdbId(
          imdbIdOrProgram as ProgramData,
          pageUrl,
        ));
    } catch (e) {
      // if there's an error here, we want to make sure we cache the N/F
      //   rating for a short while so we give the Sift server-side some
      //   breathing room to fix the error
      // so instead of throwing immediately, we'll throw later downstream,
      //   after the caching step
      matchStatus = "error";
      error = e as Error;
    }

    if (matchedImdbId) {
      // try to get the imdb data from omdb by querying with the
      //   imdb id we just matched this program to
      imdbData = await omdbApiClient.fetchIMDBData(matchedImdbId);
    }
  }

  let expiry: Date;
  if (imdbData.imdbRating !== "N/F") {
    expiry = addWeeks(new Date(), 2);
  } else if (matchStatus === "abandoned") {
    expiry = addWeeks(new Date(), 1);
  } else if (matchStatus === "error") {
    expiry = addMinutes(new Date(), 15);
  } else {
    throw new Error(`Unexpected: matchStatus '${matchStatus}'`);
  }

  return { imdbData, error, expiry };
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
