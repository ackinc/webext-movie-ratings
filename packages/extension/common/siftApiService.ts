import { browser } from "./constants";
import type { IMDBData, ProgramData } from "./types";
import { pick, retry } from "siftutils";
import type {
  Notification,
  SiftApiProgramMatching,
  UserMessage,
} from "siftcore";
import { ErrorMessage } from ".";

const retryStrategy = {
  type: "exponential",
  n: 2,
  maxRetries: 5,
} as const;

export const fetchIMDBData = retry(fetchIMDBData_, retryStrategy);
export const sendUserFeedback = retry(sendUserFeedback_, retryStrategy);
export const getNotifications = retry(getNotifications_, retryStrategy);
export const reportIncorrectProgramMatch = reportIncorrectProgramMatch_;
export const updateIncorrectMatchReport = updateIncorrectMatchReport_;

async function patchedFetch(url: string | URL, opts?: RequestInit) {
  opts = {
    ...opts,
    headers: {
      ...opts?.headers,
      "x-sift-extension-version": browser.runtime.getManifest().version,
    },
  };
  return await fetch(url, opts);
}

async function fetchIMDBData_(
  programData: ProgramData,
  pageUrl: string,
): Promise<IMDBData> {
  const url = new URL(`${SIFT_API_URL}/imdbId`);

  const searchParams = {
    ...pick(programData, ["title", "type", "year"]),
    pageUrl,
  } satisfies SiftApiProgramMatching.Request;
  url.search = new URLSearchParams(
    // bit of harmless type coercion to avoid a type error; the
    //   URLSearchParams constructor will convert the numeric 'year'
    //   into a string automatically
    searchParams as unknown as Record<string, string>,
  ).toString();

  const response = await patchedFetch(url);
  if (!response.ok) {
    if (response.status < 500) {
      const errorMsg = await response
        .json()
        .then((body) => body.error ?? JSON.stringify(body))
        .catch(() => response.text());
      throw new Error(
        `Error calling sift's program-matching API. Status: ${response.status}. Error: ${errorMsg}`,
      );
    }

    return { imdbId: "", imdbRating: "N/M" };
  }

  const body = (await response.json()) as SiftApiProgramMatching.Response;
  return body.status === "matched"
    ? {
        imdbId: body.imdbId,
        imdbRating: body.imdbRating ?? "N/A",
      }
    : { imdbId: "", imdbRating: "N/F" };
}

async function sendUserFeedback_(
  message: string,
  email: string = "",
  category: UserMessage["category"] = "feedback",
) {
  const url = new URL(`${SIFT_API_URL}/messages`);

  const response = await patchedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      message,
      ...(email ? { email } : {}),
    } satisfies UserMessage),
  });
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);
}

async function getNotifications_(
  from: Date,
): Promise<Required<Notification>[]> {
  const url = new URL(`${SIFT_API_URL}/notifications`);
  url.searchParams.append("from", String(+from));
  const response = await patchedFetch(url);
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);
  const { notifications } = await response.json();
  return notifications;
}

async function reportIncorrectProgramMatch_(
  program: ProgramData,
  imdbId: string,
  pageUrl: string,
) {
  const url = new URL(`${SIFT_API_URL}/incorrect-matches`);

  const response = await patchedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...pick(program, ["title", "type", "year"]),
      imdbId,
      pageUrl,
    } satisfies SiftApiProgramMatching.IncorrectMatchReportRequest),
  });
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);

  const body: SiftApiProgramMatching.IncorrectMatchReportResponse =
    await response.json();
  return body;
}

async function updateIncorrectMatchReport_(
  data: Omit<
    SiftApiProgramMatching.AddSuggestionToIncorrectMatchReportRequest,
    "authToken"
  >,
) {
  const url = new URL(`${SIFT_API_URL}/update-match-reported-incorrect`);

  const response = await patchedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);
}
