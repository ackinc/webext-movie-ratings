#!/bin/bash

set -euo

pnpm run build --target=firefox
pnpm run zip:dist
mv dist.zip firefoxDist.zip
pnpm run zip:src
mv src.zip firefoxSrc.zip

pnpm run build --target=edge
pnpm run zip:dist
mv dist.zip edgeDist.zip

pnpm run build --target=chrome
pnpm run zip:dist
mv dist.zip chromeDist.zip
