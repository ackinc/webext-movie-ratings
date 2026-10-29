#!/usr/bin/env bash

set -euo pipefail

apt-get update && apt-get upgrade
apt-get install -y curl sqlite3 tree
snap install aws-cli --classic


cd /home/ubuntu
aws ssm get-parameter --name "/sift/env.production" --query "Parameter.Value" --output text > .env
chown ubuntu:ubuntu ./.env


# meilisearch
MEILISEARCH_MASTER_KEY=$(cat .env | grep MEILISEARCH_MASTER_KEY | cut -d'=' -f2)
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


# node@26 and pnpm@12
curl -fsSL https://nodejs.org/dist/v26.13.0/node-v26.13.0-linux-x64.tar.xz -o node-v26.13.0-linux-x64.tar.xz
tar -xf ./node-v26.13.0-linux-x64.tar.xz
rm ./node-v26.13.0-linux-x64.tar.xz
ln -s /home/ubuntu/node-v26.13.0-linux-x64/bin/node /usr/bin/node
ln -s /home/ubuntu/node-v26.13.0-linux-x64/bin/npm /usr/bin/npm
ln -s /home/ubuntu/node-v26.13.0-linux-x64/bin/npx /usr/bin/npx
curl -fsSL https://get.pnpm.io | env PNPM_VERSION=12 sh -
source /home/ubuntu/.bashrc # exports $PNPM_HOME and puts pnpm in the $PATH
# since we usually run the deploy script from a nonlogin noninteractive shell
#   without first ssh-ing into the prod server, .bashrc won't be sourced
#   when it is running, causing it to fail with a 'cannot find pnpm' error
#   unless we take special measures like below
ln -s $PNPM_HOME/bin/pnpm /usr/bin/pnpm # allows 
ln -s $PNPM_HOME/bin/pnpx /usr/bin/pnpx

# pm2
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# ensure pm2 and application logs don't fill up the disk;
# the default options are sane enough
pm2 install pm2-logrotate



# install and run the application server
GIT_REPO_URL="https://github.com/ackinc/webext-movie-ratings"
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
  mv ~/.env ./

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
echo "0 0 1 3,6,9,12 * root certbot renew -n" | tee -a /etc/crontab


# install and configure nginx as reverse-proxy
apt-get install -y nginx
cat << 'EOF' > /etc/nginx/sites-available/api.getsift.today
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

    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
EOF
ln -s /etc/nginx/sites-available/api.getsift.today /etc/nginx/sites-enabled/api.getsift.today
systemctl reload nginx.service
