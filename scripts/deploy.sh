#!/bin/sh
# Publish the editable source on main and the static build on gh-pages.
set -eu
cd "$(dirname "$0")/.."
npm run build
git push origin HEAD:refs/heads/main
parent=$(git ls-remote --heads origin refs/heads/gh-pages | cut -f1)
if [ -n "$parent" ]; then
  git fetch -q origin refs/heads/gh-pages
  parent=$(git rev-parse FETCH_HEAD)
fi
db=$(git rev-parse --absolute-git-dir)
build=$(cd dist && pwd)
temp_index=$(mktemp -d)
trap 'rm -f "$temp_index/index" "$temp_index/index.lock"; rmdir "$temp_index"' EXIT
export GIT_INDEX_FILE="$temp_index/index"
git -C "$build" --git-dir="$db" --work-tree="$build" add --force --all -- .
tree=$(git --git-dir="$db" write-tree)
if [ -n "$parent" ] && [ "$tree" = "$(git rev-parse "$parent^{tree}")" ]; then
  exit 0
fi
set --
if [ -n "$parent" ]; then set -- -p "$parent"; fi
release=$(git commit-tree "$tree" "$@" -m "Publish $(git rev-parse --short HEAD)")
git push origin "$release:refs/heads/gh-pages"
