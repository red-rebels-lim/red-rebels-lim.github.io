#!/bin/zsh
# Injects a QA dataset (§4.5) as the debug app's events cache, so the REAL
# app (and the home-screen widget) run against synthetic data.
#   tool/qa/inject-dataset.sh <dataset-name> [adb-device-id]
#   tool/qa/inject-dataset.sh --restore     [adb-device-id]
# Debug builds only (uses run-as).
set -euo pipefail
cd "$(dirname "$0")/../.."

NAME="${1:?dataset name or --restore}"
DEVICE="${2:-}"
ADB=(~/Library/Android/sdk/platform-tools/adb); [[ -n "$DEVICE" ]] && ADB+=(-s "$DEVICE")
PKG=com.solosalamina.app
# EventsRepository caches under the app documents dir (path_provider).
CACHE=app_flutter/events-cache.json

"${ADB[@]}" shell am force-stop $PKG
if [[ "$NAME" == "--restore" ]]; then
  "${ADB[@]}" shell run-as $PKG rm -f "$CACHE"
  echo "cache removed — app falls back to the bundled feed and live refresh"
else
  node tool/qa/gen_dataset.mjs "$NAME" > /tmp/qa-dataset.json
  "${ADB[@]}" push /tmp/qa-dataset.json /data/local/tmp/qa-dataset.json >/dev/null
  "${ADB[@]}" shell "run-as $PKG sh -c 'mkdir -p app_flutter && cp /data/local/tmp/qa-dataset.json $CACHE'"
  echo "dataset '$NAME' injected"
fi
# Airplane mode keeps the live-feed refresh from clobbering the injection.
echo "tip: enable airplane mode before launching, or the sync overwrites the cache"
"${ADB[@]}" shell am start -n $PKG/.MainActivity >/dev/null
