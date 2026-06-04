import {
  browser,
  defaultProgramFilterSettings,
  getSetting,
  MessageType,
  CssClasses,
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
import AmazonPrimeVideoPage from "./AmazonPrimeVideo/Page";
import AppleTVPage from "./AppleTV/Page";
import MXPlayerPage from "./MXPlayer/Page";
import CrunchyrollPage from "./Crunchyroll/Page";
import YoutubeMoviesPage from "./YoutubeMovies/Page";
import Zee5Page from "./Zee5/Page";
import { fetchIMDBData, updateFilteredOutProgramNodeStyles } from "./utils";
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
  mutationObserver = new MutationObserver((_mutationList) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(findProgramsAndAddRatings, 100);
  });
  sessionStartTime = +new Date();
  timeout = setTimeout(findProgramsAndAddRatings, 100);

  addListeners();

  if (APP_ENV !== "production") addSidecar({ page });
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
      // in prod, we don't want an error during data-extraction for
      //   one pc- or p-node to affect processing of other nodes
      swallowDataExtractionErrors: APP_ENV === "production",
    });

    await Promise.all(
      programs.map((p) =>
        addRating(p)
          .then(fadeIfFilteredOut)
          .catch((e) => {
            // SWErrors would have been captured from the SW's side
            if (!(e instanceof SWError)) {
              captureException(e, { context: { program: p } });
            }
          }),
      ),
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
  } catch (e) {
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
  if (!page.checkIMDBDataAlreadyAdded(p)) {
    page.addIMDBData(p, await fetchIMDBData(p));
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
  if (timeout) clearTimeout(timeout);
  sessionStartTime = +new Date();
  timeout = setTimeout(findProgramsAndAddRatings, 100);
}

function handleFilterSettingsChange(updatedSettings: ProgramFilterSettings) {
  if (timeout) clearTimeout(timeout);
  programFilterSettings = { ...programFilterSettings, ...updatedSettings };
  updateFilteredOutProgramNodeStyles(updatedSettings);
  timeout = setTimeout(findProgramsAndAddRatings, 100);
}
