import { omit } from "lodash";
import { ONE_DAY_IN_MS, TWO_WEEKS_IN_MS } from "./common";

const OMDB_API_KEY = "d7991986";

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request.type === "fetchIMDBRating") {
    fetchIMDBData(request.data).then((data) => sendResponse(data));
  } else {
    throw new Error(`Unknown message type: ${request.type}`);
  }

  return true;
}

async function fetchIMDBData({ title, type, year }) {
  const key = btoa([title, type, year].filter(Boolean).join("|"));

  const cached = await chrome.storage.local.get(key);
  if (checkCachedDataIsUsable(cached)) {
    return omit(cached, ["expiry"]);
  }

  const searchParams = new URLSearchParams({
    apiKey: OMDB_API_KEY,
    t: title,
    type,
  });
  if (year) searchParams.set("y", year);

  let result = {};
  try {
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
  } catch (e) {
    e.message = `Error fetching rating: ${e.message}`;
    return { error: e };
  }

  chrome.storage.local.set({ [key]: result });
  return omit(result, ["expiry"]);
}

function checkCachedDataIsUsable(data) {
  return (
    data &&
    data.imdbRating &&
    (data.imdbRating === "N/F" || data.imdbID) &&
    data.expiry > +new Date()
  );
}
