import { pick } from "lodash";
import { invert } from "./common";
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

  setInterval(() => {
    page
      .findPrograms()
      .filter(invert(page.checkIMDBDataAlreadyAdded))
      .forEach(fetchAndAddIMDBData);
  }, 1000);
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
