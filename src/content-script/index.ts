import { browser, pick, invert } from "../common";
import sentryScope from "../common/Sentry";
import type AbstractPage from "./AbstractPage";
import type { IMDBData, Program, SWErrorResponse } from "../common/types";
import HotstarPage from "./Hotstar/Page";
import SonyLivPage from "./SonyLiv/Page";
import NetflixPage from "./Netflix/Page";
import AmazonPrimeVideoPage from "./AmazonPrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";
import CrunchyrollPage from "./Crunchyroll/Page";

let page: AbstractPage;
const intervalTimeMs = 2000;
const maxConsecutiveErrors = 5;
let nErrors = 0;

window.addEventListener("message", (e) => {
  if (e.data === "sift:urlchange" && nErrors >= maxConsecutiveErrors) {
    nErrors = 0;
    console.log(`Sift: resuming due to page change`);
    setTimeout(loop, 0);
  }
});

try {
  main();
} catch (e) {
  const clonedScope = sentryScope.clone();
  clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
  clonedScope.captureException(e);

  throw e;
}

async function main() {
  if (location.hostname === "www.hotstar.com") {
    page = new HotstarPage();
  } else if (location.hostname === "www.sonyliv.com") {
    page = new SonyLivPage();
  } else if (location.hostname === "www.netflix.com") {
    page = new NetflixPage();
  } else if (location.hostname === "www.primevideo.com") {
    page = new AmazonPrimeVideoPage();
  } else if (location.hostname === "tv.apple.com") {
    page = new AppleTVPage();
  } else if (location.hostname === "www.crunchyroll.com") {
    page = new CrunchyrollPage();
  } else {
    throw new Error("Page not recognized");
  }

  await page.initialize();

  window.__page = page;

  setTimeout(loop, 0);
}

async function loop() {
  try {
    await Promise.allSettled(
      page
        .findPrograms()
        .filter(invert(page.checkIMDBDataAlreadyAdded))
        .map(fetchAndAddIMDBData)
    );
    nErrors = 0;
    setTimeout(loop, intervalTimeMs);
  } catch (e) {
    const err: Error = e instanceof Error ? e : new Error(e?.toString());
    err.message = `Error adding IMDB ratings to page. ${err.message}`;
    console.error(err);

    if (++nErrors < maxConsecutiveErrors) {
      // retry, because the error might be a temporary one caused by the page
      //   not having finished loading
      setTimeout(loop, intervalTimeMs);
    } else {
      console.log(`Sift: Pausing due to too many errors`);

      const clonedScope = sentryScope.clone();
      clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
      clonedScope.captureException(err);
    }
  }
}

async function fetchAndAddIMDBData(program: Program) {
  try {
    const response = await fetchIMDBData(program);
    if ("error" in response) throw response.error;
    page.addIMDBData(program, response);
  } catch (e) {
    if (!(e instanceof Error)) throw e;

    console.error(`Error fetching and adding IMDB data: ${e.message}`, program);
  }
}

async function fetchIMDBData(
  program: Program
): Promise<IMDBData | SWErrorResponse> {
  const response: IMDBData | SWErrorResponse =
    await browser.runtime.sendMessage({
      type: "fetchIMDBRating",
      data: pick(program, ["title", "type", "year"]),
    });
  return response;
}
