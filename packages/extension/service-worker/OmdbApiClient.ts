import { retry } from "siftutils";
import { limitThroughput } from "rate-limit-utils";
import { type ProgramData, type IMDBData, ErrorMessage } from "../common";
import { OmdbApiError } from "@common/customErrors";

// we want to behave well when dealing with OMDB
const MAX_REQ_PER_SECOND = 50;

type OmdbApiResponse =
  | {
      Error: string;
    }
  | {
      imdbID: string;
      imdbRating: string;
    };
type IMDBDataFromOMDB = Omit<IMDBData, "imdbRating"> & {
  imdbRating: Exclude<IMDBData["imdbRating"], "N/M">;
};

export default class OmdbApiClient {
  fetch: typeof fetch;

  constructor(patchedFetch: typeof fetch) {
    this.fetch = limitThroughput(patchedFetch, MAX_REQ_PER_SECOND);
    this.fetchIMDBData = retry(this.fetchIMDBData.bind(this), {
      type: "exponential",
      n: 2,
      maxRetries: 5,
    });
  }

  async fetchIMDBData(
    imdbIdOrProgram: string | ProgramData,
  ): Promise<IMDBDataFromOMDB> {
    const imdbId = typeof imdbIdOrProgram === "string" ? imdbIdOrProgram : null;
    let searchParams: URLSearchParams;

    if (typeof imdbIdOrProgram === "string") {
      searchParams = new URLSearchParams({ apiKey: OMDB_API_KEY, i: imdbId! });
    } else {
      const { title, type, year } = imdbIdOrProgram;
      searchParams = new URLSearchParams({ apiKey: OMDB_API_KEY, t: title });
      if (type) searchParams.set("type", type);
      if (year) searchParams.set("y", String(year));
    }

    const url = `https://www.omdbapi.com/?${searchParams.toString()}`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        throw new OmdbApiError(
          ErrorMessage.ratingsApiRequestFailed +
            ` (status: ${response.status})`,
          url,
        );
      }

      const respBody = (await response.json()) as OmdbApiResponse;

      let result: IMDBDataFromOMDB;
      if ("Error" in respBody) {
        if (respBody.Error.includes("not found")) {
          result = { imdbRating: "N/F", imdbId: imdbId ?? "" };
        } else {
          throw new OmdbApiError(respBody.Error, url);
        }
      } else {
        const imdbRating =
          respBody.imdbRating === "N/A"
            ? "N/A"
            : parseFloat(respBody.imdbRating);
        if (Number.isNaN(imdbRating)) {
          throw new Error(`Unexpected imdbRating: ${respBody.imdbRating}`);
        }
        result = { imdbId: respBody.imdbID, imdbRating };
      }
      return result;
    } catch (e) {
      if (e instanceof OmdbApiError) throw e;
      throw new OmdbApiError("Error fetching data from OMDB API", url, {
        cause: e,
      });
    }
  }
}
