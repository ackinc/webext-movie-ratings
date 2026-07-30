import {
  browser,
  defaultProgramFilterSettings,
  ErrorMessage,
  getSetting,
  omit,
  MessageType,
  CssClasses,
  mainFnInvocationDelayMs,
} from "../common";
import { SWError } from "../common/customErrors";
import { captureException } from "../common/errorReporter";
import type AbstractPage from "./AbstractPage";
import type {
  Message,
  Program,
  ProgramFilterSettings,
  WebpageStats,
} from "../common/types";
import DisneyPlusPage from "./DisneyPlus/Page";
import HBOMaxPage from "./HBOMax/Page";
import HotstarPage from "./Hotstar/Page";
import HuluPage from "./Hulu/Page";
import PeacockTVPage from "./PeacockTV/Page";
import SonyLivPage from "./SonyLiv/Page";
import NetflixPage from "./Netflix/Page";
import ParamountPlusPage from "./ParamountPlus/Page";
import PrimeVideoPage from "./PrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";
import MXPlayerPage from "./MXPlayer/Page";
import CrunchyrollPage from "./Crunchyroll/Page";
import YoutubeMoviesPage from "./YoutubeMovies/Page";
import Zee5Page from "./Zee5/Page";
import {
  isVoidElement,
  requestIMDBData,
  updateFilteredOutProgramNodeStyles,
} from "./utils";
import { addSidecar, removeSidecar } from "./sidecar";

let page: AbstractPage;
let programFilterSettings: ProgramFilterSettings;
let mutationObserver: MutationObserver;
// updated whenever a user navigates to a different page on the website
let sessionStartTime: number;
// we schedule calls to findProgramsAndAddRatings with a small
//   delay instead of synchronously to prevent wasteful computation
//   when the page is updating rapidly, and the mutation observer's
//   callback is invoked multiple times in quick succession
let timeout: ReturnType<typeof setTimeout> | null = null;

main().catch(captureException);

// fn defs

async function main() {
  // so content scripts belonging to prev. ext. version can cleanup
  window.postMessage({
    type: MessageType.orphanCheck,
    data: { trigger: "new-content-script-injection" },
  } satisfies Message);

  // initialize state vars
  page = await initializePage();
  programFilterSettings = {
    ...defaultProgramFilterSettings,
    ...(await getSetting("programFiltersSettings")),
  };
  mutationObserver = new MutationObserver((mutationRecords) => {
    const addedNodes = mutationRecords
      .flatMap((r) => Array.from(r.addedNodes))
      .filter(
        (node) =>
          node instanceof HTMLElement &&
          !isVoidElement(node, ["img"]) &&
          ["script"].indexOf(node.tagName.toLowerCase()) === -1 &&
          !page.ignorableNodeAdditions.some((sel) => node.matches(sel)) &&
          !Array.from(node.classList).some((cname) => cname.startsWith("sift")),
      );
    if (addedNodes.length === 0) return;

    // at least one element was added that is not a sift-imdb-node,
    //   so it's worth running 'findProgramsAndAddRatings' again
    schedulePageProcessing("onMutation");
    if (APP_ENV === "development") console.debug(addedNodes);
  });
  sessionStartTime = +new Date();
  addListeners();
  if (APP_ENV !== "production") addSidecar({ page });
  schedulePageProcessing("onStart");
}

function schedulePageProcessing(
  reason: string,
  withDelayMs: number = mainFnInvocationDelayMs,
) {
  if (timeout) clearTimeout(timeout);

  if (APP_ENV === "development") {
    const now = new Date().toISOString();
    console.debug(`[${now}] schedulePageProcessing ${reason}`);
  }

  timeout = setTimeout(findProgramsAndAddRatings, withDelayMs);
}

function cleanup(broadcast = true) {
  if (broadcast) {
    window.postMessage({ type: MessageType.cleanup } satisfies Message);
  }

  removeSidecar();
  removeListeners();
  if (timeout) clearTimeout(timeout);
  page.cleanup();

  console.log("sift: content script cleanup complete");
}

