#!/bin/zsh
# Demo Forge — double-click this in Finder to run it locally.
# Your Anthropic key stays in .env on this machine and never touches the browser.
# Close this window (or press Ctrl-C) to stop it.

cd "$(dirname "$0")" || exit 1
clear
echo "▢  Demo Forge — starting locally…\n"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org, then double-click again."
  echo "\nPress Return to close."; read -r; exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run — installing dependencies (one time, ~a minute)…\n"
  npm install || { echo "\nnpm install failed. Press Return to close."; read -r; exit 1; }
fi

# One-time key setup (no-op once the key is in .env).
node scripts/setup.mjs || { echo "\nPress Return to close."; read -r; exit 1; }

# Open the browser once the dev server is up.
( sleep 4 && open "http://localhost:5174" >/dev/null 2>&1 ) &

echo "Opening http://localhost:5174 …  (close this window to stop Demo Forge)\n"
exec npm run dev
