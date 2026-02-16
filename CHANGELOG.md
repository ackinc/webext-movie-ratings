# Changelog

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
