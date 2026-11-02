#!/usr/bin/env bash

set -euo pipefail

# date +%Y-%m-%dT%H:%M:%S.%3NZ

# node \
#   --experimental-import-text \
#   --watch \
#   --watch-preserve-output \
#   --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
#   server.ts \
#   | pino-pretty

node \
  --experimental-import-text \
  --watch \
  --watch-preserve-output \
  --import='data:text/javascript,import { register } from "node:module";
                                 import { pathToFileURL } from "node:url";
                                 register("@opentelemetry/instrumentation/hook.mjs", pathToFileURL("./"));' \
  server.ts \
  | pino-pretty
