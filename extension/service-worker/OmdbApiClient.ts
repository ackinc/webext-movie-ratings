import { limitThroughput } from "rate-limit-utils";
import { pick, type Program, type IMDBData } from "../common";

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

  constructor(patchedFetch: typeof fetch) {
    this.fetch = limitThroughput(patchedFetch, MAX_REQ_PER_SECOND);
  }

  async fetchIMDBData(program: Omit<Program, "node">): Promise<IMDBData> {
    const { title, type, year } = program;
    const searchParams = new URLSearchParams({
      apiKey: OMDB_API_KEY,
      t: title,
    });
    if (type) searchParams.set("type", type);
    if (year) searchParams.set("y", year);

    const response = await this.fetch(
      `https://www.omdbapi.com/?${searchParams.toString()}`,
    );
    const respBody = (await response.json()) as OmdbApiResponse;

    let result: IMDBData;
    if ("Error" in respBody) {
      if (!respBody.Error.includes("not found")) {
        throw new Error(respBody.Error);
      }
      result = { imdbRating: "N/F", imdbID: "" };
    } else {
      result = pick(respBody, ["imdbID", "imdbRating"]) as IMDBData;
    }

    return result;
  }
}
