#!/usr/bin/env bash

set -eu

cd ~/sift

HEAD_OLD=`cat .git/refs/heads/master`

git pull
# --ignore-scripts flag prevents the prepare script in the project's
#   root package.json from running, which would fail because husky
#   is not being installed here
pnpm --filter "./shared/**" install --ignore-scripts --prod
pnpm --filter "./packages/api-server" install --ignore-scripts --prod

cd ~/sift/packages/api-server

X=$(git diff --name-only $HEAD_OLD HEAD | grep packages/api-server/ecosystem.config.cjs | wc -l)
if [ $X -gt 0 ]; then
    # pm2 config was changed
    pm2 delete all
    pm2 start ecosystem.config.cjs
    pm2 save
else
    pm2 reload ecosystem.config.cjs
fi