async function initializePage() {
  if (location.hostname === "www.disneyplus.com") {
    page = new DisneyPlusPage();
  } else if (
    ["www.hbomax.com", "play.hbomax.com"].includes(location.hostname)
  ) {
    page = new HBOMaxPage();
  } else if (location.hostname === "www.hotstar.com") {
    page = new HotstarPage();
  } else if (location.hostname === "www.hulu.com") {
    page = new HuluPage();
  } else if (location.hostname === "www.sonyliv.com") {
    page = new SonyLivPage();
  } else if (location.hostname === "www.netflix.com") {
    page = new NetflixPage();
  } else if (
    ["www.primevideo.com", "www.amazon.com", "www.amazon.de"].some(
      (x) => x === location.hostname,
    )
  ) {
    page = new PrimeVideoPage();
  } else if (location.hostname === "tv.apple.com") {
    page = new AppleTVPage();
  } else if (location.hostname === "www.crunchyroll.com") {
    page = new CrunchyrollPage();
  } else if (location.hostname === "www.youtube.com") {
    page = new YoutubeMoviesPage();
  } else if (location.hostname === "www.paramountplus.com") {
    page = new ParamountPlusPage();
  } else if (location.hostname === "www.peacocktv.com") {
    page = new PeacockTVPage();
  } else if (location.hostname === "www.zee5.com") {
    page = new Zee5Page();
  } else if (location.hostname === "www.mxplayer.in") {
    page = new MXPlayerPage();
  } else {
    throw new Error("Page not recognized");
  }

  return await page.initialize();
}

function addListeners() {
  mutationObserver.observe(document.body, { subtree: true, childList: true });
  window.addEventListener("message", handleMessage);
  browser.runtime.onMessage.addListener(handleMessage);
}

function removeListeners() {
  mutationObserver.disconnect();
  window.removeEventListener("message", handleMessage);

  // if cleanup is happening because the user disabled the extension,
  //   browser.runtime will be undefined
  browser.runtime?.onMessage.removeListener(handleMessage);
}

async function findProgramsAndAddRatings() {
  try {
    const programs = page.findPrograms({
      swallowDataExtractionErrors: !(await getSetting(
        "throwDataExtractionErrors",
      )),
    });

    const results = await Promise.allSettled<Program>(
      programs.map((p) => addRating(p).then(fadeIfFilteredOut)),
    );
    const errors: Error[] = results
      .map((r, idx) => {
        if (r.status === "fulfilled") return null;
        const err = r.reason instanceof Error ? r.reason : new Error(r.reason);
        err.context = { program: omit(programs[idx]!, ["node"] as const) };
        return r.reason;
      })
      .filter((x) => x);
    handleErrors(errors);

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
  } catch (e) {
    if (
      e instanceof Error &&
      [
        ErrorMessage.extensionRuntimeDisappeared,
        ErrorMessage.unexpectedMessageChannelClosure,
      ].some((pfx) => e.message.startsWith(pfx))
    ) {
      window.postMessage({
        type: MessageType.orphanCheck,
        data: { trigger: "extension-runtime-disappeared" },
      } satisfies Message);
    } else {
      captureException(e);
    }
  }

  function handleErrors(errors: Error[]) {
    let majorError: Error | null = null;

    for (let e of errors) {
      if (e instanceof SWError) {
        // SWErrors would have been captured from the SW's side; no need to call
        //   captureException again
      } else if (
        [
          ErrorMessage.extensionRuntimeDisappeared,
          ErrorMessage.unexpectedMessageChannelClosure,
        ].some((pfx) => e.message.startsWith(pfx))
      ) {
        majorError = e;
      } else {
        captureException(
          e,
          e.context
            ? { context: e.context as Record<string, Record<string, unknown>> }
            : {},
        );
      }
    }

    if (majorError) throw majorError;
  }
}

async function addRating(p: Program): Promise<Program> {
  if (!page.checkIMDBDataAlreadyAdded(p)) {
    page.addIMDBData(p, await requestIMDBData(p));
  }
  return p;
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
  let nProgramsRatedNM = 0;

  const ctor = page.constructor as typeof AbstractPage;
  programs.forEach(({ node }) => {
    const rating = ctor.ProgramNode.getIMDBNode(node)?.dataset["imdbRating"];
    if (rating === "N/A") nProgramsRatedNA++;
    if (rating === "N/F") nProgramsRatedNF++;
    if (rating === "N/M") nProgramsRatedNM++;
    if (!rating) nProgramsWithNoRatingNode++;
  });
  return {
    nPrograms,
    nProgramsRatedNA,
    nProgramsRatedNF,
    nProgramsRatedNM,
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
    if (!browser.runtime?.id) {
      // if the trigger was new-content-script-injection, the
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
  } else if (type === MessageType.getSelectProgramModeState) {
    if (sendResponse) sendResponse(page.inSelectProgramMode ? "on" : "off");
  } else if (type === MessageType.toggleSelectProgramMode) {
    page.toggleSelectProgramMode();
  }
}

function handleUrlChange() {
  sessionStartTime = +new Date();
  schedulePageProcessing("onUrlChange");
}

function handleFilterSettingsChange(updatedSettings: ProgramFilterSettings) {
  programFilterSettings = updatedSettings;
  updateFilteredOutProgramNodeStyles(programFilterSettings);
  schedulePageProcessing("onFiltersChange");
}
