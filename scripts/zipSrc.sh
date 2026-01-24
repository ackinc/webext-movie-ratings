#!/bin/bash

ls -a . | \
    egrep -v "^(node_modules|dist(\.zip)?|src\.zip|tmp|\.git|\.+)$" | \
    xargs 7z a src.zip