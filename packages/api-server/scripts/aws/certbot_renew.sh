#!/usr/bin/env bash

set -eu

snap install --classic certbot

if certbot certificates 2>/dev/null | grep -q "Name: api.getsift.today"; then
  /snap/bin/certbot renew -n
else
  /snap/bin/certbot certonly -n --nginx -d api.getsift.today
fi

snap remove certbot # saves 0.5GB disk space
