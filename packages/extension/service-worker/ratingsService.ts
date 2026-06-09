import { addWeeks } from "date-fns";
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
}
export async function fetchIMDBData(
  imdbIdOrProgram: string | ProgramData,
  pageUrl: string,
): Promise<ImdbDataFetchResult> {
  let imdbData = await omdbApiClient.fetchIMDBData(imdbIdOrProgram);
  // represents whether we have the imdbId for the program
  let matchStatus: SiftApiProgramMatching.Response["status"] | undefined =
    undefined;

  if (typeof imdbIdOrProgram === "string" || imdbData.imdbID) {
    matchStatus = "matched";
  } else {
    // we didn't have the program's imdb id, and the omdb api wasn't
    //   able to figure it out based on the program's details; let's see
    //   if sift's program-matching can do it
    let matchedImdbId;
    ({ status: matchStatus, imdbId: matchedImdbId } =
      await siftApiService.getMatchedImdbId(
        imdbIdOrProgram as ProgramData,
        pageUrl,
      ));

    if (matchedImdbId) {
      // try to get the imdb data from omdb by querying with the
      //   imdb id we just matched this program to
      imdbData = await omdbApiClient.fetchIMDBData(matchedImdbId);
    }
  }

  const expiry = addWeeks(new Date(), imdbData.imdbRating === "N/F" ? 1 : 2);
  return { imdbData, expiry };
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
