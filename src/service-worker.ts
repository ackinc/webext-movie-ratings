import { ONE_HOUR_IN_MS, ONE_WEEK_IN_MS, browser, omit } from "./common";
import type {
  Program,
  IMDBData,
  CachedIMDBData,
  SWErrorResponse,
  OmdbApiResponse,
} from "./common/types";
import { getSetting, setSetting, MessageType, SettingsKey } from "./common";
import { captureException } from "./common/errorReporter";

const nfRatingCacheTime = ONE_HOUR_IN_MS * 6;
const imdbRatingCacheTime = ONE_WEEK_IN_MS * 2;

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(async () => {
  if (await getSetting(SettingsKey.popupSeenAtLeastOnce)) return;
  browser.action?.openPopup();
  await setSetting(SettingsKey.popupSeenAtLeastOnce, true);
});

function handleMessage(
  request: { type: keyof typeof MessageType; data: unknown },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (arg: IMDBData | SWErrorResponse) => void,
) {
  if (request.type === MessageType.fetchIMDBRating) {
    const program = request.data as Omit<Program, "node">;
    fetchIMDBData(program)
      .then((data) => sendResponse(data))
      .catch((e) => {
        const error = e instanceof Error ? e : new Error(e.toString());
        error.message = `Failed to fetch rating. Program: ${JSON.stringify(program)}. Error: ${error.message}`;
        sendResponse({ error });
        captureException(error);
      });
  } else {
    const err = new Error(`Unknown message type: ${request.type}`);
    captureException(err);
    throw err;
  }

  return true;
}

async function fetchIMDBData(
  program: Omit<Program, "node">,
): Promise<IMDBData> {
  const key = getCacheKey(program);

  const { [key]: cached } = await browser.storage.local.get(key);
  if (checkCachedDataIsUsable(cached as CachedIMDBData | undefined)) {
    return omit(cached as CachedIMDBData, ["expiry"]) as IMDBData;
  }

  const { title, type, year } = program;
  const searchParams = new URLSearchParams({
    apiKey: BUILDTIME_ENV.OMDB_API_KEY,
    t: title,
  });
  if (type) searchParams.set("type", type);
  if (year) searchParams.set("y", year);

  const response = await fetch(
    `https://www.omdbapi.com/?${searchParams.toString()}`,
  );
  const respBody = (await response.json()) as OmdbApiResponse;

  let result: CachedIMDBData;
  if ("Error" in respBody) {
    if (respBody.Error.includes("not found")) {
      result = {
        imdbRating: "N/F",
        imdbID: "",
        expiry: +new Date() + nfRatingCacheTime,
      };
    } else {
      throw new Error(respBody.Error);
    }
  } else {
    const { imdbID, imdbRating } = respBody;
    result = {
      imdbRating,
      imdbID,
      expiry: +new Date() + imdbRatingCacheTime,
    };
  }

  browser.storage.local.set({ [key]: result });
  return omit(result, ["expiry"]) as IMDBData;
}

function getCacheKey(program: Omit<Program, "node">): string {
  const { title, type, year } = program;
  return btoa(
    [title.replace(/[^\w\s]/g, "").toLowerCase(), type, year]
      .filter(Boolean)
      .join("|"),
  );
}

function checkCachedDataIsUsable(data: CachedIMDBData | undefined): boolean {
  return Boolean(
    data &&
    data.imdbRating &&
    (data.imdbID || data.imdbRating === "N/F") &&
    data.expiry > +new Date(),
  );
}
