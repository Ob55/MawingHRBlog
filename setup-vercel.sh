#!/usr/bin/env bash
# Sets the four GitHub env vars on the Vercel project and triggers a redeploy.
# Uses `npx vercel` so no global install is needed.
# Run once after creating your GitHub fine-grained PAT.
set -euo pipefail

cd "$(dirname "$0")"

VERCEL="npx --yes vercel@latest"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found — install Node.js first (https://nodejs.org)."
  exit 1
fi

if [ ! -f .vercel/project.json ]; then
  echo "Linking to your Vercel project (one-time — you may be asked to log in)…"
  $VERCEL link
fi

echo ""
echo "Paste your GitHub fine-grained personal access token (input hidden):"
echo "  Required permission: Contents → Read and write on Ob55/MawingHRBlog"
echo "  Create one at: https://github.com/settings/personal-access-tokens/new"
echo ""
read -r -s GITHUB_TOKEN_VALUE
echo ""

if [ -z "$GITHUB_TOKEN_VALUE" ]; then
  echo "No token provided. Aborting."
  exit 1
fi

add_env() {
  local NAME="$1"
  local VALUE="$2"
  for ENV in production preview development; do
    $VERCEL env rm "$NAME" "$ENV" --yes >/dev/null 2>&1 || true
    printf '%s' "$VALUE" | $VERCEL env add "$NAME" "$ENV" >/dev/null
  done
  echo "  set $NAME"
}

echo ""
echo "Setting env vars on Vercel…"
add_env GITHUB_TOKEN  "$GITHUB_TOKEN_VALUE"
add_env GITHUB_OWNER  "Ob55"
add_env GITHUB_REPO   "MawingHRBlog"
add_env GITHUB_BRANCH "main"

echo ""
echo "Redeploying to production…"
$VERCEL --prod

echo ""
echo "Done. Try uploading again on your admin URL."
