import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { chromium } from "playwright";
import type { ElementHandle, Route } from "playwright";

import { pick } from "../utils/index.ts";

const env = pick(
  process.env,
  [
    "NETFLIX_EMAIL",
    "NETFLIX_PASSWORD",
    "CRUNCHYROLL_EMAIL",
    "CRUNCHYROLL_PASSWORD",
  ],
  true,
) as Record<string, string>;

const REPORT_ERRORS = process.argv.includes("--sentry-report-errors");
const SITE_TO_TESTFN_MAP = {
  amazonprimevideo: testAmazonPrimeVideo,
  appletv: testAppleTV,
  crunchyroll: testCrunchyroll,
  hotstar: testHotstar,
  netflix: testNetflix,
  sonyliv: testSonyLiv,
  youtubemovies: testYoutubeMovies,
};
const SITES_TO_TEST =
  process.argv.indexOf("--site=all") >= 0
    ? (Object.keys(SITE_TO_TESTFN_MAP) as (keyof typeof SITE_TO_TESTFN_MAP)[])
    : (
        Object.keys(SITE_TO_TESTFN_MAP) as (keyof typeof SITE_TO_TESTFN_MAP)[]
      ).filter((site) =>
        process.argv.some((x) => x.startsWith(`--site=${site}`)),
      );
const MEDIA_FILE_EXTENSIONS = [
  "jpe",
  "jpeg",
  "jpg",
  "png",
  "webp",
  "mp3",
  "m4s",
  "mp4",
  "webm",
  "avif",
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, "../dist");
const userDataDir = path.join(__dirname, `../tmp/sift-e2e-test-data-dir`);
const words = fs
  .readFileSync(path.join(__dirname, "../words.txt"), "utf-8")
  .split("\n");

// Launch persistent context with extension arguments
const browserContext = await chromium.launchPersistentContext(userDataDir, {
  headless: false, // Required for extensions
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
  viewport: { width: 1728, height: 864 },
});

// disable requests for media
await browserContext.route(
  (url) =>
    MEDIA_FILE_EXTENSIONS.some((ext) => url.pathname.endsWith(`.${ext}`)),
  (r) => r.abort(),
);
// disable tracking
await browserContext.route("**://**.quora.com/**", (r) => r.abort());
await browserContext.route("**://**.facebook.com/**", (r) => r.abort());
await browserContext.route("**://**.facebook.net/**", (r) => r.abort());
await browserContext.route("**://analytics.google.com/**", (r) => r.abort());
await browserContext.route("**://adservice.google.com/**", (r) => r.abort());
await browserContext.route("**://google-analytics.com/**", (r) => r.abort());
await browserContext.route("**://**.googletagmanager.com/**", (r) => r.abort());
await browserContext.route("**://**.doubleclick.net/**", (r) => r.abort());
await browserContext.route("**://bat.bing.com/**", (r) => r.abort());
await browserContext.route("**://analytics.twitter.com/**", (r) => r.abort());
await browserContext.route("**://**.ads-twitter.com/**", (r) => r.abort());
// mock rating API responses
await browserContext.route("**://www.omdbapi.com/**", ratingsApiInterceptor);

const startTime = +new Date();
await setSiftErrorReporting(REPORT_ERRORS);
const results = await Promise.allSettled(
  SITES_TO_TEST.map((site) => SITE_TO_TESTFN_MAP[site]()),
);
const errors: Error[] = results
  .filter((r) => r.status === "rejected")
  .map((r) => r.reason);
errors.forEach(console.error);
const runDurationSeconds = Math.round((+new Date() - startTime) / 1000);
console.log(
  `Done in ${runDurationSeconds}s with ${errors.length} error${errors.length === 1 ? "" : "s"}`,
);
if (errors.length === 0) {
  await browserContext.close();
}

// helpers

async function ratingsApiInterceptor(route: Route) {
  await delayMs(Math.floor(Math.random() * 100) + 1);
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ imdbID: "xyz", imdbRating: "5.4" }),
  });
}

async function setSiftErrorReporting(optIn: boolean = true) {
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());

  // get extension id
  await page.goto("chrome://extensions/");
  await page.locator("cr-toggle#devMode").click();
  const extensionCard = page.locator("extensions-item").first();
  const extensionId = await extensionCard.getAttribute("id");

  // opt-in to sift error reporting
  await page.goto(`chrome-extension://${extensionId}/popup/index.html`);
  await page.locator("input#optInToErrorReporting").setChecked(optIn);
}

