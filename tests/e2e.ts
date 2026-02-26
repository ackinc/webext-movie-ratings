import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { chromium } from "playwright";
import type { ElementHandle, Route } from "playwright";

// TODO: can we do better?
import { pick } from "../scripts/common.ts";

const env = pick(
  process.env,
  ["NETFLIX_EMAIL", "NETFLIX_PASSWORD"],
  true,
) as Record<string, string>;

const REPORT_ERRORS = process.argv.includes("--sentry-report-errors");
const SITE_TO_TESTFN_MAP = {
  amazonprimevideo: testPrimeVideo,
  appletv: testAppleTV,
  crunchyroll: testCrunchyroll,
  hotstar: testHotstar,
  netflix: testNetflix,
  sonyliv: testSonyLiv,
  youtubemovies: testYoutubeMovies,
};
const SITES_TO_TEST =
  process.argv.indexOf("--test=all") >= 0
    ? (Object.keys(SITE_TO_TESTFN_MAP) as (keyof typeof SITE_TO_TESTFN_MAP)[])
    : (
        Object.keys(SITE_TO_TESTFN_MAP) as (keyof typeof SITE_TO_TESTFN_MAP)[]
      ).filter((site) =>
        process.argv.some((x) => x.startsWith(`--test=${site}`)),
      );

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, "../dist");
const userDataDir = path.join(__dirname, `../tmp/sift-e2e-test-data-dir`);
const words = fs
  .readFileSync(path.join(__dirname, "./words.txt"), "utf-8")
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
    ["jpeg", "jpg", "png", "webp", "mp3", "m4s", "mp4", "webm", "avif"].some(
      (ext) => url.pathname.endsWith(`.${ext}`),
    ),
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

await setSiftErrorReporting(REPORT_ERRORS);
const results = await Promise.allSettled(
  SITES_TO_TEST.map((site) => SITE_TO_TESTFN_MAP[site]()),
);
results.forEach((result) => {
  if (result.status === "rejected") console.error(result.reason);
});
await browserContext.close();
console.log("All done!");

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

async function testPrimeVideo() {
  const page = await browserContext.newPage();

  await page.goto(`https://primevideo.com/movie`);
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // visit a collection page
  await page.getByText("See more").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // visit a program-detail page
  await page.locator('article[data-card-entity-type="Movie"]').first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();

  // use the search feature
  await page.getByTestId("pv-nav-search-dropdown-trigger").first().click();
  const searchbarLocator = page
    .locator('input#pv-search-nav[type="search"]')
    .first();
  await searchbarLocator.fill(randWord());
  await searchbarLocator.press("Enter");
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, undefined);
  await waitForOutdatedSelectorRecognition();
}

async function testAppleTV() {
  const page = await browserContext.newPage();

  // home page
  await page.goto(`https://tv.apple.com`);
  // close any open modals
  try {
    await page
      .getByRole("dialog", { includeHidden: false })
      .getByRole("button", { name: "Close" })
      .click({ timeout: 10000 });
  } catch (e) {
    if ((e as Error).name !== "TimeoutError") console.error(e);
  }
  const scrollablePage = await page.evaluateHandle(
    () => document.querySelector<HTMLElement>("div#scrollable-page")!,
  );
  const scrollArgs = {
    scrollContent: scrollablePage,
    scrollContainer: scrollablePage,
  };
  await page.evaluate(scrollToBottom, scrollArgs);
  await waitForOutdatedSelectorRecognition();

  // collection page
  await page.getByRole("heading", { name: "New Releases" }).click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollArgs);
  await waitForOutdatedSelectorRecognition();

  // program-detail page
  await page.getByTestId("lockup-container").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollArgs);
  await waitForOutdatedSelectorRecognition();

  // person page
  await page.getByTestId("person-lockup").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollArgs);
  await waitForOutdatedSelectorRecognition();

  // search feature
  const searchbarLocator = page
    .locator('input[inputmode="search"][placeholder="Search"]')
    .first();
  await searchbarLocator.click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollArgs);
  // not using randword here since most words are going to return 0 search
  //   results, and AppleTV doesn't show suggestions that don't quite match
  //   the query
  await searchbarLocator.pressSequentially("genius", { delay: 500 });
  await waitForOutdatedSelectorRecognition();

  await searchbarLocator.press("Enter");
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollArgs);
  await waitForOutdatedSelectorRecognition();
}

async function testCrunchyroll() {}

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

async function testSonyLiv() {}

async function testYoutubeMovies() {}

function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ScrollToBottomArgs = {
  scrollContent?: HTMLElement;
  scrollContainer?: HTMLElement | Window;
};
function scrollToBottom(
  {
    scrollContent = document.body,
    scrollContainer = window,
  }: ScrollToBottomArgs = {} as ScrollToBottomArgs,
) {
  const SCROLL_STEP = 300; // px per step
  const SCROLL_INTERVAL_MS = 500; // ms between steps
  const NEAR_BOTTOM_THRESHOLD = 600; // px from bottom to trigger a pause
  const NEAR_BOTTOM_PAUSE_MS = 3000; // ms to wait when near bottom for content to load

  return new Promise<void>((resolve) => {
    let pausedForLoad = false;

    const interval = setInterval(async () => {
      const distanceFromTop =
        scrollContainer instanceof Window
          ? scrollContainer.scrollY + scrollContainer.innerHeight
          : scrollContainer.scrollTop + scrollContainer.offsetHeight;
      const distanceFromBottom = scrollContent.scrollHeight - distanceFromTop;

      if (distanceFromBottom <= 0) {
        clearInterval(interval);
        resolve();
        return;
      }

      if (distanceFromBottom <= NEAR_BOTTOM_THRESHOLD && !pausedForLoad) {
        pausedForLoad = true;
        await new Promise((res) => setTimeout(res, NEAR_BOTTOM_PAUSE_MS));
        pausedForLoad = false;
      }

      if (!pausedForLoad) {
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
