#!/usr/bin/env bash

set -euo pipefail

# date -u +%Y-%m-%dT%H:%M:%S.%3NZ

node \
  --experimental-import-text \
  --watch \
  --watch-preserve-output \
  --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
  server.ts \
  | pino-pretty
