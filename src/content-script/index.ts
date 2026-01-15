import {
  browser,
  pick,
  omit,
  invert,
  delayMs,
} from "../common";
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
let loopTimeout: number | null = null;

window.addEventListener("message", (e) => {
  if (e.data === "sift:urlchange" && loopTimeout === null) {
    console.log(`Sift: resuming due to page change`);
    loopTimeout = setTimeout(loop, 0);
  }
});

try {
  initializePage();
  loopTimeout = setTimeout(loop, 0);
} catch (e) {
  const clonedScope = sentryScope.clone();
  clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
  clonedScope.captureException(e);

  throw e;
}

async function initializePage() {
  if (location.hostname === "www.hotstar.com") {
    page = new HotstarPage();
  } else if (location.hostname === "www.sonyliv.com") {
    page = new SonyLivPage();
  } else if (location.hostname === "www.netflix.com") {
    page = new NetflixPage();
  } else if (
    ["www.primevideo.com", "www.amazon.com"].some(
      (x) => x === location.hostname
    )
  ) {
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
}

async function loop() {
  const intervalTimeMs = 2000;

  try {
    const programs = await findProgramsOnPage();
    await addRatingsToPrograms(programs);
    loopTimeout = setTimeout(loop, intervalTimeMs);
  } catch (e) {
    loopTimeout = null;

    const clonedScope = sentryScope.clone();
    clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
    clonedScope.captureException(e);

    throw e;
  }
}

async function findProgramsOnPage(): Promise<Program[]> {
  const maxConsecutiveErrors = 5;
  const errors = [];
  const msDelayBetweenRetries = 2000;

  let programs: Program[] | undefined;
  do {
    try {
      programs = page.findPrograms();
    } catch (e) {
      const thisErr = e instanceof Error ? e : new Error(e?.toString());
      console.error(thisErr);
      errors.push(thisErr);

      // the error may have been caused by the page not having finished
      //   loading, so we'll give it some time
      await delayMs(msDelayBetweenRetries);
    }
  } while (!programs && errors.length < maxConsecutiveErrors);

  if (!programs) throw errors.at(-1);
  return programs as Program[];
}

async function addRatingsToPrograms(allPrograms: Program[]) {
  const programsToAddRatingsFor = allPrograms.filter(
    invert(page.checkIMDBDataAlreadyAdded)
  );

  const results = await Promise.allSettled(
    programsToAddRatingsFor.map(fetchIMDBData)
  );
  programsToAddRatingsFor.forEach((program, idx) => {
    if (results[idx]!.status === "rejected") {
      // do nothing if the promise was rejected; the error would
      //   already have been logged and captured in the SW
      return;
    }

    try {
      page.addIMDBData(program, results[idx]!.value);
    } catch (e) {
      const err: Error = e instanceof Error ? e : new Error(e?.toString());
      err.message = `Error adding imdb data to program. Program data: ${JSON.stringify(omit(program, ["node"]))}`;
      console.error(err, program.node);

      const clonedScope = sentryScope.clone();
      clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
      clonedScope.captureException(err);
    }
  });
}

async function fetchIMDBData(program: Program): Promise<IMDBData> {
  const response: IMDBData | SWErrorResponse =
    await browser.runtime.sendMessage({
      type: "fetchIMDBRating",
      data: pick(program, ["title", "type", "year"]),
    });
  if ("error" in response) throw response.error;
  return response;
}
