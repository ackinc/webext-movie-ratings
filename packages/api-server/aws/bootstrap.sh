#!/usr/bin/env bash

set -euo pipefail

apt-get update && apt-get upgrade


# meilisearch
MEILISEARCH_MASTER_KEY=8lNc7cEcH5QK7BDLkoKxgFx0kbGB8Ij0yPGLlalAl934KQpJ

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


# oxmgr
curl -fsSL https://vladimir-urik.github.io/OxMgr/apt/keyrings/oxmgr-archive-keyring.gpg \
  | tee /etc/apt/keyrings/oxmgr-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/etc/apt/keyrings/oxmgr-archive-keyring.gpg] https://vladimir-urik.github.io/OxMgr/apt stable main" \
  | tee /etc/apt/sources.list.d/oxmgr.list
apt-get update
apt-get install oxmgr

# installing oxmgr as a service fails when run as root
runuser -u ubuntu bash << EOF
  oxmgr service install
EOF


# node and pnpm
runuser -u ubuntu bash << EOF
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
  source "$HOME/.nvm/nvm.sh"
  nvm install 24
  corepack enable pnpm
EOF

snap install aws-cli --classic


# install and run the application server
runuser -u ubuntu bash << EOF
  cd ~
  git clone https://github.com/ackinc/webext-movie-ratings sift

  cd packages/api-server

  # normally we pull secrets from a secure vault, but in this case, none
  #   of these env vars are sensitive
  cat << EOF1 > .env
APP_ENV=production
DB_PATH=/home/ubuntu/db.sqlite
IMDB_DATA_DIR=/home/ubuntu/imdbData
PORT=3000
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_MASTER_KEY=$MEILISEARCH_MASTER_KEY
EOF1

  # starts the server
  oxmgr apply oxfile.toml
EOF

# TODO: ensure oxmgr is able to redeploy on git push + webhook


# install and configure nginx as reverse-proxy
apt-get install -y nginx

# install https cert for api.getsift.today
apt-get remove certbot
snap install --classic certbot
ln -s /snap/bin/certbot /usr/local/bin/certbot
certbot --nginx # TODO: configure this for api.getsifttoday.app

# TODO: add nginx conf that does
# - SSL termination
# - redirects port 80 -> 443
# - forwards traffic on port 443 to port 3000
