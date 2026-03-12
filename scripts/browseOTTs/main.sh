#!/bin/bash

set -eo pipefail

SITES_ARG="${1:-all}"
REPORT_ERRORS_ARG=$2
if [ -z "${REPORT_ERRORS_ARG}" ]; then
  UPLOAD_SRCMAPS_ARG=
else
  UPLOAD_SRCMAPS_ARG="--sentry-upload-srcmaps"
fi
NOW=$(date --iso-8601=seconds | cut -d+ -f1 | sed s/[^0-9]//g)

APP_ENV=testing pnpm run build $UPLOAD_SRCMAPS_ARG
node scripts/browseOTTs/index.ts --site=$SITES_ARG $REPORT_ERRORS_ARG > tmp/browseOTTs-$NOW.log 2>&1
