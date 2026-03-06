#!/bin/bash

set -eo pipefail

pnpm run build --target=firefox
pnpm run zip:dist firefoxDist.zip
pnpm run zip:src firefoxSrc.zip

pnpm run build --target=edge
pnpm run zip:dist edgeDist.zip

pnpm run build --target=chrome
pnpm run zip:dist chromeDist.zip
