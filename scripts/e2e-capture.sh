#!/usr/bin/env bash
# Windows end-to-end run with offscreen captures (no desktop interaction).
# Appends log lines to the fake Client.txt and lets the app save a PNG per state.
set -e
T=/mnt/c/Users/YanivG/dev/eo-test
n=10
line() { n=$((n+1)); printf '2026/11/02 21:01:%02d 1 a %s\r\n' "$n" "$1" >> "$T/Client.txt"; sleep 1.5; }
enter() { line "[DEBUG Client 1] Generating level 2 area \"$1\" with seed 1"; }
powershell.exe -NoProfile -Command "Start-Process cmd -WindowStyle Hidden -ArgumentList '/c','C:\Users\YanivG\dev\eo-test\run-capture.cmd'"
sleep 9
line "[INFO Client 1] : Tester_One (Witch) is now level 2"
enter 1_1_town; enter 1_1_2          # Coast
enter 1_1_town                       # town trip: detour
enter 1_1_2; enter 1_1_3             # back, then Mud Flats
enter 1_1_4_1                        # Submerged Passage
enter 1_1_2                          # waypoint to Coast (route: then Tidal Island)
line "[INFO Client 1] Async connecting to lon.login.pathofexile.com:20487"   # character select
enter 2_6_town                       # a different character (Act 6)
line "[INFO Client 1] Async connecting to lon.login.pathofexile.com:20487"
enter 1_1_2                          # back to Tester_One
sleep 2
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-capture.cmd*' } | ForEach-Object { taskkill /F /T /PID \$_.ProcessId }" >/dev/null 2>&1 || true
ls "$T/cap"