async function testAmazonPrimeVideo() {
  const page = await browserContext.newPage();
  await page.goto(`https://primevideo.com`);

  await page.getByRole("link", { name: "Movies", exact: true }).click();
  await browseMoviesPage();

  await page.getByText("See more").first().click();
  await browseCollectionPage();

  await page.locator('article[data-card-entity-type="Movie"]').first().click();
  await browseProgramDetailPage();

  await useSearchFeature();

  // helpers

  async function browseMoviesPage() {
    await page
      .getByTestId("standard-carousel")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function browseCollectionPage() {
    await page.getByTestId("grid-container").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await page.getByTestId("tab-content-related").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    await page.getByTestId("pv-nav-search-dropdown-trigger").first().click();
    const searchbarLocator = page
      .locator('input#pv-search-nav[type="search"]')
      .first();
    await searchbarLocator.fill(randWord());
    await searchbarLocator.press("Enter");
    await page.getByTestId("grid-container").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }
}

async function testAppleTV() {
  const page = await browserContext.newPage();
  await page.goto(`https://tv.apple.com`);

  const scrollContent = await page.evaluateHandle(
    () => document.querySelector<HTMLElement>("div#scrollable-page")!,
  );
  const scrollArgs = { scrollContent, scrollContainer: scrollContent };

  await browseHomePage();

  await page.getByRole("heading", { name: "New Releases" }).click();
  await browseCollectionPage();

  await page.getByTestId("lockup-container").first().click();
  await browseProgramDetailPage();

  await page.getByTestId("person-lockup").first().click();
  await browsePersonPage();

  await useSearchFeature();

  // helpers

  async function browseHomePage() {
    await closeOpenModals();
    await page.evaluate(scrollToBottom, scrollArgs);
    await waitForOutdatedSelectorRecognition();
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
    await waitForOutdatedSelectorRecognition();
  }

  async function browseProgramDetailPage() {
    await page.getByTestId("product-header").waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await waitForOutdatedSelectorRecognition();
  }

  async function browsePersonPage() {
    await page
      .getByTestId("section-container")
      .first()
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await waitForOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    const searchbarLocator = page
      .locator('input[inputmode="search"][placeholder="Search"]')
      .first();
    await searchbarLocator.click();
    await page.getByTestId("grid-item").first().waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    // not using randword here since most words are going to return 0 search
    //   results, and AppleTV doesn't show suggestions that don't quite match
    //   the query
    await searchbarLocator.pressSequentially("hijack", { delay: 500 });
    await page
      .getByRole("list", { name: "Suggestions" })
      .waitFor({ state: "visible" });
    await waitForOutdatedSelectorRecognition();

    await searchbarLocator.press("Enter");
    await page
      .getByRole("heading", { name: "Top Results" })
      .waitFor({ state: "visible" });
    await page.evaluate(scrollToBottom, scrollArgs);
    await waitForOutdatedSelectorRecognition();
  }
}

async function testCrunchyroll() {
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

  await browseHomePage();

  await page
    .getByLabel("Main Navigation")
    .getByRole("link", { name: "New", exact: true })
    .click();
  await browseNewProgramsListingPage();

  await page
    .getByLabel("Main Navigation")
    .getByRole("link", { name: "Simulcast", exact: true })
    .click();
  await browseSimulcastTopLevelListingPage();

  await page
    .getByLabel("Main Navigation")
    .getByRole("button", { name: "Categories" })
    .click();
  await page.getByRole("menuitem", { name: "Action", exact: true }).click();
  await browseGenrePage();

  await page
    .getByRole("heading", { name: "Popular" })
    .locator("+ a.view-all-link")
    .click();
  await browsePopularInGenrePage();

  await page.goBack();
  await page
    .getByRole("heading", { name: "Comedy" })
    .locator("+ a.view-all-link")
    .click();
  await browseGenreInGenrePage();

  await page.getByRole("button", { name: "Categories" }).click();
  await page.getByRole("menuitem", { name: "Browse All" }).click();
  await browseAllProgramsPage();

  await useSearchFeature();

  // helpers

  async function login() {
    await page
      .getByRole("button", { name: "Log in", exact: true })
      .first()
      .click();
    await page.waitForURL("**sso.crunchyroll.com/login**");
    await page
      .getByLabel("Email or Phone Number")
      .fill(env["CRUNCHYROLL_EMAIL"]!);
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(env["CRUNCHYROLL_PASSWORD"]!);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("**crunchyroll.com/discover");
  }

  async function browseHomePage() {
    await loginIfNeeded();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function loginIfNeeded() {
    try {
      await page.waitForURL("**crunchyroll.com/discover", { timeout: 5000 });
    } catch (e) {
      if ((e as Error).name !== "TimeoutError") throw e;

      await page.evaluate(scrollToBottom, undefined);
      await login();
    }
  }

  async function browseNewProgramsListingPage() {
    await waitForPageLoad();
    // this page has a *ton* of program tiles, all of which look alike;
    //   we don't need to scroll all the way to the bottom
    await page.evaluate(scrollToBottom, {
      maxTimesToPauseForAdditionalContentToLoad: 2,
    });
    await waitForOutdatedSelectorRecognition();
  }

  async function browseSimulcastTopLevelListingPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function browseGenrePage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }

  async function browsePopularInGenrePage() {
    await waitForPageLoad();
    // this page also has homogenous program tiles and goes on forever ...
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 10 });
    await waitForOutdatedSelectorRecognition();
  }

  async function browseGenreInGenrePage() {
    await waitForPageLoad();
    // this page also has homogenous program tiles and goes on forever ...
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 10 });
    await waitForOutdatedSelectorRecognition();
  }

  async function browseAllProgramsPage() {
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 5 });
    await page.getByRole("button", { name: "K", exact: true }).click();
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, { maxTimesToScroll: 5 });
    await waitForOutdatedSelectorRecognition();
  }

  async function useSearchFeature() {
    await page
      .locator("div.header-actions")
      .getByRole("link", { name: "Search" })
      .click();
    await page
      .getByPlaceholder("Search...")
      .pressSequentially("action", { delay: 500 });
    await waitForPageLoad();
    await page.evaluate(scrollToBottom, undefined);
    await waitForOutdatedSelectorRecognition();
  }
}

