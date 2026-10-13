#!/bin/bash
# Double-click to AUTO-pull Mosey updates every 30 seconds.
# Leave this window open in the background; press Ctrl+C (or close it) to stop.
cd "$(dirname "$0")" || exit 1
echo "Auto-updating Mosey every 30s. Leave this open. Ctrl+C to stop."
echo ""
while true; do
  BEFORE=$(shasum package-lock.json 2>/dev/null)
  if git pull --ff-only --quiet origin claude/new-session-8equcu 2>/dev/null; then
    AFTER=$(shasum package-lock.json 2>/dev/null)
    if [ "$BEFORE" != "$AFTER" ]; then
      echo "$(date '+%H:%M:%S')  dependencies changed — installing…"
      npm install --no-audit --no-fund >/dev/null 2>&1 && echo "$(date '+%H:%M:%S')  dependencies installed"
    fi
  fi
  echo "$(date '+%H:%M:%S')  checked for updates"
  sleep 30
done
