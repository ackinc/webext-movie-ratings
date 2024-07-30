import { ONE_DAY_IN_MS, TWO_WEEKS_IN_MS, omit } from "./common";

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request.type === "fetchIMDBRating") {
    fetchIMDBData(request.data)
      .then((data) => sendResponse(data))
      .catch((e) => sendResponse({ error: e }));
  } else {
    throw new Error(`Unknown message type: ${request.type}`);
  }

  return true;
}

async function fetchIMDBData(program) {
  const key = getCacheKey(program);

  const { [key]: cached } = await chrome.storage.local.get(key);
  if (checkCachedDataIsUsable(cached)) {
    return omit(cached, ["expiry"]);
  }

  const { title, type, year } = program;
  const searchParams = new URLSearchParams({
    apiKey: BUILDTIME_ENV.OMDB_API_KEY,
    t: title,
    type,
  });
  if (year) searchParams.set("y", year);

  let result = {};
  const respBody = await fetch(
    `https://www.omdbapi.com/?${searchParams.toString()}`
  ).then((response) => response.json());

  const { Error: errmsg, imdbID, imdbRating } = respBody;

  if (errmsg && errmsg.includes("not found")) {
    result.imdbRating = "N/F";
    result.imdbID = "";
    result.expiry = +new Date() + ONE_DAY_IN_MS;
  } else if (errmsg) {
    throw new Error(errmsg);
  } else {
    result.imdbRating = imdbRating;
    result.imdbID = imdbID;
    result.expiry = +new Date() + TWO_WEEKS_IN_MS;
  }

  chrome.storage.local.set({ [key]: result });
  return omit(result, ["expiry"]);
}

function getCacheKey(program) {
  const { title, type, year } = program;
  return btoa(
    [title.replace(/[^\w\s]/g, "").toLowerCase(), type, year]
      .filter(Boolean)
      .join("|")
  );
}

function checkCachedDataIsUsable(data) {
  return (
    data &&
    data.imdbRating &&
    (data.imdbID || data.imdbRating === "N/F") &&
    data.expiry > +new Date()
  );
}
