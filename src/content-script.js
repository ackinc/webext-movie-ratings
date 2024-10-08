import { browser, pick, invert } from "./common";
import JioCinemaPage from "./JioCinema/Page";
import HotstarPage from "./Hotstar/Page";
import SonyLivPage from "./SonyLiv/Page";
import NetflixPage from "./Netflix/Page";
import AmazonPrimeVideoPage from "./AmazonPrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";

let page;
const intervalTimeMs = 2000;
const maxConsecutiveErrors = 30;
let nErrors = 0;
main();

async function main() {
  if (location.hostname === "www.jiocinema.com") {
    page = new JioCinemaPage();
  } else if (location.hostname === "www.hotstar.com") {
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
      console.log(`Pausing due to too many errors`);
    }
  }
}

async function fetchAndAddIMDBData(program) {
  try {
    const imdbData = await fetchIMDBData(program);
    if (imdbData.error) throw new Error(imdbData.error);
    page.addIMDBData(program, imdbData);
  } catch (e) {
    console.error(`Error fetching and adding IMDB data: ${e.message}`, program);
  }
}

async function fetchIMDBData(program) {
  const response = await browser.runtime.sendMessage({
    type: "fetchIMDBRating",
    data: pick(program, ["title", "type", "year"]),
  });
  return response;
}
