import { pick } from "lodash";
import JioCinemaPage from "./JioCinemaPage";

let page;

if (window.navigation) {
  window.navigation.addEventListener("navigate", () => {
    console.log("Navigation detected");
    page && page.stopWatchingForNewPrograms();
    main();
  });
}

main();

async function main() {
  if (location.hostname === "www.jiocinema.com") {
    page = new JioCinemaPage();
  } else {
    throw new Error("Page not recognized");
  }

  await page.initialize();
  page.watchForNewPrograms(fetchAndAddRating);

  // ensure we add ratings for programs that were
  //   already on the page when the watcher was
  //   initialized
  page.findPrograms().forEach(fetchAndAddRating);
}

async function fetchAndAddRating(program) {
  const rating = await fetchRating(program);
  page.addRating(program, rating);
}

async function fetchRating(program) {
  const response = await chrome.runtime.sendMessage({
    type: "fetchIMDBRating",
    data: pick(program, ["title", "type", "year"]),
  });
  return response.rating;
}
