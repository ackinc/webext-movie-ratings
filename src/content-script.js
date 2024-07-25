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

  page.findPrograms().forEach(fetchAndAddRating);

  page.watchForNewPrograms(fetchAndAddRating);
}

async function fetchAndAddRating(program) {
  const rating = await fetchRating(program.title);
  page.addRating(program, rating);
}

async function fetchRating() {
  // TODO
  return Promise.resolve("10.0");
}
