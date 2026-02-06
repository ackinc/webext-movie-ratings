### v6.2.0

- Extension now reinjects content scripts into already-open OTT tabs when re-enabled after previously being disabled
- Added object store for basic telemetry
- `npm run publish:all` will now only upload source maps to Sentry once; this has been achieved through a new flag - `--sentry-upload-srcmaps` - for the build script

### v6.1.0

- Migrated a bunch of scripts to typescript
- Migrated ratings cache from extension local-storage to indexedDB
