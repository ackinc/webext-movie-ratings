import { browser, pick, invert } from "./common";
import JioCinemaPage from "./JioCinemaPage";
import HotstarPage from "./HotstarPage";
import SonyLivPage from "./SonyLivPage";

let page;

main();

async function main() {
  if (location.hostname === "www.jiocinema.com") {
    page = new JioCinemaPage();
  } else if (location.hostname === "www.hotstar.com") {
    page = new HotstarPage();
  } else if (location.hostname === "www.sonyliv.com") {
    page = new SonyLivPage();
  } else {
    throw new Error("Page not recognized");
  }

  window.__page = page;
  await page.initialize();

  const intervalTimeMs = 2000;
  const maxErrors = 30;
  let nErrors = 0;
  const interval = setInterval(() => {
    try {
      page
        .findPrograms()
        .filter(invert(page.checkIMDBDataAlreadyAdded))
        .forEach(fetchAndAddIMDBData);
      nErrors = 0;
    } catch (e) {
      console.error(`Error adding IMDB ratings`, e);
      if (++nErrors >= maxErrors) {
        console.log(`Pausing due to too many errors`);
        clearInterval(interval);
      }
    }
  }, intervalTimeMs);
}

async function fetchAndAddIMDBData(program) {
  const imdbData = await fetchIMDBData(program);
  if (imdbData.error) {
    console.error(`Error fetching IMDB data`, imdbData.error, program);
  } else {
    page.addIMDBData(program, imdbData);
  }
}

async function fetchIMDBData(program) {
  const response = await browser.runtime.sendMessage({
    type: "fetchIMDBRating",
    data: pick(program, ["title", "type", "year"]),
  });
  return response;
}
