import * as path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { chromium } from "playwright";
import type { ElementHandle, Route } from "playwright";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  MEDIA_FILE_EXTENSIONS,
  SEARCH_PHRASE,
  TRACKING_DOMAINS,
} from "./constants.ts";
import { pick } from "../../utils/index.ts";

const __DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const ENV = pick(
  process.env,
  [
    "NETFLIX_EMAIL",
    "NETFLIX_PASSWORD",
    "CRUNCHYROLL_EMAIL",
    "CRUNCHYROLL_PASSWORD",
  ],
  true,
) as Record<string, string>;
const PATH_TO_EXTENSION = path.join(__DIRNAME, "../../dist");
const SITE_TO_TESTFN_MAP = {
  appletv: testAppleTV,
  crunchyroll: testCrunchyroll,
  hotstar: testHotstar,
  netflix: testNetflix,
  primevideo: testPrimeVideo,
  sonyliv: testSonyLiv,
  youtubemovies: testYoutubeMovies,
} as const;

// parse CLI args

const argv = yargs(hideBin(process.argv))
  .option("sites", {
    array: true,
    choices: ["NONE", ...Object.keys(SITE_TO_TESTFN_MAP), "ALL"] as const,
    coerce: (val) =>
      (val.includes("NONE")
        ? []
        : val.includes("ALL")
          ? Object.keys(SITE_TO_TESTFN_MAP)
          : val) as (keyof typeof SITE_TO_TESTFN_MAP)[],
    default: ["none"],
    describe: "which sites to browse",
  })
  .option("report-errors", {
    boolean: true,
    default: false,
    description:
      "whether errors encountered by the extension should be reported to Sentry",
  })
  .option("data-dir", {
    default: path.join(__DIRNAME, `../../tmp/browseOTTs-data-dir`),
    description: "the directory playwright should use as the data-directory",
    string: true,
  })
  .option("mock-ratings-api-responses", {
    boolean: true,
    default: true,
    description: "whether to mock the ratings API",
  })
  .option("keep-browser-open", {
    boolean: true,
    default: false,
    description:
      "whether or not the browser should be kept open when the script is done, even if there weren't errors",
  })
  .parseSync();

console.log(`Sites that will be tested: ${argv.sites.join(", ")}`);
console.time(`browseOTTs: ${argv.sites.join(", ")}`);

// For outdated-selector-recognition to work, we need to persist
//   selector-statuses across runs of this automation - a selector
//   is recognized as outdated if it worked in the previous run,
//   but not in this run
// This is why we use the same dataDir for every run
const browserContext = await chromium.launchPersistentContext(argv.dataDir, {
  headless: false,
  args: [
    `--disable-extensions-except=${PATH_TO_EXTENSION}`,
    `--load-extension=${PATH_TO_EXTENSION}`,
  ],
  viewport: { width: 1728, height: 864 },
});
const extensionId = await getExtensionId();
const extensionServiceWorker = browserContext
  .serviceWorkers()
  .find((sw) => sw.url().includes(extensionId))!;

await setupRequestInterceptors();

await setSiftErrorReporting(argv.reportErrors);

const results = await Promise.allSettled(
  argv.sites.map((site) => timerHof(SITE_TO_TESTFN_MAP[site])()),
);
const erroredSites: string[] = [];

results.forEach((r, idx) => {
  if (r.status === "fulfilled") return;

  const site = argv.sites[idx]!;
  erroredSites.push(site);

  r.reason.message = `Error browsing ${site}: ${r.reason.message}`;
  console.error(r.reason);
});
console.log(
  `Done with ${erroredSites.length} errors: ${erroredSites.join(", ")}`,
);
if (erroredSites.length === 0 && !argv.keepBrowserOpen) {
  await browserContext.close();
}
console.timeEnd(`browseOTTs: ${argv.sites.join(", ")}`);

/////////////
/* helpers */
/////////////

