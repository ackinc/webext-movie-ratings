import {
  browser,
  defaultProgramFilterSettings,
  omit,
  getSetting,
  MessageType,
  CssClasses,
} from "../common";
import { SWError } from "../common/customErrors";
import { captureException } from "../common/errorReporter";
import type AbstractPage from "./AbstractPage";
import type {
  IMDBData,
  Message,
  Program,
  SWMessageResponse,
  ProgramFilterSettings,
  WebpageStats,
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

interface LoopState {
  timeout: ReturnType<typeof setTimeout> | undefined;
  abortController: AbortController | undefined;
  haltReason:
    | "filterSettingsChanged"
    | "urlChanged"
    | "pageHidden"
    | "error"
    | "cleanup"
    | undefined;
}
const loopState: LoopState = {
  timeout: undefined,
  abortController: undefined,
  haltReason: undefined,
};

(async () => {
  try {
    // so content scripts belonging to prev. ext. version can cleanup
    window.postMessage({
      type: MessageType.orphanCheck,
      data: { trigger: "new-content-script-injection" },
    } satisfies Message);

    await initializePage();
    addListeners();
    startLoop();
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

function addListeners() {
  window.addEventListener("message", handleMessage);
  browser.runtime.onMessage.addListener(handleMessage);
  document.addEventListener("visibilitychange", handlePageVisibilityChange);
}

function removeListeners() {
  window.removeEventListener("message", handleMessage);

  // when extension is turned off, browser.runtime is sometimes
  //   undefined by the time this line is reached
  // if we don't preempt the error, it will interfere with subsequent
  //   parts of the cleanup operation
  browser.runtime?.onMessage.removeListener(handleMessage);

  document.removeEventListener("visibilitychange", handlePageVisibilityChange);
}

function startLoop() {
  loopState.timeout = setTimeout(loopFn, 0);
  loopState.haltReason = undefined;
}

function stopLoop(reason: LoopState["haltReason"]) {
  // Prevent running loopFn from scheduling another invocation
  // WARN: If tab was backgrounded before first invocation of loop,
  //   loopState.abortController will be undefined; the use of optional-
  //   chaining below prevents stopLoop from erroring out in this case
  loopState.abortController?.abort();
  loopState.abortController = undefined;

  // clear any scheduled loop
  clearTimeout(loopState.timeout);
  loopState.timeout = undefined;
  loopState.haltReason = reason;
}

async function loopFn() {
  if (
    FF_HALT_LOOP_WHEN_PAGE_NOT_VISIBLE &&
    document.visibilityState === "hidden"
  ) {
    stopLoop("pageHidden");
    return;
  }

  // The currently executing loopFn has to hold on to it's abortController
  //   in the instance stopLoop is called from elsewhere before it reaches
  //   the point where it has to decide whether/not to schedule its next
  //   invocation
  const thisLoopAbortController = new AbortController();
  loopState.abortController = thisLoopAbortController;

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
      await browser.runtime.sendMessage({
        type: MessageType.webpageRatingStats,
        data: {
          sessionStartTime,
          stats: collectWebpageRatingStats(programs),
          pageUrl: location.href,
          statsCollectionTime: +new Date(),
        },
      } satisfies Message);
    }

    if (!thisLoopAbortController.signal.aborted) {
      loopState.timeout = setTimeout(loopFn, msDelayBeforeNextInvocation);
    }
  } catch (e) {
    stopLoop("error");

    if (
      e instanceof Error &&
      e.message.startsWith("Extension context invalidated")
    ) {
      window.postMessage({
        type: MessageType.orphanCheck,
        data: { trigger: "extension-runtime-disappeared" },
      } satisfies Message);
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
  const response = await browser.runtime.sendMessage<
    Message,
    SWMessageResponse<IMDBData>
  >({
    type: MessageType.fetchIMDBRating,
    data: {
      program: omit(program, ["node"]) as Omit<Program, "node">,
      pageUrl: location.href,
    },
  } satisfies Message);
  if ("error" in response) throw new SWError(response.error);
  return response.data;
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

function collectWebpageRatingStats(programs: Program[]): WebpageStats {
  const nPrograms = programs.length;
  let nProgramsWithNoRatingNode = 0;
  let nProgramsRatedNA = 0;
  let nProgramsRatedNF = 0;

  const ctor = page.constructor as typeof AbstractPage;
  programs.forEach(({ node }) => {
    const rating = ctor.ProgramNode.getIMDBNode(node)?.dataset["imdbRating"];
    if (rating === "N/A") nProgramsRatedNA++;
    if (rating === "N/F") nProgramsRatedNF++;
    if (!rating) nProgramsWithNoRatingNode++;
  });
  return {
    nPrograms,
    nProgramsRatedNA,
    nProgramsRatedNF,
    nProgramsWithNoRatingNode,
  };
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
    if (!browser.runtime.id) {
      // if the trigger was that new content scripts were injected, the
      //   outdated MWCS will be informed of the need to cleanup by
      //   the new MWCS, not by this ISOCS
      cleanup(msg.data.trigger === "extension-runtime-disappeared");
    }
  } else if (type === MessageType.urlChange) {
    handleUrlChange();
  } else if (type === MessageType.filterSettingsChange) {
    handleFilterSettingsChange(msg.data);
  } else if (type === MessageType.healthCheck) {
    if (sendResponse) sendResponse("ok");
  }
}

function handleUrlChange() {
  stopLoop("urlChanged");
  sessionStartTime = +new Date();
  startLoop();
}

function handleFilterSettingsChange(updatedSettings: ProgramFilterSettings) {
  stopLoop("filterSettingsChanged");
  updateFilteredOutProgramNodeStyles(updatedSettings);
  startLoop();
}

function cleanup(broadcast = true) {
  if (broadcast) {
    window.postMessage({ type: MessageType.cleanup } satisfies Message);
  }

  stopLoop("cleanup");
  removeListeners();
  page.cleanup();
  console.log("sift: orphaned content script cleanup complete");
}

function handlePageVisibilityChange() {
  if (FF_HALT_LOOP_WHEN_PAGE_NOT_VISIBLE) {
    if (document.visibilityState === "hidden") {
      stopLoop("pageHidden");
    } else {
      if (
        loopState.timeout === undefined &&
        loopState.haltReason === "pageHidden"
      ) {
        startLoop();
      }
    }
  }
}
