#!/usr/bin/env bash

set -euo pipefail

apt-get update && apt-get upgrade
apt-get install -y curl sqlite3 tree


# vars
MEILISEARCH_MASTER_KEY=8lNc7cEcH5QK7BDLkoKxgFx0kbGB8Ij0yPGLlalAl934KQpJ
GIT_REPO_URL="https://github.com/ackinc/webext-movie-ratings"
WEBSITE_URL="https://getsift.today"

runuser -u ubuntu bash << EOF
  cd ~
  mkdir meilisearch && cd meilisearch
  curl -L https://install.meilisearch.com | sh
EOF

cat << EOF > /etc/systemd/system/meilisearch.service
[Unit]
Description=Meilisearch
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/meilisearch
ExecStart=/home/ubuntu/meilisearch/meilisearch --master-key=$MEILISEARCH_MASTER_KEY
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start meilisearch.service
systemctl enable meilisearch.service


# nodev24 and pnpm
curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh
bash nodesource_setup.sh
rm nodesource_setup.sh
apt-get install nodejs
npm install --global corepack@latest
corepack enable pnpm

# pm2
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# ensure pm2 and application logs don't fill up the disk;
# the default options are sane enough
pm2 install pm2-logrotate


snap install aws-cli --classic


# install and run the application server
runuser -u ubuntu bash << EOF
  cd ~
  git clone $GIT_REPO_URL sift

  cd ~/sift
  # --ignore-scripts flag prevents the prepare script in the project's
  #   root package.json from running, which would fail because husky
  #   is not being installed here
  pnpm --filter "./shared/**" install --ignore-scripts --prod
  pnpm --filter "./packages/api-server" install --ignore-scripts --prod

  # pnpm's defaults prevent better-sqlite3's postinstall script from running
  cd node_modules/better-sqlite3 && pnpm run install

  cd ~/sift/packages/api-server

  # normally we pull secrets from a secure vault, but in this case, none
  #   of these env vars are sensitive
  cat << EOF1 > .env
APP_ENV=production
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=sift-db-backups-458735596401-ap-south-1-an
DB_PATH=/home/ubuntu/db.sqlite
IMDB_DATA_DIR=/home/ubuntu/imdbData
PORT=3000
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_MASTER_KEY=$MEILISEARCH_MASTER_KEY
WEBSITE_URL=$WEBSITE_URL
EOF1

  # starts the server and ensures pm2 will resurrect it on system reboot
  pm2 start ecosystem.config.js
  pm2 save
EOF

# TODO: deploy on git push


# install https cert for api.getsift.today (we do this first so we only
#   have to write an nginx config file once)
# WARN: DNS record pointing domain to instance should already be in place
apt-get remove certbot
snap install --classic certbot
ln -s /snap/bin/certbot /usr/local/bin/certbot
certbot certonly -n --nginx -d api.getsift.today
echo "0 0 1 * * root certbot renew -n" | tee -a /etc/crontab


# install and configure nginx as reverse-proxy
apt-get install -y nginx
cat << EOF > /etc/nginx/sites-available/api.getsift.today
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl;

  server_name api.getsift.today;

  ssl_certificate     /etc/letsencrypt/live/api.getsift.today/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.getsift.today/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  if ($scheme = http) {
    return 301 https://$server_name$request_uri;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
  }
}
EOF
ln -s /etc/nginx/sites-available/api.getsift.today /etc/nginx/sites-enabled/api.getsift.today
systemctl reload nginx.service