async function getExtensionId() {
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  await page.goto("chrome://extensions/");
  await page.locator("cr-toggle#devMode").click();
  const extensionCard = page.locator("extensions-item").first();
  return (await extensionCard.getAttribute("id"))!;
}

async function setupRequestInterceptors() {
  // disable requests for media
  await browserContext.route(
    (url) =>
      MEDIA_FILE_EXTENSIONS.some((ext) => url.pathname.endsWith(`.${ext}`)),
    (r) => r.abort(),
  );

  // disable tracking
  await Promise.all(
    TRACKING_DOMAINS.map((d) =>
      browserContext.route(`*://${d}/**`, (r) => r.abort()),
    ),
  );

  if (argv.mockRatingsApiResponses) {
    await browserContext.route(
      "**://www.omdbapi.com/**",
      ratingsApiInterceptor,
    );
  }
}

// NOTE: labelPrefix is only used when label is not explicitly specified
function timerHof<T>(
  fn: () => T,
  { label, labelPrefix }: { label?: string; labelPrefix?: string } = {},
): () => Promise<T> {
  label ??= `${labelPrefix ?? ""}${fn.name}`;
  return async () => {
    console.time(label);
    const result = await fn();
    console.timeEnd(label);
    return result;
  };
}

async function ratingsApiInterceptor(route: Route) {
  await delayMs(Math.floor(Math.random() * 100) + 1);
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ imdbID: "xyz", imdbRating: "5.4" }),
  });
}

async function setSiftErrorReporting(optIn: boolean = true) {
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  await page.goto(`chrome-extension://${extensionId}/popup/index.html`);
  await page.locator("input#optInToErrorReporting").setChecked(optIn);
}

