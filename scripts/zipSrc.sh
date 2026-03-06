#!/bin/bash

set -eo pipefail

DEST_FILE_NAME="${1:-src.zip}"
ls -a . | \
    egrep -v "^(node_modules|dist(\.zip)?|src\.zip|tmp|\.git|\.+)$" | \
    xargs 7z a "$DEST_FILE_NAME"