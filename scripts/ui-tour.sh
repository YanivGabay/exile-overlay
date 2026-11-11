#!/usr/bin/env bash
# Offscreen UI tour on Windows: screenshots of every screen at 1080p/1440p into eo-test/tour.
# Phase 1: first run (fresh profile). Phase 2: a character with a PoB build (pass a PoB code file).
# No window is shown and focus is never taken.
T=/mnt/c/Users/YanivG/dev/eo-test
POB=${1:-$T/builds/awora-leveling.pob.txt}
L=$T/Client-tour.txt
cmd() { echo "$1" >> "$T/tour/tour.txt"; }
n=0
line() { n=$((n+1)); printf '2026/11/09 21:%02d:%02d 1 a %s\r\n' $((n/60+1)) $((n%60)) "$1" >> "$L"; sleep 1.5; }
enter() { line "[DEBUG Client 1] Generating level 2 area \"$1\" with seed 1"; }
lvl() { line "[INFO Client 1] : Tour_Witch (Witch) is now level $1"; }
running() { powershell.exe -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-tour.cmd*' }).Count" 2>/dev/null | tr -d '\r'; }
start() {
  for try in 1 2 3; do
    powershell.exe -NoProfile -Command "Start-Process cmd -WindowStyle Hidden -ArgumentList '/c','C:\Users\YanivG\dev\eo-test\run-tour.cmd'" 2>/dev/null
    sleep 10
    [ "$(running)" -ge 1 ] 2>/dev/null && return 0
    echo "launch attempt $try failed, retrying"
  done
  echo "could not launch"; exit 1
}
stop() { sleep 3; powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-tour.cmd*' } | ForEach-Object { taskkill /F /T /PID \$_.ProcessId }" >/dev/null 2>&1 || true; }

rm -rf "$T/tour" "$T/userdata-tour"; mkdir -p "$T/tour" "$T/userdata-tour"
printf '2026/11/09 21:00:00 ***** LOG FILE OPENING *****\r\n' > "$L"

# Phase 1: first run
start
for t in setup guide hotkeys layout diagnostics about; do cmd "settings $t s-$t"; sleep 2.5; done
cmd "shot o01-before-login"; sleep 3
enter 1_1_1; lvl 1; cmd "shot o02-twilight-strand"; sleep 3
enter 1_1_town; lvl 3; cmd "shot o03-town"; sleep 3
enter 1_1_2; cmd "shot o04-coast"; sleep 3
cmd "edit on"; cmd "shot o05-edit-mode"; cmd "edit off"; sleep 4
stop

# Phase 2: with a build
node -e '
const fs=require("fs");const s=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const code=fs.readFileSync(process.argv[2],"utf8").trim();
s.firstRunDone=true; s.runs=[{character:"Old_Run",date:"2026-08-01T00:00:00Z",totalMs:3000000,actSplits:Object.fromEntries(Array.from({length:11},(_,i)=>[i+1,i*5000]))}]; s.characters=s.characters||{}; s.characters.Tour_Witch={...(s.characters.Tour_Witch||{}),name:"Tour_Witch",className:"Witch",level:14,progress:s.characters.Tour_Witch?.progress||{activeEdge:0,completed:[]},pobCode:code,lastSeen:"2026-11-09T00:00:00Z"};
fs.writeFileSync(process.argv[1],JSON.stringify(s));' "$T/userdata-tour/settings.json" "$POB"
start
for a in 1_1_3 1_1_4_1 1_1_4_0 1_1_5 1_1_town; do enter $a; done
lvl 12; cmd "shot o10-build-town"; sleep 3
enter 1_1_6; cmd "shot o11-build-zone"; sleep 3
for a in 1_2_town 1_3_town 1_4_town 1_5_town 2_6_town 2_7_town 2_8_town 2_9_town 2_10_town; do enter $a; done
line "[INFO Client 1] : Tour_Witch has been slain."
line "[INFO Client 1] Sin: May a new dawn arise!"; cmd "shot o12-campaign-done"; sleep 3
cmd "settings guide s-guide-with-build"; sleep 3
cmd "quit"
stop
ls "$T/tour" | grep png | wc -l
