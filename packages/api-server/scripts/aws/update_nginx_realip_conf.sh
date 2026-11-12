#!/usr/bin/env bash

# Syncs Cloudflare IP ranges into an nginx realip config.
# Updates and reloads nginx only if the ranges changed.

set -euo pipefail

SCRIPT_PATH=$(readlink -f "${BASH_SOURCE[0]}")
CONF=/etc/nginx/conf.d/cloudflare-realip.conf
URLS=(https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6)

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

# Pull latest ranges
for url in "${URLS[@]}"; do
  curl -fsSL --max-time 15 "$url" >> "$tmp"
  echo >> "$tmp"
done

# Keep only valid-looking CIDRs, sorted and deduped
ranges=$(grep -E '^[0-9a-fA-F:.]+/[0-9]+$' "$tmp" | sort -u)

# Sanity check: refuse to write an empty or suspiciously small list
if [ "$(echo "$ranges" | wc -l)" -lt 10 ]; then
  echo "Fetched list looks wrong, aborting." >&2
  exit 1
fi

# Build the new config
new=$(mktemp)
trap 'rm -f "$tmp" "$new"' EXIT
{
  echo "# Managed by '$SCRIPT_PATH'"
  echo "# Do not edit by hand"
  echo ""
  for cidr in $ranges; do
    echo "set_real_ip_from $cidr;"
  done
  echo ""
  echo "real_ip_header CF-Connecting-IP;"
} > "$new"

# Compare with existing conf; update only on mismatch
if [ -f "$CONF" ] && cmp -s "$new" "$CONF"; then
  echo "No changes."
  exit 0
fi

echo "Ranges changed, updating $CONF"
backup=""
if [ -f "$CONF" ]; then
  backup="$CONF.bak"
  cp "$CONF" "$backup"
fi
install -m 644 "$new" "$CONF"

# Validate before reloading; roll back on failure
if nginx -t; then
  systemctl reload nginx
  echo "nginx reloaded."
else
  echo "nginx config test failed, rolling back." >&2
  if [ -n "$backup" ]; then
    mv "$backup" "$CONF"
  else
    rm -f "$CONF"
  fi
  exit 1
fi