async function testPrimeVideo() {
  const labelPrefix = `${testPrimeVideo.name}:`;

  const page = await browserContext.newPage();
  await page.goto(`https://primevideo.com`);

  await page.getByRole("link", { name: "Movies", exact: true }).click();
  await timerHof(browseMoviesPage, { labelPrefix })();

  await page.getByText("See more").first().click();
  await timerHof(browseCollectionPage, { labelPrefix })();

  await page.locator('article[data-card-entity-type="Movie"]').first().click();
  await timerHof(browseProgramDetailPage, { labelPrefix })();

  await timerHof(useSearchFeature, { labelPrefix })();

  // helpers

  async function browseMoviesPage() {
    await page
      .getByTestId("standard-carousel")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function browseCollectionPage() {
    await page.getByTestId("grid-container").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, {
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await page
      .getByRole("button", { name: "Related" })
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    await page.getByTestId("pv-nav-search-dropdown-trigger").first().click();
    const searchbarLocator = page
      .locator('input#pv-search-nav[type="search"]')
      .first();
    await searchbarLocator.fill(SEARCH_PHRASE);
    await searchbarLocator.press("Enter");
    await page
      .getByTestId("grid-container")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }
}

async function testAppleTV() {
  const labelPrefix = `${testAppleTV.name}:`;

  const page = await browserContext.newPage();
  await page.goto(`https://tv.apple.com`);

  const scrollContent = await page.evaluateHandle(
    () => document.querySelector<HTMLElement>("div#scrollable-page")!,
  );
  const scrollArgs = { scrollContent, scrollContainer: scrollContent };

  await timerHof(browseHomePage, { labelPrefix })();

  await page.getByRole("heading", { name: "New Releases" }).click();
  await timerHof(browseCollectionPage, { labelPrefix })();

  await page.getByTestId("lockup-container").first().click();
  await timerHof(browseProgramDetailPage, { labelPrefix })();

  await page.getByTestId("person-lockup").first().click();
  await timerHof(browsePersonPage, { labelPrefix })();

  await timerHof(useSearchFeature, { labelPrefix })();

  // helpers

  async function browseHomePage() {
    await closeOpenModals();
    await page.evaluate(scrollToBottom, scrollArgs);
    await attemptOutdatedSelectorRecognition();
  }

  async function closeOpenModals() {
    try {
      await page
        .getByRole("dialog", { includeHidden: false })
        .getByRole("button", { name: "Close" })
        .click({ timeout: 10000 });
    } catch (e) {
      if ((e as Error).name !== "TimeoutError") console.error(e);
    }
  }

  async function browseCollectionPage() {
    await page.getByTestId("grid-item").first().waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await attemptOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await page.getByTestId("product-header").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await attemptOutdatedSelectorRecognition();
  }

  async function browsePersonPage() {
    await page
      .getByTestId("section-container")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await attemptOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    const searchbarLocator = page
      .locator('input[inputmode="search"][placeholder="Search"]')
      .first();
    await searchbarLocator.click();
    await page.getByTestId("grid-item").first().waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await searchbarLocator.pressSequentially(SEARCH_PHRASE, { delay: 500 });
    await page
      .getByRole("listbox", { name: "Suggestions" })
      .waitFor({ state: "visible" });
    await attemptOutdatedSelectorRecognition();

    await searchbarLocator.press("Enter");
    await page
      .getByRole("heading", { name: "Top Results" })
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await attemptOutdatedSelectorRecognition();
  }
}

async function testCrunchyroll() {
  // TODO: they've blocked us; figure out a workaround
  return;

  const labelPrefix = `${testCrunchyroll.name}:`;

  const page = await browserContext.newPage();
  page.route("**imgsrv.crunchyroll.com/**", (r) => r.abort());
  // crunchyroll makes a bunch of image requests to a.storyblok.com that look like
  //   "https://a.storyblok.com/abc/def.jpg/m/360x0?a=b&..."
  page.route(
    (url) =>
      url.pathname
        .split("/")
        .some((pathpart) =>
          MEDIA_FILE_EXTENSIONS.some((ext) => pathpart.endsWith(`.${ext}`)),
        ),
    (r) => r.abort(),
  );
  await page.goto("https://crunchyroll.com");

  await timerHof(browseHomePage, { labelPrefix })();

  await page
    .getByLabel("Main Navigation")
    .getByRole("link", { name: "New", exact: true })
    .click();
  await timerHof(browseNewProgramsListingPage, { labelPrefix })();

  await page
    .getByLabel("Main Navigation")
    .getByRole("link", { name: "Simulcast", exact: true })
    .click();
  await timerHof(browseSimulcastTopLevelListingPage, { labelPrefix })();

  await page
    .getByLabel("Main Navigation")
    .getByRole("button", { name: "Categories" })
    .click();
  await page.getByRole("menuitem", { name: "Action", exact: true }).click();
  await timerHof(browseGenrePage, { labelPrefix })();

  await page
    .getByRole("heading", { name: "Popular" })
    .locator("+ a.view-all-link")
    .click();
  await timerHof(browsePopularInGenrePage, { labelPrefix })();

  await page.goBack();
  await page
    .getByRole("heading", { name: "Comedy" })
    .locator("+ a.view-all-link")
    .click();
  await timerHof(browseGenreInGenrePage, { labelPrefix })();

  await page.getByRole("button", { name: "Categories" }).click();
  await page.getByRole("menuitem", { name: "Browse All" }).click();
  await timerHof(browseAllProgramsPage, { labelPrefix })();

  await timerHof(useSearchFeature, { labelPrefix })();

  // helpers

  async function login() {
    await page
      .getByRole("button", { name: "Log in", exact: true })
      .first()
      .click();
    await page.waitForURL("**sso.crunchyroll.com/login**");
    await page
      .getByLabel("Email or Phone Number")
      .fill(ENV["CRUNCHYROLL_EMAIL"]!);
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(ENV["CRUNCHYROLL_PASSWORD"]!);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("**crunchyroll.com/discover");
  }

  async function browseHomePage() {
    await timerHof(loginIfNeeded, { labelPrefix })();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function loginIfNeeded() {
    try {
      await page.waitForURL("**crunchyroll.com/discover**", { timeout: 5000 });
    } catch (e) {
      if ((e as Error).name !== "TimeoutError") throw e;
      await page.evaluate(scrollToBottom, undefined);
      await timerHof(login, { labelPrefix })();
    }
  }

  async function browseNewProgramsListingPage() {
    await waitForPageLoad();
    // this page has a *ton* of program tiles, all of which look alike;
    //   we don't need to scroll all the way to the bottom
    await page.evaluate(scrollToBottom, {
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseSimulcastTopLevelListingPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function browseGenrePage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function browsePopularInGenrePage() {
    await waitForPageLoad();
    // this page also has homogenous program tiles and goes on forever ...
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 10 });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseGenreInGenrePage() {
    await waitForPageLoad();
    // this page also has homogenous program tiles and goes on forever ...
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 10 });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseAllProgramsPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 5 });
    await page.getByRole("button", { name: "K", exact: true }).click();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 5 });
    await attemptOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    await page
      .locator("div.header-actions")
      .getByRole("link", { name: "Search" })
      .click();
    await page
      .getByPlaceholder("Search...")
      .pressSequentially(SEARCH_PHRASE, { delay: 500 });
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }
}

