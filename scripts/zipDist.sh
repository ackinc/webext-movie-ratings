#!/bin/bash

set -eo pipefail

DEST_FILE_NAME="${1:-dist.zip}"
7z a "$DEST_FILE_NAME" ./dist/*