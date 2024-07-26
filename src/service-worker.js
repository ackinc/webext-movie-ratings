import { ONE_DAY_IN_MS, TWO_WEEKS_IN_MS } from "./common";

const OMDB_API_KEY = "d7991986";

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request.type === "fetchIMDBRating") {
    fetchIMDBRating(request.data).then((rating) => sendResponse({ rating }));
  } else {
    throw new Error(`Unknown message type: ${request.type}`);
  }

  return true;
}

async function fetchIMDBRating({ title, type, year }) {
  const key = btoa([title, type, year].filter(Boolean).join("|"));

  const result = await chrome.storage.local.get(key);
  if (result && result.expiry > +new Date()) return result.imdbRating;

  const searchParams = new URLSearchParams({
    t: title,
    apiKey: OMDB_API_KEY,
    type,
  });
  if (year) searchParams.set("y", year);

  let { Error, imdbId, imdbRating } = await fetch(
    `https://www.omdbapi.com/?${searchParams.toString()}`
  ).then((response) => response.json());

  const cacheData = { imdbId, imdbRating };
  if (Error && Error.includes("not found")) {
    cacheData.imdbRating = "N/F";
    cacheData.expiry = +new Date() + ONE_DAY_IN_MS;
  } else if (Error) {
    throw new Error(`Error retrieving rating: ${Error}`);
  } else {
    cacheData.expiry = +new Date() + TWO_WEEKS_IN_MS;
  }

  chrome.storage.local.set({ [key]: cacheData });
  return imdbRating;
}
