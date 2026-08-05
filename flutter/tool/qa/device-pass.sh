#!/bin/zsh
# Android device-level QA pass — the flows integration tests can't reach:
# cold-start timing, offline snapshot, screen-size sweep, font scale, widget.
# Usage: device-pass.sh <adb-device-id> <artifacts-dir>
set -uo pipefail

DEVICE="${1:?adb device id}"
ART="${2:?artifacts dir}"
ADB=(~/Library/Android/sdk/platform-tools/adb -s "$DEVICE")
PKG=com.solosalamina.app
mkdir -p "$ART/shots"
rc=0

shot() { "${ADB[@]}" exec-out screencap -p > "$ART/shots/$1.png"; }
launch() { "${ADB[@]}" shell am start -W -n $PKG/.MainActivity | awk -F': ' '/TotalTime/{print $2}'; }

echo "-- P-01 cold start"
"${ADB[@]}" shell am force-stop $PKG; sleep 1
COLD=$(launch); sleep 4; shot "P01-cold-start"
echo "cold start TotalTime: ${COLD}ms (debug build; compare release/profile before judging)"

echo "-- J-01/J-02 offline cold start (airplane mode)"
"${ADB[@]}" shell cmd connectivity airplane-mode enable; sleep 2
"${ADB[@]}" shell am force-stop $PKG; sleep 1
OFFLINE=$(launch); sleep 4; shot "J01-offline-launch"
"${ADB[@]}" shell cmd connectivity airplane-mode disable; sleep 2
echo "offline cold start: ${OFFLINE}ms — check J01 shot for snapshot + stale indicator"
[[ -n "$OFFLINE" ]] || rc=1

echo "-- L-02/L-03 widget snapshot (must be placed on home once, manually)"
"${ADB[@]}" shell input keyevent KEYCODE_HOME; sleep 2
shot "L02-widget-home"

echo "-- M-* screen-size sweep"
for profile in "720x1600:280:M01-small" "1440x3120:560:M02-large"; do
  size="${profile%%:*}"; rest="${profile#*:}"; dpi="${rest%%:*}"; tag="${rest#*:}"
  "${ADB[@]}" shell wm size "$size"; "${ADB[@]}" shell wm density "$dpi"; sleep 2
  "${ADB[@]}" shell am start -n $PKG/.MainActivity; sleep 5
  shot "$tag-calendar"
  "${ADB[@]}" shell am force-stop $PKG
done
"${ADB[@]}" shell wm size reset; "${ADB[@]}" shell wm density reset; sleep 2

echo "-- M-03 font scale 1.3"
"${ADB[@]}" shell settings put system font_scale 1.3; sleep 2
"${ADB[@]}" shell am start -n $PKG/.MainActivity; sleep 5
shot "M03-fontscale-calendar"
"${ADB[@]}" shell settings put system font_scale 1.0
"${ADB[@]}" shell am force-stop $PKG

echo "-- logcat sweep (P-05)"
"${ADB[@]}" logcat -d | grep -iE "E/flutter|FATAL" | tail -30 > "$ART/logcat-errors.txt" || true
echo "device pass done (rc=$rc); review shots in $ART/shots"
exit $rc