async function testHotstar() {
  const labelPrefix = `${testHotstar.name}:`;

  const page = await browserContext.newPage();
  await page.route("**://img10.hotstar.com/**", (r) => r.abort());
  await page.route("**://**.sentry.io/**", (r) => r.abort());

  // home page
  await page.goto(`https://hotstar.com`);
  // move the mouse so the left-menu's backdrop goes away if present
  await page.mouse.move(400, 300);
  await timerHof(browseHomePage, { labelPrefix })();

  // listing page
  await page
    .getByTestId("tray-container-base-wrapper")
    .first()
    .getByTestId("tray-header-composite-wrapper")
    .first()
    .getByRole("heading")
    .click();
  await timerHof(browseListingPage, { labelPrefix })();

  // program-detail
  await page.getByTestId("tray-card-default").first().click();
  await timerHof(browseProgramDetailPage, { labelPrefix })();

  /* search */
  await timerHof(useSearchFeature, { labelPrefix })();

  // helpers

  async function browseHomePage() {
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function browseListingPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, {
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await waitForPageLoad();
    const scrollContent = await page.evaluateHandle(
      () =>
        document.querySelector<HTMLElement>('div[data-testid="modalContent"]')!
          .parentElement!,
    );
    await page.evaluate(scrollToBottom, {
      scrollContent,
      scrollContainer: scrollContent,
    });
    await attemptOutdatedSelectorRecognition();
    await page.getByTestId("closeButton").first().click();
  }

  async function useSearchFeature() {
    await page.getByRole("tab", { name: "Search" }).click();
    // move the mouse so the left-menu's backdrop goes away
    await page.mouse.move(400, 300);
    // focus the search input textbox
    const searchbarLocator = page.locator("input#searchBar");
    await searchbarLocator.click();
    await searchbarLocator.pressSequentially(SEARCH_PHRASE, { delay: 500 });
    // wait for results to load
    await page.getByTestId("loading").waitFor({ state: "hidden" });
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }
}

async function testNetflix() {
  const labelPrefix = `${testNetflix.name}:`;

  const page = await browserContext.newPage();
  page.route("**://**.nflxvideo.net/**", (r) => r.abort());

  let scrollContent: ElementHandle<HTMLElement>;

  // redirects automatically to post-login home page if logged-in
  await page.goto(`https://netflix.com`);
  await timerHof(browseHomePage, { labelPrefix })();

  await page.locator("a.rowTitle", { hasText: "Explore All" }).first().click();
  await timerHof(browseListingPage, { labelPrefix })();

  await timerHof(useSearchFeature, { labelPrefix })();

  await page
    .locator('a[data-uia="search-gallery-video-card"]')
    .first()
    .dispatchEvent("mouseover");
  await timerHof(browseProgramDetailPage, { labelPrefix })();

  // helpers

  async function browseHomePage() {
    await timerHof(loginIfNeeded, { labelPrefix })();
    await timerHof(dismissProfileSelectorIfNeeded, { labelPrefix })();
    await page.evaluate(scrollToBottom, {
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function loginIfNeeded() {
    try {
      await page.waitForURL("**netflix.com/browse**", { timeout: 10000 });
    } catch (e) {
      if ((e as Error).name !== "TimeoutError") throw e;
      await timerHof(login, { labelPrefix })();
    }
  }

  async function login() {
    await page.getByLabel("Email or mobile number").fill(ENV["NETFLIX_EMAIL"]!);
    await page.getByRole("button", { name: "Continue" }).click();
    await delayMs(3000);
    const passwordLocator = page.getByLabel("Password");
    if (await passwordLocator.isHidden()) {
      await page.getByText("Get Help").click();
      await page.getByText("Use password instead").click();
    }
    await passwordLocator.fill(ENV["NETFLIX_PASSWORD"]!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/browse");
  }

  async function dismissProfileSelectorIfNeeded() {
    const profileSelectionLocator = page.locator(
      'a.profile-link[data-uia="action-select-profile+primary"]',
    );
    if (await profileSelectionLocator.isVisible()) {
      await profileSelectionLocator.click();
      await waitForPageLoad();
    }
  }

  async function browseListingPage() {
    await waitForPageLoad();
    scrollContent = await page.evaluateHandle(
      () =>
        document.querySelector<HTMLElement>(
          'div[data-uia="modal-content-wrapper"]',
        )!.parentElement!,
    );
    await page.evaluate(scrollToBottom, {
      scrollContent,
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await attemptOutdatedSelectorRecognition();
    await page.locator('button[data-uia="modal-default-close-btn"]').click();
  }

  async function useSearchFeature() {
    await page.getByRole("button", { name: "Search" }).click();
    await page
      .locator("input#searchInput")
      .pressSequentially("action", { delay: 500 });
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await attemptOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await waitForPageLoad();
    await page.getByRole("button", { name: "expand to detail modal" }).click();
    await waitForPageLoad();
    await page.getByRole("button", { name: "expand section" }).first().click();
    await waitForPageLoad();
    scrollContent = await page.evaluateHandle(
      () =>
        document.querySelector<HTMLElement>('div.detail-modal[role="dialog"]')!,
    );
    await page.evaluate(scrollToBottom, { scrollContent });
    await attemptOutdatedSelectorRecognition();
  }
}

async function testSonyLiv() {
  // Note: SonyLIV appears to have anti-robot detection. Visiting and trying
  //   to navigate the webpage in Playwright eventually leads to a
  //   net::ERR_HTTP2_PROTOCOL_ERROR in the browser console, and an
  //   undismissable error modal on the page itself
  // TODO
}

async function testYoutubeMovies() {
  const labelPrefix = `${testYoutubeMovies.name}:`;

  const page = await browserContext.newPage();
  page.route("**.googlevideo.com/**", (r) => r.abort());

  await page.goto("https://youtube.com");
  await waitForPageLoad();

  const scrollContent = await page.evaluateHandle(
    () => document.querySelector<HTMLElement>("ytd-app")!,
  );

  // yt movies feed
  await page.locator('a[title="Movies"]').click();
  await timerHof(browseStorefront, { labelPrefix })();

  // yt movies - category page
  await page
    .locator("div#title-container", { hasText: "Top selling" })
    .getByRole("link", { name: "View all" })
    .click();
  await timerHof(browseCategoryPage, { labelPrefix })();

  // yt movies - purchases page
  await page.getByRole("tab", { name: "Purchased" }).click();
  await timerHof(browsePurchasesPage, { labelPrefix })();

  // single-program page
  await page.getByRole("tab", { name: "Browse" }).click();
  await timerHof(browseSingleMoviePage, { labelPrefix })();

  // helpers

  async function browseStorefront() {
    await page.waitForURL("**/feed/storefront**");
    await waitForPageLoad();
    await page.getByRole("button", { name: "Next" }).first().click();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, {
      scrollContent,
      maxTimesToScroll: 10,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseCategoryPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, {
      scrollContent,
      maxTimesToScroll: 10,
    });
    await attemptOutdatedSelectorRecognition();
  }

  async function browsePurchasesPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, { scrollContent });
    await attemptOutdatedSelectorRecognition();
  }

  async function browseSingleMoviePage() {
    await waitForPageLoad();
    await page.locator("ytd-grid-movie-renderer a#thumbnail").first().click();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, {
      scrollContent,
      maxTimesToScroll: 10,
    });
    await attemptOutdatedSelectorRecognition();
  }
}

function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ScrollToBottomArgs = {
  scrollContent?: HTMLElement;
  scrollContainer?: HTMLElement | Window;
  maxTimesToPauseForAdditionalContentToLoad?: number;
  maxTimesToScroll?: number;
};
function scrollToBottom(
  {
    scrollContent = document.body,
    scrollContainer = window,
    maxTimesToPauseForAdditionalContentToLoad = Infinity,
    maxTimesToScroll = Infinity,
  }: ScrollToBottomArgs = {} as ScrollToBottomArgs,
) {
  const SCROLL_STEP = 300; // px per step
  const SCROLL_INTERVAL_MS = 500; // ms between steps
  const NEAR_BOTTOM_THRESHOLD = 600; // px from bottom to trigger a pause
  const NEAR_BOTTOM_PAUSE_MS = 3000; // ms to wait when near bottom for content to load

  return new Promise<void>((resolve) => {
    let pausedForLoad = false;
    let nTimesPaused = 0;
    let nTimesScrolled = 0;

    const interval = setInterval(async () => {
      const distanceFromTop =
        scrollContainer instanceof Window
          ? scrollContainer.scrollY + scrollContainer.innerHeight
          : scrollContainer.scrollTop + scrollContainer.offsetHeight;
      const distanceFromBottom = scrollContent.scrollHeight - distanceFromTop;

      if (
        distanceFromBottom <= 0 ||
        nTimesPaused >= maxTimesToPauseForAdditionalContentToLoad ||
        nTimesScrolled >= maxTimesToScroll
      ) {
        clearInterval(interval);
        resolve();
        return;
      }

      if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD && !pausedForLoad) {
        ++nTimesPaused;

        pausedForLoad = true;
        await new Promise((res) => setTimeout(res, NEAR_BOTTOM_PAUSE_MS));
        pausedForLoad = false;
      }

      if (!pausedForLoad) {
        ++nTimesScrolled;
        scrollContainer.scrollBy({ top: SCROLL_STEP, behavior: "smooth" });
      }
    }, SCROLL_INTERVAL_MS);
  });
}

function randBetween(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo));
}

async function waitForPageLoad() {
  await delayMs(randBetween(2000, 10000));
}

// this fn should be called after scrolling sufficiently far down
//   a page so that we're sure all pc- and p-node variants have loaded
async function attemptOutdatedSelectorRecognition() {
  await extensionServiceWorker.evaluate(async () => {
    const FIND_PROGRAMS_PAUSE = 3000;

    // @ts-expect-error: the 'chrome' global is available here, since this fn
    //   runs in the service-worker's scope
    await chrome.storage.local.set({ outdatedSelectorDetectionEnabled: true });

    // wait long enough for the content-script to run page.findPrograms at
    //   least once
    await new Promise((res) => setTimeout(res, FIND_PROGRAMS_PAUSE));

    // @ts-expect-error: the 'chrome' global is available here, since this fn
    //   runs in the service-worker's scope
    await chrome.storage.local.set({ outdatedSelectorDetectionEnabled: false });
  });
}