async function testHotstar() {
  const page = await browserContext.newPage();

  await page.route("**://img10.hotstar.com/**", (r) => r.abort());
  await page.route("**://**.sentry.io/**", (r) => r.abort());

  // home page
  await page.goto(`https://hotstar.com`);
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // listing page
  await page.getByRole("heading", { name: /latest releases/i }).click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // program-detail
  await page.getByTestId("tray-card-default").first().click();
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
  await waitForOutdatedSelectorRecognition();
  await page.getByTestId("closeButton").first().click();

  /* search */
  await page.getByRole("tab", { name: "Search" }).click();
  // move the mouse to the right so the left-menu's backdrop goes away
  await page.mouse.move(200, 0);
  // focus the search input textbox
  const searchbarLocator = page.locator("input#searchBar");
  await searchbarLocator.click();
  await searchbarLocator.pressSequentially("action", { delay: 500 });
  // wait for results to load
  await page.getByTestId("loading").isHidden();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();
}

async function testNetflix() {
  const page = await browserContext.newPage();
  page.route("**://**.nflxvideo.net/**", (r) => r.abort());

  let scrollContent: ElementHandle<HTMLElement>;

  await page.goto(`https://netflix.com/login`);
  try {
    // if user is already logged-in, they will be redirected to /browse
    await page.waitForURL("**/browse", { timeout: 10000 });
  } catch (e) {
    if ((e as Error).name !== "TimeoutError") throw e;

    await login();
  }

  const profileSelectionLocator = page.locator(
    'a.profile-link[data-uia="action-select-profile+primary"]',
  );
  if (await profileSelectionLocator.isVisible()) {
    await profileSelectionLocator.click();
    await waitForPageLoad();
  }

  // home page
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // listing page
  await page.locator("a.rowTitle", { hasText: "Explore All" }).first().click();
  await waitForPageLoad();
  scrollContent = await page.evaluateHandle(
    () =>
      document.querySelector<HTMLElement>(
        'div[data-uia="modal-content-wrapper"]',
      )!.parentElement!,
  );
  await page.evaluate(scrollToBottom, { scrollContent });
  await waitForOutdatedSelectorRecognition();
  await page.locator('button[data-uia="modal-default-close-btn"]').click();

  // search
  await page.getByRole("button", { name: "Search" }).click();
  await page
    .locator("input#searchInput")
    .pressSequentially("action", { delay: 500 });
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // program-detail page
  await page
    .locator('a[data-uia="search-gallery-video-card"]')
    .first()
    .dispatchEvent("mouseover");
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
  await waitForOutdatedSelectorRecognition();

  async function login() {
    await page.getByLabel("Email or mobile number").fill(env["NETFLIX_EMAIL"]!);
    await page.getByRole("button", { name: "Continue" }).click();
    await delayMs(3000);
    const passwordLocator = page.getByLabel("Password");
    if (await passwordLocator.isHidden()) {
      await page.getByText("Get Help").click();
      await page.getByText("Use password instead").click();
    }
    await passwordLocator.fill(env["NETFLIX_PASSWORD"]!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/browse");
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
  const page = await browserContext.newPage();
  page.route("**.googlevideo.com/**", (r) => r.abort());

  await page.goto("https://youtube.com");
  await waitForPageLoad();

  const scrollContent = await page.evaluateHandle(
    () => document.querySelector<HTMLElement>("ytd-app")!,
  );

  // yt movies feed
  await page.locator('a[title="Movies"]').click();
  await page.waitForURL("**/feed/storefront**");
  await waitForPageLoad();
  await page.getByRole("button", { name: "Next" }).first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, { scrollContent });
  await waitForOutdatedSelectorRecognition();

  // yt movies - view all
  await page
    .locator("div#title-container", { hasText: "Top selling" })
    .getByRole("link", { name: "View all" })
    .click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, { scrollContent });
  await waitForOutdatedSelectorRecognition();

  // yt movies - purchased
  await page.getByRole("tab", { name: "Purchased" }).click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, { scrollContent });
  await waitForOutdatedSelectorRecognition();

  await page.getByRole("tab", { name: "Browse" }).click();
  await waitForPageLoad();
  // single-program page
  await page.locator("ytd-grid-movie-renderer a#thumbnail").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, { scrollContent });
  await waitForOutdatedSelectorRecognition();
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

function randWord() {
  return words[randBetween(0, words.length)]!;
}

function randBetween(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo));
}

async function waitForPageLoad() {
  await delayMs(randBetween(2000, 10000));
}

async function waitForOutdatedSelectorRecognition() {
  await delayMs(REPORT_ERRORS ? randBetween(30000, 35000) : 0);
}
