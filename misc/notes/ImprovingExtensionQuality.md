# Goal

We need to have a clear view of the quality of the extension at all times.

Quality depends on the following:

1. Are ratings showing up on every webpage of every supported OTT?

   a. Every OTT has a home page, listing pages, program-detail pages, and search preview / search results pages

   b. Some OTTs have "Person" pages (AppleTV)

   c. Some OTTs have a variety of listing pages with different formats (Crunchyroll)

2. What % of the programs on each webpage is the extension able to find?

   a. Should be as close to 100% as possible

   b. No way to correctly and exactly answer this question without manual examination of the webpage

   c. Webpage markup changes will cause this % to fall; outdated selector detection logic will help identify when this happens

3. What % of the programs identified on each webpage are we unable to show ratings for?

   a. Should be as close to 0% as possible

   b. webpage-ratings-stats telemetry collects this data separately for each visit to a webpage

4. How many errors are occurring during extension use?

5. Are ratings-API response times reasonable?

   a. ratings-api-response-times telemetry is available

---

Using the browseOTTs script, we can identify any decrease in quality pre-emptively

- every day:
  - visit every webpage (api mocking enabled)
  - report an error if ratings don't show up within a few seconds
  - scroll to the bottom (or until program listings become homogenous)
  - wait for outdated selector detection

- every week:
  - visit every webpage (api mocking disabled)
  - collect information:
    - %NA and %NF on each webpage
    - specific programs for which ratings are unavailable
    - ratings-API-response-time p50/95/99 data

Add a dashboard (APP_ENV must be `development` or `testing`) at `chrome-extension://${extensionId}/dashboard` that reads the telemetry data and answers the following qns:

- How many errors of each type (data-extraction, outdated-selector-detection, ... other) occurred during the run?
  - TODO: add error telemetry
- What % of programs were we unable to show ratings for (horiz. bar chart, each bar === 1 webpage, worst % longest bar)?
- What are the specific titles for which the ratings API provider had no ratings?
  - maybe hovering over a specific bar can trigger a popup that will list the titles from the webpage?
- What were the p50/p95 ratings-api-response times?
