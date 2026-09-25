#!/usr/bin/env bash

set -eu

cd ~/sift

HEAD_OLD=`cat .git/refs/heads/master`

git pull
# The --ignore-scripts flag in the commands below prevents the prepare script
#   in the project's root package.json from running; we want this because that
#   script would fail anyway, because it invokes husky which is not even
#   installed in this environment
pnpm --filter "./shared/**" install --ignore-scripts --prod
pnpm --filter "./packages/api-server" install --ignore-scripts --prod

cd ~/sift/packages/api-server
aws ssm get-parameter --name "/sift/env.production" --query "Parameter.Value" --output text > .env

pnpm run migrations

PM2_CONFIG_CHANGED=$(git diff --name-only $HEAD_OLD HEAD | grep packages/api-server/ecosystem.config.cjs | wc -l)
if [ $PM2_CONFIG_CHANGED -gt 0 ]; then
    # pm2 config was changed
    pm2 delete all
    pm2 start ecosystem.config.cjs
    pm2 save
else
    pm2 reload ecosystem.config.cjs
fi
