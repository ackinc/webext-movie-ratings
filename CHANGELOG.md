# Changelog

## v9.2.0

- Added support for Hulu

## v9.1.0

- Added support for HBOMax, PeacockTV, Zee5, and MXPlayer
- Popup can now display in-apps notifications; on extension update, the service-worker will attempt to open the popup if it detects one is available

## v9.0.5

- Ratings now show up on streaming websites' "preview" tiles, which show up when hovering over program tiles

## v9.0.0

- Sift now automatically attempts to match programs that the OMDB API could not find a rating for

## v8.1.1

- Now asking permission for primevideo.com and amazon.com(/gp/video) separately
- Fixed annoying PrimeVideo bug where Sift fades a filtered-out program while the user is hovering on its tile

## v8.1.0

- Extension content script now pauses activity when tab is backgrounded

## v8.0.0

- All host permissions now optional
- Added a settings page where users can choose which OTT sites Sift operates on
- Added onboarding flow

## v7.0.6

- Slow ratings-API-responses for one/more programs no longer hold up the extension from showing cached ratings wherever available

## v7.0.3

- Methods responsible for extracting data from the webpage - `Page::getTitleForProgramContainerNode` and `ProgramNode::extractProgramData` - no longer suppress (most) errors caused by webpage markup changes. This means extension breakage due to markup changes should surface faster when error-reporting is enabled
- Fixed bug where ratings weren't showing up on various parts of SonyLIV

## v7.0.0

- Added support for YoutubeMovies

## v6.4.0

- Added logic for early detection of website markup changes - if a selector that was returning results (either program containers or programs) on a particular page suddenly stops returning results, we now report that as an error in Sentry

## v6.3.4

- Errors will not group better in Sentry (moved unhelpfully specific information outside error message)

## v6.3.1

- Added a CTA for users to provide feedback

## v6.3.0

- Now rate-limiting requests to the OMDB API
- Added telemetry (local-dev ONLY) to help understand rate of requests for ratings, and rate at which API calls are made

## v6.2.0

- Extension now reinjects content scripts into already-open OTT tabs when re-enabled after previously being disabled
- Added object store for basic telemetry
- `npm run publish:all` will now only upload source maps to Sentry once; this has been achieved through a new flag - `--sentry-upload-srcmaps` - for the build script

## v6.1.0

- Migrated a bunch of scripts to typescript
- Migrated ratings cache from extension local-storage to indexedDB
