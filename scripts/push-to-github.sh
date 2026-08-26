#!/usr/bin/env bash
# Usage: edit REPO_URL then run: bash scripts/push-to-github.sh
REPO_URL="<your-repo-url>"
set -e
if [ "$REPO_URL" = "<your-repo-url>" ]; then
  echo "Please edit the script and set REPO_URL to your GitHub repo URL (HTTPS or SSH)."
  exit 1
fi

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin "$REPO_URL"
git push -u origin main

echo "Pushed to $REPO_URL"
