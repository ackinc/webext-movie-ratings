import {
  browser,
  defaultProgramFilterSettings,
  pick,
  getSetting,
  MessageType,
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
let programFilterSettings: ProgramFilterSettings;

// This var is defined a little differently than most would expect, because
//   its main utility is for webpage-ratings-stats
// When tracking webpage-ratings-stats for telemetry:
// - the session starts when the user lands on an OTT website
// - stats from when a user is scrolling the first page (pg 1) should be
//     logged in the same entry
// - stats from when a user goes to pg 2 should go into a new entry
// - stats from when a user goes back to pg 1 should also go into a new entry
// In other words, a session is tied to a visit to a particular OTT webpage;
//   it ends when the user leaves that webpage
let sessionStartTime: number;

// should *only* be set to undefined when we deliberately pause
//   the loop due to errors
let loopTimeout: number | undefined;
let loopAbortController: AbortController;

(async () => {
  try {
    // so content scripts belonging to prev. ext. version can cleanup
    window.postMessage({ type: MessageType.orphanCheck });

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

  sessionStartTime = +new Date();
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

  try {
    programFilterSettings = {
      ...defaultProgramFilterSettings,
      ...(await getSetting("programFiltersSettings")),
    };

    const programs = page.findPrograms();
    await Promise.all(
      programs.map((p) => addRating(p).then(fadeIfFilteredOut)),
    );

    if (FF_TELEMETRY_ENABLED) {
      const nPrograms = programs.length;
      let nProgramsWithNoRatingNode = 0;
      let nProgramsRatedNA = 0;
      let nProgramsRatedNF = 0;

      const ctor = page.constructor as typeof AbstractPage;
      programs.forEach(({ node }) => {
        const rating =
          ctor.ProgramNode.getIMDBNode(node)?.dataset["imdbRating"];
        if (rating === "N/A") nProgramsRatedNA++;
        if (rating === "N/F") nProgramsRatedNF++;
        if (!rating) nProgramsWithNoRatingNode++;
      });
      await browser.runtime.sendMessage({
        type: MessageType.webpageRatingStats,
        data: {
          sessionStartTime,
          stats: {
            nPrograms,
            nProgramsWithNoRatingNode,
            nProgramsRatedNA,
            nProgramsRatedNF,
          },
          pageUrl: location.href,
          statsCollectionTime: +new Date(),
        },
      });
    }

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

async function addRating(p: Program): Promise<Program> {
  if (page.checkIMDBDataAlreadyAdded(p)) return p;

  let result: IMDBData;
  try {
    result = await fetchIMDBData(p);
  } catch (_e) {
    // do nothing if the promise was rejected; the error would
    //   already have been logged and captured in the SW
    return p;
  }

  try {
    page.addIMDBData(p, result);
  } catch (e) {
    captureException(e, { context: { program: p } });
  }

  return p;
}

async function fetchIMDBData(program: Program): Promise<IMDBData> {
  const response: IMDBData | SWErrorResponse =
    await browser.runtime.sendMessage({
      type: MessageType.fetchIMDBRating,
      data: {
        program: pick(program, ["title", "type", "year"]),
        pageUrl: location.href,
      },
    });
  if ("error" in response) throw new Error(response.error);
  return response;
}

function fadeIfFilteredOut(p: Program): Program {
  const settings = programFilterSettings;

  const imdbNode = (
    page.constructor as typeof AbstractPage
  ).ProgramNode.getIMDBNode(p.node);
  if (!imdbNode) return p;

  const rating = parseFloat(imdbNode.dataset!["imdbRating"]!);
  if (rating < settings.minRating || rating > settings.maxRating) {
    p.node.classList.add(CssClasses.filteredOutProgramNode);
  } else if (settings.excludeUnratedPrograms && Number.isNaN(rating)) {
    p.node.classList.add(CssClasses.filteredOutProgramNode);
  } else {
    p.node.classList.remove(CssClasses.filteredOutProgramNode);
  }

  return p;
}

function handleMessage(
  m: MessageEvent | Message,
  _s?: chrome.runtime.MessageSender,
  sendResponse?: (response: unknown) => void,
) {
  const msg = m instanceof MessageEvent ? (m.data as Message) : m;
  const { type } = msg;

  if (type === MessageType.cleanup) {
    cleanup();
  } else if (type === MessageType.orphanCheck) {
    if (!browser.runtime.id) cleanup();
  } else if (type === MessageType.urlChange) {
    handleUrlChange();
  } else if (type === MessageType.filterSettingsChange) {
    handleFilterSettingsChange(msg.data);
  } else if (type === MessageType.healthCheck) {
    if (sendResponse) sendResponse("ok");
  }
}

function handleUrlChange() {
  if (!page) return;

  sessionStartTime = +new Date();

  if (loopTimeout === undefined) {
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
