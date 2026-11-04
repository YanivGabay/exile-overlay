#!/usr/bin/env bash
# Offscreen E2E for reminders, gem plan, timer, deaths, Kitava. No desktop interaction.
set -e
T=/mnt/c/Users/YanivG/dev/eo-test
rm -rf "$T/userdata" "$T/cap"; mkdir -p "$T/userdata" "$T/cap"
node -e '
const z=require("zlib");
const xml=`<PathOfBuilding><Build className="Witch" ascendClassName="Elementalist" bandit="None"/><Skills>
<SkillSet title="Act 1-3"><Skill enabled="true" label="Main"><Gem gemId="Metadata/Items/Gems/SkillGemFreezingPulse"/><Gem gemId="Metadata/Items/Gems/SupportGemArcaneSurge"/><Gem gemId="Metadata/Items/Gems/SupportGemLesserMultipleProjectiles"/></Skill></SkillSet>
<SkillSet title="Act 4+"><Skill enabled="true" label="Main"><Gem gemId="Metadata/Items/Gems/SkillGemArmageddonBrand"/><Gem gemId="Metadata/Items/Gems/SupportGemControlledDestruction"/></Skill></SkillSet>
</Skills><Tree><Spec title="Level 1-20" treeVersion="3_29" nodes="94,127"><URL>x</URL></Spec><Spec title="Level 20-40" treeVersion="3_29" nodes="94,127,223,31961,55485,1734,193"><URL>y</URL></Spec></Tree></PathOfBuilding>`;
const code=z.deflateSync(Buffer.from(xml)).toString("base64").replace(/\+/g,"-").replace(/\//g,"_");
require("fs").writeFileSync(process.argv[1],JSON.stringify({firstRunDone:true,characters:{_default:{name:"_default",className:null,level:null,progress:{activeEdge:0,completed:[]},pobCode:code,lastSeen:"2026-11-02T00:00:00Z"}},activeCharacter:null}));
' "$T/userdata/settings.json"
printf '2026/11/02 21:00:00 ***** LOG FILE OPENING *****\r\n' > "$T/Client.txt"
n=0
line() { n=$((n+1)); printf '2026/11/02 21:%02d:%02d 1 a %s\r\n' $((n/60+1)) $((n%60)) "$1" >> "$T/Client.txt"; sleep 1.2; }
enter() { line "[DEBUG Client 1] Generating level 2 area \"$1\" with seed 1"; }
lvl() { line "[INFO Client 1] : Tester_Witch (Witch) is now level $1"; }
powershell.exe -NoProfile -Command "Start-Process cmd -WindowStyle Hidden -ArgumentList '/c','C:\Users\YanivG\dev\eo-test\run-capture.cmd'"
sleep 9
enter 1_1_1; lvl 2
for a in 1_1_town 1_1_2 1_1_3 1_1_4_1 1_1_2 1_1_2a 1_1_town 1_1_4_1; do enter $a; done
lvl 8
line "[INFO Client 1] : Tester_Witch has been slain."
enter 1_1_4_0
lvl 12
sleep 2
line "[INFO Client 1] : You have been permanently weakened by Kitava's cruel affliction. You now have -30% to all Resistances."
sleep 2
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='cmd.exe'\" | Where-Object { \$_.CommandLine -like '*run-capture.cmd*' } | ForEach-Object { taskkill /F /T /PID \$_.ProcessId }" >/dev/null 2>&1 || true
ls "$T/cap" | tail -6
