import { pick } from "lodash";
import JioCinemaPage from "./JioCinemaPage";

let page;

main();

async function main() {
  if (location.hostname === "www.jiocinema.com") {
    page = new JioCinemaPage();
  } else {
    throw new Error("Page not recognized");
  }

  await page.initialize();
  page.watchForNewPrograms(fetchAndAddIMDBData);

  // ensure we add ratings for programs that were
  //   already on the page when the watcher was
  //   initialized
  page.findPrograms().forEach(fetchAndAddIMDBData);
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
  const response = await chrome.runtime.sendMessage({
    type: "fetchIMDBRating",
    data: pick(program, ["title", "type", "year"]),
  });
  return response;
}
