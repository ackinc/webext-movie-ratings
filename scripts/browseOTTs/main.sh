#!/bin/bash

set -eo pipefail

UPLOAD_SRCMAPS_ARG=
if [[ "$*" == *"--report-errors"* ]]; then
  UPLOAD_SRCMAPS_ARG="--sentry-upload-srcmaps"
fi

NOW=$(date --iso-8601=seconds | cut -d+ -f1 | sed s/[^0-9]//g)

APP_ENV=testing pnpm run build $UPLOAD_SRCMAPS_ARG
node scripts/browseOTTs/index.ts $@ > tmp/browseOTTs-$NOW.log 2>&1
