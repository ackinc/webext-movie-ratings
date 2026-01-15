import {
  browser,
  pick,
  omit,
  invert,
  delayMs,
  LOW_RATED_PROGRAM_NODE_CLASS,
  STYLE_NODE_CLASS,
  getLowRatedProgramFilterSettingsState,
} from "../common";
import { captureException } from "../common/errorReporter";
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
    console.log(`Sift: resuming paused loop on page change`);
    loopTimeout = setTimeout(loop, 0);
  }
});

try {
  initializePage();
  loopTimeout = setTimeout(loop, 0);
} catch (e) {
  captureException(e as Error, { addViewportDims: true });
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
}

async function loop() {
  const msDelayBeforeNextInvocation = 2000;

  try {
    const programs = await findProgramsOnPage();
    await addRatingsToPrograms(programs);
    await hideLowRatedPrograms(programs);
    loopTimeout = setTimeout(loop, msDelayBeforeNextInvocation);
  } catch (e) {
    loopTimeout = null;
    captureException(e as Error, { addViewportDims: true });
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

      captureException(err, { addViewportDims: true });
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

async function hideLowRatedPrograms(allPrograms: Program[]) {
  const settings = (await getLowRatedProgramFilterSettingsState()) ?? {
    minRating: 10,
    transparency: 0,
  };

  const styleNode = document.querySelector(
    `style.${STYLE_NODE_CLASS}`
  ) as HTMLElement;
  styleNode.innerHTML = styleNode.innerHTML.replace(
    /opacity:.+/,
    `opacity: ${1 - settings.transparency / 100};`
  );

  allPrograms.forEach((p) => {
    const imdbNode = (
      page.constructor as typeof AbstractPage
    ).ProgramNode.getIMDBNode(p.node);

    if (
      imdbNode &&
      parseFloat(imdbNode.dataset!["imdbRating"]!) < settings.minRating
    ) {
      p.node.classList.add(LOW_RATED_PROGRAM_NODE_CLASS);
    } else {
      p.node.classList.remove(LOW_RATED_PROGRAM_NODE_CLASS);
    }
  });
}
