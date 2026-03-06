#!/bin/bash

set -eo pipefail

ls -a . | \
    egrep -v "^(node_modules|dist(\.zip)?|src\.zip|tmp|\.git|\.+)$" | \
    xargs 7z a src.zip