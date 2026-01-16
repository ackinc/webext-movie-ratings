import {
  browser,
  defaultProgramFilterSettings,
  pick,
  omit,
  invert,
  delayMs,
  getSetting,
  MessageType,
  SettingsKey,
  CssClasses,
} from "../common";
import { captureException } from "../common/errorReporter";
import type AbstractPage from "./AbstractPage";
import type {
  IMDBData,
  Program,
  SWErrorResponse,
  ProgramFilterSettings,
} from "../common/types";
import HotstarPage from "./Hotstar/Page";
import SonyLivPage from "./SonyLiv/Page";
import NetflixPage from "./Netflix/Page";
import AmazonPrimeVideoPage from "./AmazonPrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";
import CrunchyrollPage from "./Crunchyroll/Page";
import { updateFilteredOutProgramNodeStyles } from "./utils";

let page: AbstractPage;

// should *only* be set to undefined when we deliberately pause
//   the loop due to errors
let loopTimeout: number | undefined;
let loopAbortController: AbortController;

(async () => {
  try {
    await initializePage();
    addMessageListeners();
    loopTimeout = setTimeout(loop, 0);
  } catch (e) {
    captureException(e as Error, { addViewportDims: true });
    throw e;
  }
})();

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

function addMessageListeners() {
  window.addEventListener("message", (e) => {
    const { message } = e.data;
    if (message === MessageType.urlChange) {
      handleUrlChange();
    }
  });
  browser.runtime.onMessage.addListener(({ message, data }) => {
    if (message === MessageType.filterSettingsChange) {
      handleFilterSettingsChange(data as ProgramFilterSettings);
    }
  });
}

async function loop() {
  const thisLoopAbortController = new AbortController();
  loopAbortController = thisLoopAbortController;

  const msDelayBeforeNextInvocation = 2000;

  try {
    const programs = await findProgramsOnPage();
    await addRatingsToPrograms(programs);
    await fadeFilteredOutPrograms(programs);

    if (!thisLoopAbortController.signal.aborted) {
      loopTimeout = setTimeout(loop, msDelayBeforeNextInvocation);
    }
  } catch (e) {
    loopTimeout = undefined;
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

async function fadeFilteredOutPrograms(allPrograms: Program[]) {
  const settings =
    ((await getSetting(SettingsKey.programFiltersSettings)) as
      | ProgramFilterSettings
      | undefined) ?? defaultProgramFilterSettings;

  allPrograms.forEach((p) => {
    const imdbNode = (
      page.constructor as typeof AbstractPage
    ).ProgramNode.getIMDBNode(p.node);

    if (
      imdbNode &&
      parseFloat(imdbNode.dataset!["imdbRating"]!) < settings.minRating
    ) {
      p.node.classList.add(CssClasses.filteredOutProgramNode);
    } else {
      p.node.classList.remove(CssClasses.filteredOutProgramNode);
    }
  });
}

function handleUrlChange() {
  if (page && loopTimeout === undefined) {
    console.log(`Sift: resuming paused loop on page change`);
    loopTimeout = setTimeout(loop, 0);
  }
}

function handleFilterSettingsChange(updatedSettings: ProgramFilterSettings) {
  // prevent any running loop invocation from scheduling another invocation
  loopAbortController.abort();

  // clear any scheduled loop
  clearTimeout(loopTimeout);

  updateFilteredOutProgramNodeStyles(updatedSettings);

  // restart loop
  loopTimeout = setTimeout(loop, 0);
}
