#!/usr/bin/env bash
# Builds the web app for https://quranvideomaker.com/janatajweed and copies it to the quranvideomaker.com server.
#   deploy/deploy.sh            builds, tests, and uploads to /var/www/janatajweed
# Apache must already serve that folder: see deploy/apache-janatajweed.conf (one time).
# Only the static app is deployed. Accounts and voice feedback need server/ running, which is not set up there yet.
set -euo pipefail
BASE_PATH="${BASE_PATH:-/janatajweed}"
HOST="${DEPLOY_HOST:-root@vmi3342910.contaboserver.net}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519_20260602-192929}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/janatajweed}"
# IPv4 only: the host also has an IPv6 address that does not route, and ssh can hang on it.
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o AddressFamily=inet)

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain -- src public index.html vite.config.ts package.json package-lock.json)" ]; then
  echo "Commit the app's changes first, so the live site matches a commit." >&2
  exit 1
fi
COMMIT="$(git rev-parse HEAD)"

read -r -p "Deploy ${COMMIT:0:8} to $HOST:$REMOTE_DIR (quranvideomaker.com$BASE_PATH)? Type yes: " answer
[ "$answer" = yes ] || { echo "Stopped."; exit 1; }

echo "==> Testing and building for $BASE_PATH"
npm test
BASE_PATH="$BASE_PATH" npm run build
echo "$COMMIT $(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/deployed-commit.txt

echo "==> Uploading"
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $REMOTE_DIR"
# The page and the service worker go last, so no phone is told about files that are not there yet.
rsync -az -e "ssh ${SSH_OPTS[*]}" --exclude index.html --exclude sw.js dist/ "$HOST:$REMOTE_DIR/"
rsync -az -e "ssh ${SSH_OPTS[*]}" dist/index.html dist/sw.js "$HOST:$REMOTE_DIR/"
# Old hashed files are removed only after the new page is up.
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ "$HOST:$REMOTE_DIR/"
ssh "${SSH_OPTS[@]}" "$HOST" "chmod -R a+rX $REMOTE_DIR; command -v restorecon >/dev/null && restorecon -R $REMOTE_DIR || true"

echo "==> Checking"
curl -fsS "https://quranvideomaker.com$BASE_PATH/deployed-commit.txt" && echo "Live: https://quranvideomaker.com$BASE_PATH/"
