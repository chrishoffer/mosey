#!/bin/bash
# Double-click this file to pull the latest Mosey updates onto your Mac.
# If the app is running in Expo Go, it reloads automatically a moment later.
cd "$(dirname "$0")" || exit 1
echo "Updating Mosey…"
git pull --ff-only origin claude/new-session-8equcu
echo ""
echo "✅ Up to date. If your app is running, it will reload on its own."
echo "(If I told you this update needs a database or deploy step, do that separately.)"
echo ""
read -n 1 -s -r -p "Press any key to close this window."
