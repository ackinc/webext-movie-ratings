import { limitThroughput } from "rate-limit-utils";
import { captureException } from "../common/errorReporter";
import { type ProgramData, type IMDBData, ErrorMessage } from "../common";

const MAX_REQ_PER_SECOND = 50;

type OmdbApiResponse =
  | {
      Error: string;
    }
  | {
      imdbID: string;
      imdbRating: string;
    };

export default class OmdbApiClient {
  fetch: typeof fetch;
  inFlight: Set<string> = new Set<string>();

  constructor(patchedFetch: typeof fetch) {
    this.fetch = limitThroughput(patchedFetch, MAX_REQ_PER_SECOND);
  }

  async fetchIMDBData(
    imdbIdOrProgram: string | ProgramData,
  ): Promise<IMDBData> {
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
    if (this.inFlight.has(url)) {
      throw new Error(ErrorMessage.ratingsApiRequestAlreadyInFlight);
    }

    try {
      this.inFlight.add(url);
      const response = await this.fetch(url);

      if (!response.ok) {
        throw new Error(
          ErrorMessage.ratingsApiRequestFailed +
            ` (status: ${response.status})`,
        );
      }

      const respBody = (await response.json()) as OmdbApiResponse;

      let result: IMDBData;
      if ("Error" in respBody) {
        if (!respBody.Error.includes("not found")) {
          captureException(new Error(`omdbApi error: ${respBody.Error}`), {
            context: { request: { url } },
          });
        }
        result = { imdbRating: "N/F", imdbId: imdbId ?? "" };
      } else {
        result = { imdbId: respBody.imdbID, imdbRating: respBody.imdbRating };
      }
      return result;
    } finally {
      this.inFlight.delete(url);
    }
  }
}
