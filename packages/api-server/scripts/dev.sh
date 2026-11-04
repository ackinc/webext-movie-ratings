#!/usr/bin/env bash

set -euo pipefail

# date +%Y-%m-%dT%H:%M:%S.%3NZ

# putting these OTEL-env vars here rather than in .env because
#   their vals will be different for the crons script

OTEL_SERVICE_NAME=sift-api-server \
OTEL_NODE_ENABLED_INSTRUMENTATIONS="host-metrics,http" \
node \
  --experimental-import-text \
  --watch \
  --watch-preserve-output \
  --import='data:text/javascript,import { register } from "node:module";
                                 import { pathToFileURL } from "node:url";
                                 register("@opentelemetry/instrumentation/hook.mjs", pathToFileURL("./"));' \
  server.ts \
  | pino-pretty
