#!/usr/bin/env bash

set -u

REALPATH="$(realpath "${BASH_SOURCE[0]}")"
SIFT_DIR="$(dirname $(dirname $REALPATH))"
API_SERVER_DIR="$SIFT_DIR/packages/api-server"

cd $API_SERVER_DIR/telemetry && docker compose down

MEILI_PID=$(ps -C meilisearch -o pid=)
if [ -n "$MEILI_PID" ]; then
    kill $MEILI_PID
fi
