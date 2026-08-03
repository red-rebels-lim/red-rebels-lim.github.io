#!/bin/zsh
# Red Rebels QA suite orchestrator (docs/native-apps/TEST-PLAN.md §6c).
#
#   tool/qa/run-suite.sh --android [avd]     # default avd: pixel_7
#   tool/qa/run-suite.sh --ios ["sim name"]  # default: iPhone 17
#   tool/qa/run-suite.sh --all
#   Flags: --skip-gates  --skip-device-pass  --keep-booted
#
# Runs: static gates -> integration suite per device -> Android device-level
# pass (widget/offline/sizes need adb, so Android only) -> artifact collection.
set -uo pipefail

cd "$(dirname "$0")/../.."   # flutter/
QA_DIR="tool/qa"
ADB=~/Library/Android/sdk/platform-tools/adb
EMULATOR=~/Library/Android/sdk/emulator/emulator
RUN_DATE=$(date +%F)
ARTIFACTS="../docs/native-apps/test-runs/$RUN_DATE"
mkdir -p "$ARTIFACTS/shots"

ANDROID=0; IOS=0; AVD="pixel_7"; SIM="iPhone 17"
SKIP_GATES=0; SKIP_DEVICE=0; KEEP=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --android) ANDROID=1; [[ "${2:-}" != --* && -n "${2:-}" ]] && { AVD="$2"; shift; } ;;
    --ios)     IOS=1;     [[ "${2:-}" != --* && -n "${2:-}" ]] && { SIM="$2"; shift; } ;;
    --all)     ANDROID=1; IOS=1 ;;
    --skip-gates) SKIP_GATES=1 ;;
    --skip-device-pass) SKIP_DEVICE=1 ;;
    --keep-booted) KEEP=1 ;;
    *) echo "unknown flag $1"; exit 2 ;;
  esac
  shift
done
[[ $ANDROID -eq 0 && $IOS -eq 0 ]] && ANDROID=1

PASS=(); FAIL=()
note() { echo "\n=== $1 ==="; }
record() { [[ $2 -eq 0 ]] && PASS+=("$1") || FAIL+=("$1"); }

if [[ $SKIP_GATES -eq 0 ]]; then
  note "G-01 flutter analyze"; flutter analyze; record "G-01 analyze" $?
  note "G-02 flutter test";    flutter test;    record "G-02 unit tests" $?
fi

INTEGRATION_TESTS=(integration_test/tour_test.dart integration_test/calendar_test.dart \
  integration_test/event_sheet_test.dart integration_test/stats_squad_test.dart \
  integration_test/settings_i18n_test.dart)

run_integration() { # $1=device-id  $2=label
  for t in "${INTEGRATION_TESTS[@]}"; do
    note "$2 · $t"
    flutter test "$t" -d "$1" --timeout 4x
    record "$2 $(basename $t)" $?
  done
}

if [[ $ANDROID -eq 1 ]]; then
  note "Booting AVD $AVD"
  if ! $ADB devices | grep -q "emulator-.*device"; then
    nohup "$EMULATOR" -avd "$AVD" -no-snapshot-load -no-boot-anim -no-audio \
      >/tmp/qa-emulator.log 2>&1 & disown
    for i in {1..60}; do
      [[ "$($ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] && break
      sleep 5
    done
  fi
  DEVICE_ID=$($ADB devices | awk '/emulator-.*device/{print $1; exit}')
  [[ -z "$DEVICE_ID" ]] && { echo "AVD failed to boot"; exit 1; }

  run_integration "$DEVICE_ID" "android($AVD)"

  if [[ $SKIP_DEVICE -eq 0 ]]; then
    note "Android device-level pass"
    # The integration runs leave the TEST apk installed (its main() is the
    # test harness and hangs on the splash) — rebuild + reinstall the real app.
    flutter build apk --debug
    $ADB -s "$DEVICE_ID" install -r build/app/outputs/flutter-apk/app-debug.apk
    "$QA_DIR/device-pass.sh" "$DEVICE_ID" "$ARTIFACTS"
    record "device-pass" $?
  fi
  [[ $KEEP -eq 0 ]] && $ADB -s "$DEVICE_ID" emu kill >/dev/null 2>&1 || true
fi

if [[ $IOS -eq 1 ]]; then
  note "Booting simulator $SIM"
  UDID=$(xcrun simctl list devices available | grep -F "$SIM (" | head -1 | grep -oE '[A-F0-9-]{36}')
  [[ -z "$UDID" ]] && { echo "simulator '$SIM' not found"; exit 1; }
  xcrun simctl boot "$UDID" 2>/dev/null || true
  xcrun simctl bootstatus "$UDID" -b

  run_integration "$UDID" "ios($SIM)"

  xcrun simctl io "$UDID" screenshot "$ARTIFACTS/shots/ios-$SIM-final.png" 2>/dev/null || true
  [[ $KEEP -eq 0 ]] && xcrun simctl shutdown "$UDID" 2>/dev/null || true
fi

note "RESULTS"
for p in "${PASS[@]:-}"; do [[ -n "$p" ]] && echo "  PASS  $p"; done
for f in "${FAIL[@]:-}"; do [[ -n "$f" ]] && echo "  FAIL  $f"; done
echo "artifacts: $ARTIFACTS"
[[ ${#FAIL[@]} -eq 0 ]]
