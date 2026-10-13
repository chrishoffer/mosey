#!/bin/bash
# Double-click this file to pull the latest Mosey updates onto your Mac.
# If dependencies changed, it installs them too. A running Expo app reloads
# automatically a moment later (restart `npx expo start --tunnel` if it errors).
cd "$(dirname "$0")" || exit 1
BEFORE=$(shasum package-lock.json 2>/dev/null)
echo "Updating Mosey…"
git pull --ff-only origin claude/new-session-8equcu
AFTER=$(shasum package-lock.json 2>/dev/null)
if [ "$BEFORE" != "$AFTER" ]; then
  echo ""
  echo "Dependencies changed — installing (1–2 min)…"
  npm install --no-audit --no-fund
fi
echo ""
echo "✅ Up to date. If the app misbehaves after a big update, stop and rerun: npx expo start --tunnel"
echo ""
read -n 1 -s -r -p "Press any key to close this window."
