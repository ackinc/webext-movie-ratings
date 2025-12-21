import { browser, pick, invert } from "./common";
import type AbstractPage from "./common/AbstractPage";
import type { IMDBData, Program, SWErrorResponse } from "./common/types";
import HotstarPage from "./Hotstar/Page";
import SonyLivPage from "./SonyLiv/Page";
import NetflixPage from "./Netflix/Page";
import AmazonPrimeVideoPage from "./AmazonPrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";

let page: AbstractPage;
const intervalTimeMs = 2000;
const maxConsecutiveErrors = 5;
let nErrors = 0;
main();

window.addEventListener("message", (e) => {
  if (e.data === "sift: urlchange" && nErrors >= maxConsecutiveErrors) {
    nErrors = 0;
    console.log(`Sift: resuming due to page change`);
    setTimeout(loop, 0);
  }
});

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
  } catch (e) {
    console.error(`Error adding IMDB ratings`, e);
    ++nErrors;
  } finally {
    if (nErrors < maxConsecutiveErrors) {
      setTimeout(loop, intervalTimeMs);
    } else {
      console.log(`Sift: Pausing due to too many errors`);
    }
  }
}

async function fetchAndAddIMDBData(program: Program) {
  try {
    const response = await fetchIMDBData(program);
    if ("error" in response) throw new Error(response.error);
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
