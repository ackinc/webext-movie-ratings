import {
  browser,
  defaultProgramFilterSettings,
  pick,
  invert,
  getSetting,
  MessageType,
  SettingsKey,
  CssClasses,
} from "../common";
import { captureException } from "../common/errorReporter";
import type AbstractPage from "./AbstractPage";
import type {
  IMDBData,
  Message,
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
import YoutubeMoviesPage from "./YoutubeMovies/Page";
import { updateFilteredOutProgramNodeStyles } from "./utils";

let page: AbstractPage;

// should *only* be set to undefined when we deliberately pause
//   the loop due to errors
let loopTimeout: number | undefined;
let loopAbortController: AbortController;

(async () => {
  try {
    // so content scripts belonging to prev. ext. version can cleanup
    window.postMessage({ messageType: MessageType.orphanCheck });

    await initializePage();
    addMessageListeners();
    loopTimeout = setTimeout(loop, 0);
  } catch (e) {
    captureException(e);
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
      (x) => x === location.hostname,
    )
  ) {
    page = new AmazonPrimeVideoPage();
  } else if (location.hostname === "tv.apple.com") {
    page = new AppleTVPage();
  } else if (location.hostname === "www.crunchyroll.com") {
    page = new CrunchyrollPage();
  } else if (location.hostname === "www.youtube.com") {
    page = new YoutubeMoviesPage();
  } else {
    throw new Error("Page not recognized");
  }

  await page.initialize();
}

function addMessageListeners() {
  window.addEventListener("message", handleMessage);
  browser.runtime.onMessage.addListener(handleMessage);
}

function removeMessageListeners() {
  window.removeEventListener("message", handleMessage);

  // when extension is turned off, browser.runtime is sometimes
  //   undefined by the time this line is reached
  // if we don't preempt the error, it will interfere with subsequent
  //   parts of the cleanup operation
  browser.runtime?.onMessage.removeListener(handleMessage);
}

async function loop() {
  const thisLoopAbortController = new AbortController();
  loopAbortController = thisLoopAbortController;

  const msDelayBeforeNextInvocation = 2000;

  let programs: Program[] = [];
  try {
    programs = page.findPrograms();
    await addRatingsToPrograms(programs);
    await fadeFilteredOutPrograms(programs);

    if (!thisLoopAbortController.signal.aborted) {
      loopTimeout = setTimeout(loop, msDelayBeforeNextInvocation);
    }
  } catch (e) {
    loopTimeout = undefined;

    if (
      e instanceof Error &&
      e.message.startsWith("Extension context invalidated")
    ) {
      cleanup();
      return;
    }

    captureException(e);
  }
}

async function addRatingsToPrograms(allPrograms: Program[]) {
  const programsToAddRatingsFor = allPrograms.filter(
    invert(page.checkIMDBDataAlreadyAdded),
  );

  const results = await Promise.allSettled(
    programsToAddRatingsFor.map(fetchIMDBData),
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
      captureException(e, { context: { program } });
    }
  });
}

async function fetchIMDBData(program: Program): Promise<IMDBData> {
  const response: IMDBData | SWErrorResponse =
    await browser.runtime.sendMessage({
      messageType: MessageType.fetchIMDBRating,
      data: {
        program: pick(program, ["title", "type", "year"]),
        pageUrl: location.href,
      },
    });
  if ("error" in response) throw new Error(response.error);
  return response;
}

async function fadeFilteredOutPrograms(allPrograms: Program[]) {
  const settings = {
    ...defaultProgramFilterSettings,
    ...((await getSetting(SettingsKey.programFiltersSettings)) as
      | ProgramFilterSettings
      | undefined),
  };

  allPrograms.forEach((p) => {
    const imdbNode = (
      page.constructor as typeof AbstractPage
    ).ProgramNode.getIMDBNode(p.node);
    if (!imdbNode) return;

    const rating = parseFloat(imdbNode.dataset!["imdbRating"]!);
    if (rating < settings.minRating || rating > settings.maxRating) {
      p.node.classList.add(CssClasses.filteredOutProgramNode);
    } else if (settings.excludeUnratedPrograms && Number.isNaN(rating)) {
      p.node.classList.add(CssClasses.filteredOutProgramNode);
    } else {
      p.node.classList.remove(CssClasses.filteredOutProgramNode);
    }
  });
}

function handleMessage(
  m: MessageEvent | Message,
  _s?: chrome.runtime.MessageSender,
  sendResponse?: (response: unknown) => void,
) {
  const { messageType, data } = m instanceof MessageEvent ? m.data : m;

  if (messageType === MessageType.orphanCheck) {
    if (!browser.runtime.id) cleanup();
  } else if (messageType === MessageType.urlChange) {
    handleUrlChange();
  } else if (messageType === MessageType.filterSettingsChange) {
    handleFilterSettingsChange(data as ProgramFilterSettings);
  } else if (messageType === MessageType.healthCheck) {
    if (sendResponse) sendResponse("ok");
  }
}

function handleUrlChange() {
  if (page && loopTimeout === undefined) {
    console.log(`sift: resuming paused loop on page change`);
    loopTimeout = setTimeout(loop, 0);
  }
}

function handleFilterSettingsChange(updatedSettings: ProgramFilterSettings) {
  haltLoop();

  updateFilteredOutProgramNodeStyles(updatedSettings);

  // restart loop
  loopTimeout = setTimeout(loop, 0);
}

function haltLoop() {
  // prevent running loop invocation from scheduling another invocation
  loopAbortController.abort();

  // clear any scheduled loop
  clearTimeout(loopTimeout);
}

function cleanup() {
  haltLoop();
  removeMessageListeners();
  page.cleanup();
  console.log("sift: orphaned content script cleanup complete");
}
