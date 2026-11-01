#!/bin/bash
set -euo pipefail

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.1.0"
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.+)?$ ]]; then
  echo "Error: version must be semver (e.g. 0.1.0 or 0.1.0-beta.1)"
  exit 1
fi

if [ "$(git branch --show-current)" != "main" ]; then
  echo "Error: releases are made from main."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working directory not clean. Commit or stash changes first."
  exit 1
fi

TAG="v${VERSION}"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Error: tag $TAG already exists."
  exit 1
fi

# The quick gates only: the full E2E suite runs in CI on every push to main, on a machine of its own.
echo "Checking before release"
pnpm fmt:check
pnpm lint
pnpm typecheck
pnpm test

echo "Releasing nutrition-kitchen $TAG"

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

git add package.json
git commit -m "release: v${VERSION}"
git tag "$TAG"

# Read only the token: .env also holds server secrets and is no shell script.
if [ -z "${GH_TOKEN:-}" ] && [ -f .env ]; then
  GH_TOKEN="$(grep -E '^GH_TOKEN=' .env | cut -d= -f2- || true)"
fi

if [ -n "${GH_TOKEN:-}" ]; then
  REMOTE="https://Flo0806:${GH_TOKEN}@github.com/Flo0806/nutrition-kitchen.git"
  git push "$REMOTE" main
  git push "$REMOTE" "$TAG"
else
  git push origin main
  git push origin "$TAG"
fi

echo ""
echo "Done. The release workflow builds and pushes the Docker image."
