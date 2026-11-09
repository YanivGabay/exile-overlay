#!/usr/bin/env bash
# Launch-readiness check on Windows, offscreen (no window, no focus):
# a first run where the game never ran (no Client.txt), crash recovery and the
# app log, the "what's new" notice after an update, and the update-ready screen.
# Usage: scripts/launch-check.sh [path\to\Exile Overlay.exe]   (default: dev build via electron.exe)
T=/mnt/c/Users/YanivG/dev/eo-test
W='C:\Users\YanivG\dev\eo-test'
EXE=${1:-}
OUT=$T/launch
cmd() { echo "$1" >> "$OUT/tour.txt"; }
running() { powershell.exe -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-launch.cmd*' }).Count" 2>/dev/null | tr -d '\r'; }
stop() { sleep 3; powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-launch.cmd*' } | ForEach-Object { taskkill /F /T /PID \$_.ProcessId }" >/dev/null 2>&1 || true; }
if [ -n "$EXE" ]; then RUN="\"$EXE\""; else RUN='cd /d C:\Users\YanivG\dev\exile-overlay\apps\overlay && ..\..\node_modules\electron\dist\electron.exe .'; fi
printf '@echo off\r\nset EXILE_OVERLAY_TARGET=EO Capture Only\r\nset EXILE_OVERLAY_USERDATA=%s\\userdata-launch\r\nset EXILE_OVERLAY_NO_AUTODETECT=1\r\nset EXILE_OVERLAY_TOUR=%s\\launch\r\n%s > %s\\launch.log 2>&1\r\n' "$W" "$W" "$RUN" "$W" > "$T/run-launch.cmd"
start() {
  for try in 1 2 3; do
    powershell.exe -NoProfile -Command "Start-Process cmd -WindowStyle Hidden -ArgumentList '/c','$W\\run-launch.cmd'" 2>/dev/null
    sleep 10
    [ "$(running)" -ge 1 ] 2>/dev/null && return 0
    echo "launch attempt $try failed, retrying"
  done
  echo "could not launch"; exit 1
}
rm -rf "$OUT" "$T/userdata-launch"; mkdir -p "$OUT"

# 1. Fresh install, game never started: setup must say "waiting", not error.
start
cmd "settings setup s1-setup-no-game"; sleep 3
cmd "attach 5"; cmd "shot o1-game-starting"; cmd "settings setup s2-setup-game-starting"; sleep 4
cmd "attach 60"; cmd "shot o2-no-log-found"; cmd "settings setup s3-setup-no-log"; sleep 4
cmd "settings diagnostics s4-diagnostics"; sleep 3
# 2. Crashes: main-process error is logged (no dialog in test runs), the overlay page reloads.
cmd "crash main"; cmd "crash overlay"; cmd "shot o3-after-overlay-crash"; sleep 8
# 3. After an update: notice in the overlay, What's new tab, update ready.
cmd 'set {"firstRunDone":true,"lastSeenVersion":"0.0.9"}'; cmd "shot o4-whats-new-notice"; sleep 3
cmd 'update {"kind":"ready","version":"0.1.1"}'; cmd "settings whatsnew s5-whats-new"; sleep 3
cmd "settings about s6-about-update-ready"; sleep 3
cmd "quit"; sleep 4
stop
echo "--- shots"; ls "$OUT" | grep png
echo "--- app log"; cat "$T/userdata-launch/logs/exile-overlay.log" | cut -c1-200 | grep -v "^\s*at " | head -40
