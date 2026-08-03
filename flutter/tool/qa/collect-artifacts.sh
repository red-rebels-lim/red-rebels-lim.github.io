#!/bin/zsh
# Pulls any device-side QA artifacts into the dated run folder.
#   tool/qa/collect-artifacts.sh [adb-device-id]
set -euo pipefail
cd "$(dirname "$0")/../.."
DEVICE="${1:-}"
ADB=(~/Library/Android/sdk/platform-tools/adb); [[ -n "$DEVICE" ]] && ADB+=(-s "$DEVICE")
ART="../docs/native-apps/test-runs/$(date +%F)"
mkdir -p "$ART/shots"
for f in $("${ADB[@]}" shell ls /sdcard 2>/dev/null | tr -d '\r' | grep -E '^(qa-|v[0-9]).*\.(png|mp4)$' || true); do
  "${ADB[@]}" pull "/sdcard/$f" "$ART/" >/dev/null && echo "pulled $f"
done
echo "artifacts in $ART"
