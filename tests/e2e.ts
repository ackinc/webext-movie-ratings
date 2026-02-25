import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { Route } from "playwright";

const REPORT_ERRORS = process.argv.includes("--sentry-report-errors");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, "../dist");
const userDataDir = `/tmp/sift-test-data-dir`;
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
  "**/*.{jpeg,jpg,png,webp,mp3,m4s,mp4,webm,avif}",
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
const results = await Promise.allSettled([testPrimeVideo(), testAppleTV()]);
results.forEach((result) => {
  if (result.status === "rejected") console.error(result.reason);
});
await browserContext.close();
fs.rmSync(userDataDir, { recursive: true });

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
  await page.evaluate(scrollToBottom, scrollablePage);
  await waitForOutdatedSelectorRecognition();

  // collection page
  await page.getByRole("heading", { name: "New Releases" }).click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollablePage);
  await waitForOutdatedSelectorRecognition();

  // program-detail page
  await page.getByTestId("lockup-container").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollablePage);
  await waitForOutdatedSelectorRecognition();

  // person page
  await page.getByTestId("person-lockup").first().click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollablePage);
  await waitForOutdatedSelectorRecognition();

  // search feature
  const searchbarLocator = page
    .locator('input[inputmode="search"][placeholder="Search"]')
    .first();
  await searchbarLocator.click();
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollablePage);
  // not using randword here since most words are going to return 0 search
  //   results, and AppleTV doesn't show suggestions that don't quite match
  //   the query
  await searchbarLocator.pressSequentially("genius", { delay: 500 });
  await waitForOutdatedSelectorRecognition();

  await searchbarLocator.press("Enter");
  await waitForPageLoad();
  await page.evaluate(scrollToBottom, scrollablePage);
  await waitForOutdatedSelectorRecognition();
}

function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrollToBottom(elem?: HTMLElement) {
  const SCROLL_STEP = 300; // px per step
  const SCROLL_INTERVAL_MS = 500; // ms between steps
  const NEAR_BOTTOM_THRESHOLD = 600; // px from bottom to trigger a pause
  const NEAR_BOTTOM_PAUSE_MS = 3000; // ms to wait when near bottom for content to load

  return new Promise<void>((resolve) => {
    let pausedForLoad = false;

    const interval = setInterval(async () => {
      const distanceFromBottom = elem
        ? elem.scrollHeight - (elem.offsetHeight + elem.scrollTop)
        : document.body.scrollHeight - (window.scrollY + window.innerHeight);

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
        (elem ?? window).scrollBy({ top: SCROLL_STEP, behavior: "smooth" });
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
  await delayMs(randBetween(20000, 30000));
}
