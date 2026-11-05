#!/usr/bin/env bash

set -eu

REALPATH="$(realpath "${BASH_SOURCE[0]}")"
SIFT_DIR="$(dirname $(dirname $REALPATH))"
API_SERVER_DIR="$SIFT_DIR/packages/api-server"
MEILI_DIR="$SIFT_DIR/meilisearch"

# auto-cleanup on ctrl-c
trap '"$SIFT_DIR/scripts/devstop.sh"; exit 0;' INT

cd $API_SERVER_DIR/telemetry && docker compose up -d

cd $MEILI_DIR && \
  NO_COLOR=1 meilisearch --config-file-path=./config.toml --master-key=masterKey > ./meilisearch.log 2>&1 &

cd $SIFT_DIR && pnpm run dev
