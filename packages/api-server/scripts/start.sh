#!/usr/bin/env bash

set -eu

# date -u +%Y-%m-%dT%H:%M:%S.%3NZ

node \
  --experimental-import-text \
  --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
  server.ts
