# Pro leveling tips: research notes (PoE1, for Exile Overlay)

Collected 2026-11-02. Every tip is our paraphrase; no route text was copied. Cyclon content was deliberately excluded (a 2025 forum thread by Cyclon_Definitiv turned up in search and was not used).

## Source keys (patch and date of each source)

| Key | What | Creator | Patch / date | URL |
|---|---|---|---|---|
| EL | exile-leveling route files (MIT). README says the base route follows "current speed running strategies". Has `LEAGUE_START`, `LIBRARY` and `BANDIT_*` toggles | HeartofPhos (tool author; speedrun-style route) | 3.29, route commits 2026-07-22/24 ("Allflame route update", "add some campaign secrets") | https://github.com/HeartofPhos/exile-leveling/tree/main/common/data/routes |
| HV | Maxroll class leveling guides (Ranger, Duelist, Scion, Witch) | havoc616 (racer); reviewed by Crouching_Tuna | 3.29, updated 2026-08-05 | https://maxroll.gg/poe/build-guides/ranger-leveling-build-guide (also `duelist-`, `scion-`, `witch-leveling-build-guide`) |
| MXC | Maxroll campaign walkthrough (all acts) | Crouching_Tuna | updated 2025-06-06 (3.26 era) | https://maxroll.gg/poe/getting-started/campaign-guide |
| MXB | Maxroll build-guide leveling sections (lab timing). Read through search excerpts only | various Maxroll writers | 3.21-3.29 mixed | https://maxroll.gg/poe/build-guides/cold-dot-elementalist/cold-dot-leveling ; https://maxroll.gg/poe/getting-started/labyrinth-guide |
| PV | PoE Vault "Quick Reference Leveling Guide", Acts 1-4 and index | Atroz (editor) | 2025-10-30 (3.27 launch; site nav shows 3.29) | https://www.poe-vault.com/guides/quick-reference-leveling-guide-act-1 (and `-act-2`, `-act-3`, `-act-4`, index `quick-reference-leveling-guide-for-path-of-exile`) |
| PVB | PoE Vault beginner leveling guide | Rootz (editor) | header 2026-03, last changelog 3.22 (old) | https://www.poe-vault.com/guides/beginner-leveling-guide-for-path-of-exile |
| TYT | Forum write-up of **Tytykiller's** HCSSF Act 1-10 speedrun. Third-party summary (The_Lavender_Xion) | Tytykiller (via summary) | 3.8, 2019-11 (OLD: use only for timeless habits) | https://www.pathofexile.com/forum/view-thread/2679955 |
| F26 | Official-forum thread "Share tips and tricks to complete campaign quickly" | community (not a named pro) | 3.29, 2026-07-13/14 | https://www.pathofexile.com/forum/view-thread/3984444 |

Directions: EL encodes compass angles (0 = N, 45 = NE, 90 = E, 180 = S, 225 = SW, 270 = W, 315 = NW). We checked this against PV's left/right wording (Old Fields "right exit" = EL 45). Line anchors (`#Lnn`) point at the 3.29 files.

## Tips table

Style: **race** = speedrun or racer habit; **safe** = league start or SSF safety; **new** = first-time player; **all** = everyone.
Confidence: **high** = 2+ independent sources agree; **med** = one good recent source; **low** = old, community or indirect source.

| Act | Zone (area id) | Tip (our words) | Style | Creator | Source URL (+anchor) | Patch | Conf. |
|---|---|---|---|---|---|---|---|
| 1 | 1_1_1 Twilight Strand | Bind left click to move-only, skip most mobs and keep your flask charges for Hillock. The big chest mid-beach holds your first support gem. | new/all | Crouching_Tuna | MXC | 3.26 | med |
| 1 | 1_1_2 The Coast | League start: take the Coast waypoint, then go to Tidal Island before Mud Flats. Alt or race runs without the toggle skip both. | safe | HeartofPhos; Atroz; Crouching_Tuna | EL act-1.txt#L5-L23 ; PV act-1 ; MXC | 3.29 | high |
| 1 | 1_1_2a Tidal Island | Hailrake is usually to the west. If you hit a ledge, turn around and go east. Kill him, take the Medicine Chest, then log out instead of walking back. | race/safe | HeartofPhos; Atroz | EL act-1.txt#L16-L20 ; PV act-1 | 3.29 | high |
| 1 | 1_1_2a Tidal Island | Recommended level for Hailrake is about 4. | all | HeartofPhos | EL act-1.txt#L20 | 3.29 | med |
| 1 | Lioneye's Watch (Nessa) | Choose the Quicksilver Flask from Nessa (Mercy Mission). It is the key early movement item. | all | Atroz; Crouching_Tuna; havoc616 | PV act-1 ; MXC ; HV | 3.29 | high |
| 1 | Lioneye's Watch | Nessa's Quicksilver is low item level. Some racers reroll it for Freeze Immunity so it can cover Act 8 cold zones. | race | havoc616 | HV (duelist, scion) | 3.29 | med |
| 1 | 1_1_3 Mud Flats | The three Rhoa nests sit along small streams. They usually form a triangle and rarely a straight line, so follow the water between them. | all | HeartofPhos | EL act-1.txt#L10-L12 | 3.29 | med |
| 1 | 1_1_3a Fetid Pool | Optional. Clearing it gives only 2 respec points, so it is a skip for speed runs. | new | Crouching_Tuna | MXC | 3.26 | med |
| 1 | 1_1_4_1 Submerged Passage | Drop a portal at the bridge where the Flooded Depths entrance is. You come back to that spot later. | race/safe | havoc616; Atroz; HeartofPhos | HV ; PV act-1 ; EL act-1.txt#L29-L30 | 3.29 | high |
| 1 | 1_1_4_0 Flooded Depths | The entrance is on the right of the bridge. The Dweller is usually opposite the entrance, in a big open room. He gives a passive point, so never skip him. | all | HeartofPhos; Crouching_Tuna; Atroz | EL act-1.txt#L29-L33 ; MXC ; PV | 3.29 | high |
| 1 | 1_1_6 The Climb | Ironpoint and The Faun are optional. Run past them. | race/safe | Crouching_Tuna | MXC | 3.26 | med |
| 1 | 1_1_7_1 Lower Prison | Do the Labyrinth trial here on your first character of the league (it is usually NE). Later characters skip it, because trials count once per league. | safe/new | HeartofPhos; Crouching_Tuna; Atroz | EL act-1.txt#L41-L45 ; MXC ; PV act-1 | 3.29 | high |
| 1 | 1_1_7_2 Upper Prison | Look for the Chemist's Strongbox marked on the map; a nearby switch opens it. It often drops Quicksilver Flasks, which feed the movement-speed boots recipe. | safe | HeartofPhos; havoc616 | EL act-1.txt#L47-L53 ; HV | 3.29 | high |
| 1 | Warden's Quarters (Brutus) | Aim for about level 8 at Brutus, then log out to town. | all | HeartofPhos; Tytykiller | EL act-1.txt#L54-L57 ; TYT | 3.29 / 3.8 | high |
| 1 | 1_1_8 → 1_1_9 Ship Graveyard | From Prisoner's Gate, Ship Graveyard is down the ledge or gorge next to the road. Its waypoint is usually close to the entrance. | all | HeartofPhos; Crouching_Tuna; Atroz | EL act-1.txt#L59-L60 ; MXC ; PV act-1 | 3.29 | high |
| 1 | 1_1_9 Ship Graveyard | Get the Allflame from the cave first and drop a portal at the cave if you spot it, then kill Fairgraves. | all | Crouching_Tuna; Atroz | MXC ; PV act-1 | 3.29 | high |
| 1 | 1_1_11_1 Cavern of Wrath | Skip the Amarissa chest. | race | Crouching_Tuna | MXC | 3.26 | med |
| 1 | 1_1_11_2 Cavern of Anger / Merveil | Follow the water to reach the exit and Merveil's arena. Aim for about level 12 and bring some cold resistance. | all | HeartofPhos; Crouching_Tuna | EL act-1.txt#L68-L72 ; MXC | 3.29 | high |
| 1 | Act 1 vendors | Around level 8, check vendors for already-linked items and weapon bases. Pick up Iron Rings and a Rustic Sash for recipes. | all | havoc616 | HV (duelist, scion) | 3.29 | med |
| 2 | 1_2_2 Old Fields | The exit to Crossroads is to the NE ("right exit"). League start: drop a portal at the Den entrance on the way. | all / safe | HeartofPhos; Atroz; havoc616 | EL act-2.txt#L4-L8 ; PV act-2 ; HV | 3.29 | high |
| 2 | 1_2_2a The Den | Optional. Killing the Great White Beast gives a guaranteed second Quicksilver. League starters use the portal and log out after; alts skip it. | safe | HeartofPhos; havoc616; Crouching_Tuna; Atroz | EL act-2.txt#L9-L15 ; HV ; MXC ; PV | 3.29 | high |
| 2 | 1_2_3 Crossroads | Follow the road to the waypoint. Chamber of Sins is to the NW (the left path). Fellshrine Ruins is to the SE and is needed only for the Crypt trial and Golden Hand. | all | HeartofPhos; Atroz; Crouching_Tuna | EL act-2.txt#L17-L22, L36 ; PV act-2 ; MXC | 3.29 | high |
| 2 | 1_2_6_2 Chamber of Sins 2 | Head the same way as the waypoint. Fidelitas is at the end of a long corridor. Aim for level 14-15. Do the trial here on a league start. | all | HeartofPhos; Atroz; Tytykiller | EL act-2.txt#L23-L33 ; PV act-2 ; TYT | 3.29 | high |
| 2 | 1_2_5 The Crypt | Archbishop Geofri is not needed. The Golden Hand altar is just behind him. Grab it and log out. | race | Atroz; HeartofPhos | PV act-2 ; EL act-2.txt#L37-L43 | 3.29 | high |
| 2 | 1_2_4 Broken Bridge | Near the waypoint, three rogue Exiles drop a full set of gear. It is a reliable way to get bases early. | safe | havoc616 | HV (ranger, duelist, scion) | 3.29 | med |
| 2 | 1_2_7 Riverways | The waypoint and the exit both follow the road (SW from Crossroads). A Breach is often on the path here and is worth the XP and loot. | all / safe | HeartofPhos; havoc616 | EL act-2.txt#L44-L48 ; HV | 3.29 | high |
| 2 | 1_2_9 → 1_2_10 Western Forest / Weaver | The Weaver's Chambers entrance is on the side of the road opposite the waypoint, along the wall of webbed trees. Aim for level 16 at the Weaver. | all | HeartofPhos; Atroz; Tytykiller | EL act-2.txt#L49-L60 ; PV act-2 ; TYT | 3.29 | high |
| 2 | 1_2_9 Western Forest (Alira / Arteri) | Alira's camp sits along the map wall by the waypoint road. Look for the torch touching the road and follow its trail. Arteri (Thaumetic Emblem) is farther along the road to the SW. | all | HeartofPhos; Atroz | EL act-2.txt#L76-L80 ; PV act-2 | 3.29 | high |
| 2 | 1_2_12 Wetlands | Find the two pillars near the waypoint and follow the trail. Oak is usually on the side away from the town entrance. | all | HeartofPhos; Atroz | EL act-2.txt#L72-L74 ; PV act-2 | 3.29 | high |
| 2 | Bandits | Killing all three bandits gives a passive point (and the end-of-campaign total is 24 instead of 23). Helping one gives that bandit's reward instead. Do the kills in the order that saves walking, and log out after each. | all | HeartofPhos; Crouching_Tuna | EL act-2.txt#L62-L160 ; EL act-10.txt (end) ; MXC | 3.29 | high |
| 2 | 1_2_8 Northern Forest | The path to the exit makes an S or L shape. Skip Dread Thicket in Act 2 unless you want its hideout. | all | HeartofPhos; Atroz; Crouching_Tuna | EL act-2.txt#L163-L164 ; PV act-2 ; MXC | 3.29 | high |
| 2 | 1_2_14_3 Ancient Pyramid | The first-floor exit is in one of three corners. Each later floor exits diagonally across from where you came in. Aim for level 20-22 at Vaal Oversoul. | all | HeartofPhos; Tytykiller | EL act-2.txt#L166-L171 ; TYT | 3.29 | high |
| 2 | Pyramid Apex | After the Oversoul, use a logout to pick up the waypoint quickly. | race | Crouching_Tuna | MXC | 3.26 | med |
| 2 | Act 2 vendors | Recipe: an item, a Magic/Rare Rustic Sash and a Whetstone give a +% physical weapon. Use Magic sashes in Acts 2-3 and Rare from Act 4. Three Armourer's Scraps trade for one Whetstone. | all | havoc616 | HV (duelist, scion) | 3.29 | med |
| 3 | 1_3_1 City of Sarn | Save Clarissa and talk to her (needed for the Sewer Keys later). Then take the small stairs and follow the water to town. | all | Atroz; HeartofPhos | PV act-2 (end) ; EL act-3.txt#L2-L5 | 3.29 | high |
| 3 | 1_3_2 → 1_3_3_1 Crematorium | Slums: head N. In the Crematorium follow the stairs, do the trial (league start), kill Piety and take Tolman's Bracelet, then log out. | all | HeartofPhos; Atroz | EL act-3.txt#L6-L15 ; PV act-3 | 3.29 | high |
| 3 | 1_3_10_1 Sewers | There are 3 busts: one before the waypoint and two after it. Later, the Undying Blockage is right next to the waypoint. | all | HeartofPhos; Atroz | EL act-3.txt#L18-L21 ; PV act-3 | 3.29 | high |
| 3 | 1_3_5 → 1_3_6 Catacombs | The Catacombs is next to the Marketplace waypoint. Enter only for the trial (league start), then log out. | safe | HeartofPhos; Atroz; Crouching_Tuna | EL act-3.txt#L24-L30 ; PV act-3 ; MXC | 3.29 | high |
| 3 | 1_3_7 Battlefront | The waypoint is roughly central or northern. The Ribbon Spool cart is below it (SW), and the Docks are to the NW or left. Skip Captain Aurelianus. | all | HeartofPhos; Atroz; Crouching_Tuna | EL act-3.txt#L32-L37 ; PV act-3 ; MXC | 3.29 | high |
| 3 | 1_3_9 The Docks | If you are under-levelled, clear here to catch up. The unique mob drops a guaranteed Essence on first click. Reset the zone to reroll which Essence you get. | safe | Atroz; havoc616 | PV act-3 ; HV | 3.29 | med |
| 3 | 1_3_8_2 Solaris Temple 2 | Take the crafting recipe beside Lady Dialla (flat fire to spells is T1, 4 Transmutes). A rare Jade Amulet is also available here. | all | havoc616; HeartofPhos | HV (witch, scion) ; EL act-3.txt#L40-L41 | 3.29 | high |
| 3 | 1_3_13 Ebony Barracks | Gravicius is optional for the quest but gives a gem reward. Most racers kill him on the way since he is near the route (NW). | all | Crouching_Tuna; HeartofPhos | MXC ; EL act-3.txt#L56-L58 | 3.29 | high |
| 3 | 1_3_14_2 Lunaris Temple 2 | Take the stairs that go up. At the wagon fork, take the side with one wagon (two wagons is a dead end). Piety drops the Tower Key. Aim for about level 27-28. | all | HeartofPhos; Atroz; havoc616 | EL act-3.txt#L61-L66 ; PV act-3 ; HV | 3.29 | high |
| 3 | 1_3_15 Imperial Gardens | The trial is almost always in the top-left (N) area. The Library is up the stairs at the upper-left fork. The Sceptre of God is lower-right, then up and right. | all | Atroz; HeartofPhos | PV act-3 ; EL act-3.txt#L69-L78 | 3.29 | high |
| 3 | 1_3_17 Library (optional) | Do it only if you need its extra gem purchases. Find the Loose Candle in a narrow corridor and collect 4 pages. Bring the currency to buy gems before turning in. One source says doing it early removes the need for the Act 6 Twilight Strand gem unlock. | safe/new | HeartofPhos; Atroz; havoc616 | EL act-3.txt#L79-L88 ; PV act-3 ; HV (ranger) | 3.29 | high (optional) / med (A6 claim) |
| 3 | 1_3_18_2 Upper Sceptre of God | The stairs up are in one of the corners. On the rooftop, Dominus is past the barricades. | all | HeartofPhos | EL act-3.txt#L91-L95 | 3.29 | med |
| 3 | Act 3 | Respec after Act 3: every gem is buyable by then and refunds are cheap. | safe | community | F26 | 3.29 | low |
| 4 | 1_4_1 Aqueduct | Run past the Hundred Foot Shadow. The Highgate entrance is at the end of the left lane. | all | Crouching_Tuna | MXC | 3.26 | med |
| 4 | Act 4 (general) | Be level 32 before you enter Kaom's Stronghold to avoid a heavy XP penalty. | all | havoc616 (x4 guides); Maxroll build writers | HV ; MXB | 3.29 | high |
| 4 | 1_4_3_3 Crystal Veins / Aspirants' Plaza | Do the Normal Lab here in Act 4, at around level 31-33, once the three Act 1-3 trials are done. The Cold craft sits beside the Crystal Veins waypoint. | all | HeartofPhos; Atroz; havoc616; Maxroll writers | EL act-4.txt#L12-L14 ; PV act-4 ; HV ; MXB | 3.29 | high |
| 4 | 1_4_5 / 1_4_4 Kaom & Daresso | Order differs between sources. EL takes Daresso's Dream as far as the Grand Arena, does Kaom, then portals back for Daresso. PoE Vault says do Kaom first because he is easier at low level. Pick one and keep it consistent. Daresso: go SW and keep heading W through the arenas. | all | HeartofPhos; Atroz | EL act-4.txt#L15-L27 ; PV act-4 | 3.29 | med (conflict) |
| 4 | 1_4_4_3 Kaom's Stronghold | Head NE and follow the bridges. | all | HeartofPhos | EL act-4.txt#L19-L20 | 3.29 | med |
| 4 | Act 4 | Craft fire and cold resists before Kaom and Daresso (SSF habit). | safe | Tytykiller | TYT | 3.8 | low |
| 4 | 1_4_6_3 The Harvest | Doedre is the hardest of the three organ bosses. The Black Core door is next to the Harvest waypoint. | all | Crouching_Tuna; Atroz | MXC ; PV act-4 | 3.29 | high |
| 5 | 1_5_1 Slave Pens | Go S until the hanged Karui corpse, then loop clockwise toward the W to find Krow. | all | HeartofPhos | EL act-5.txt#L3-L5 | 3.29 | med |
| 5 | 1_5_2 Control Blocks | The Miasmeter (passive point) is far W. Casticus is NE of the Miasmeter. | all | HeartofPhos; Crouching_Tuna | EL act-5.txt#L8-L11 ; MXC | 3.29 | high |
| 5 | 1_5_5 Chamber of Innocence | Loop clockwise. It has guaranteed magic packs, so it is the Act 5 farm spot (about 40-42). Avarius's arena is a counter-clockwise spiral to the NW. | all | HeartofPhos; havoc616 | EL act-5.txt#L15-L21 ; HV | 3.29 | high |
| 5 | 1_5_7 Reliquary | The three Kitava's Torments sit in the map corners. Drop a portal at the Cathedral Rooftop entrance first so you can return straight there. | all | HeartofPhos; havoc616 | EL act-5.txt#L37-L40 ; HV | 3.29 | high |
| 5 | Cathedral Apex (Kitava) | Kitava permanently gives -30% elemental and chaos resistance. Have resists ready for Act 6. Deaths start costing XP after this fight. | new/safe | Crouching_Tuna; Rootz | MXC ; PVB | 3.26 / 3.22 | high |
| 6 | 2_6_1 Twilight Strand | Clear it once per league to unlock Lilly Roth's gem vendor. | all | Crouching_Tuna; HeartofPhos | MXC ; EL act-6.txt#L3-L4 | 3.29 | high |
| 6 | 2_6_4 Mud Flats | The Dishonoured Queen is usually in the NE corner, near a house. | all | HeartofPhos | EL act-6.txt#L9-L10 | 3.29 | med |
| 6 | 2_6_5 Karui Fortress | Tukohama is NE. On league start, kill the pack on the SW island for a Tattoo. | safe | HeartofPhos | EL act-6.txt#L12-L16 | 3.29 | med |
| 6 | Prison Rooftop | At 50% life, Brutus gets a lightning buff. Be ready for it. | new/safe | Crouching_Tuna | MXC | 3.26 | med |
| 6 | 2_6_14 The Beacon | Follow the shore. Put down a safety portal while escorting the fuel pylons, because the spawned waves hit hard. | safe | HeartofPhos; havoc616; Crouching_Tuna | EL act-6.txt#L54-L56 ; HV ; MXC | 3.29 | high |
| 7 | 2_7_1 Broken Bridge | On league start, grab the Silver Locket by following the road to the broken waypoint. It leads to a free flask reward. | safe | HeartofPhos; Crouching_Tuna; havoc616 | EL act-7.txt#L3-L6 ; MXC ; HV | 3.29 | high |
| 7 | 2_7_5_map Maligaro's Sanctum | Hug the zone edges. The bridges are usually in opposite diagonal corners. | all | HeartofPhos | EL act-7.txt#L28-L31 | 3.29 | med |
| 7 | 2_7_5_2 Chamber of Sins 2 (trial) | 3.29 campaign secret: a switch hidden behind the trial plaque opens a room with a Hidden Gem (Quality). | safe | HeartofPhos | EL act-7.txt#L40-L43 | 3.29 | med |
| 7 | 2_7_9 Dread Thicket | If you see the entrance while heading to the Causeway, drop a portal. The T2 fire craft is near Dreadstone. | all | havoc616 | HV (witch, duelist, scion) | 3.29 | med |
| 7 | Cruel Labyrinth | Run Cruel Lab in Act 7 after Gruthkul, once the Act 6-7 trials and skill points are done, and before talking to Yeena. | all | HeartofPhos; Crouching_Tuna; Maxroll writers | EL act-7.txt#L63-L65 ; MXC ; MXB | 3.29 | high |
| 7 | 2_7_12_1 Temple of Decay 1 | In the room with the central pit, a side room to the SW or NE holds a corrupted unique. | safe | HeartofPhos | EL act-7.txt#L66-L67 | 3.29 | med |
| 7 | Arakaali | Bait her laser barrage to one side, then step to the other. | new | Crouching_Tuna | MXC | 3.26 | med |
| 8 | 2_8_2_2 Doedre's Cesspool | Black paint splashes on the floor point the way. Ignore the valves and burst Doedre. | all | HeartofPhos; Crouching_Tuna | EL act-8.txt#L5-L7 ; MXC | 3.29 | high |
| 8 | 2_8_8 The Quay | Follow the W wall to the Sealed Casket (Ankh). The Resurrection Site is SE. | all | HeartofPhos; Crouching_Tuna | EL act-8.txt#L11-L15 ; MXC | 3.29 | high |
| 8 | 2_8_9 / 2_8_10 Grain Gate, Imperial Fields | Follow the dead guards lying in doorways. The Legionnaires show as a book icon. | all | HeartofPhos | EL act-8.txt#L17-L22 | 3.29 | med |
| 8 | Act 8 cold zones | Use a freeze-immune flask (a rerolled Quicksilver or a Hallowed Life flask). | safe | havoc616 | HV (duelist, scion) | 3.29 | med |
| 8 | 2_8_13 Harbour Bridge | On the final return, ctrl+click the entrance to open a fresh instance for extra XP. | race/safe | havoc616 | HV (all 4) | 3.29 | med |
| 9 | 2_9_1 Blood Aqueduct | The usual farm before maps (about 58-62). It is also the Humility card farm. | safe | HeartofPhos; havoc616; Crouching_Tuna | EL act-8.txt#L52-L53 ; HV ; MXC | 3.29 | high |
| 9 | 2_9_6 Boiling Lake | The Basilisk is NE. Petrified soldiers mark the way. | all | HeartofPhos | EL act-9.txt#L14-L15 | 3.29 | med |
| 9 | 2_9_7 The Tunnel (trial) | 3.29 secret: on the way to the trial plaque (opposite corner), a hidden switch opens a Hidden Gem (Transfigured). | safe | HeartofPhos | EL act-9.txt#L31-L33 | 3.29 | med |
| 9 | 2_9_9 The Refinery | Adus is NE along the cart tracks. The sewer grate to the Refinery Tunnels (craft) is attached to the tracks. | all | HeartofPhos | EL act-9.txt#L41-L45 | 3.29 | med |
| 9 | 2_9_5 Foothills | Boulderback is optional; he can drop a 2-respec item. Skip him for speed. | new | Crouching_Tuna | MXC | 3.26 | med |
| 9 | Belly of the Beast (A9) | Roll a bleed-removal flask before going in. | safe | havoc616 | HV (all 4) | 3.29 | high |
| 10 | 2_10_2 Ravaged Square | Drop a portal in the plaza, waypoint out, then come back through the portal. The Control Blocks are S and Vilenta is NE inside. | race/all | HeartofPhos; havoc616 | EL act-10.txt#L5-L13 ; HV | 3.29 | high |
| 10 | 2_10_9 Ossuary | It holds the last trial needed for Merciless Lab. 3.29 secret: a switch before the zig-zag walls opens a Hidden Gem (Facetor's Lens). | safe | HeartofPhos; Crouching_Tuna | EL act-10.txt#L14-L20 ; MXC | 3.29 | high |
| 10 | Merciless Labyrinth | Run it in Act 10 after Vilenta. It is a difficulty spike, so slow down, use dark shrines and take any keys on your path. | all | HeartofPhos; Maxroll writers | EL act-10.txt#L22-L23 ; MXB | 3.29 | high |
| 10 | 2_10_3 / 2_10_4 Torched Courts, Desecrated Chambers | Courts exit is SE. Loop the Chambers clockwise. Avarius is again in a NW counter-clockwise spiral. | all | HeartofPhos | EL act-10.txt#L24-L30 | 3.29 | med |
| 10 | 2_10_5 Canals | Mobs hit very hard. Slow down here. | new/safe | Crouching_Tuna | MXC | 3.26 | med |
| 10 | Karui Shores | Type /passives and confirm 23 points (24 if you killed the bandits). | all | HeartofPhos | EL act-10.txt (end) | 3.29 | med |
| all | Every boss | Log out to character select to reach town instead of walking or spending a portal. At league launch use "Exit to Character Selection", never the login screen, to dodge queues. | all | HeartofPhos; Atroz; Tytykiller | EL `{logout}` steps ; PV index ; TYT | 3.29 | high |
| all | Level vs zone | Stay a little under the zone level (sources give 1-4 levels below) and do not full-clear. Racers sit lowest; new players can sit at zone level. | all | Rootz; Tytykiller; community | PVB ; TYT ; F26 | mixed | high (principle) |
| all | Boots recipe | Boots + Quicksilver + Augmentation give 10% movement speed. Repeat with the movement-speed boots for +5% more. The tiers unlock at levels 12, 24, 32 and 44. | all | havoc616; Tytykiller; community | HV ; TYT ; F26 | 3.29 | high |
| all | Recipe altars | Most act zones have a crafting-recipe altar near the boss or quest spot. Grab them as you pass (EL marks each one). | all | HeartofPhos; Crouching_Tuna | EL `{crafting}` steps ; MXC | 3.29 | high |
| all | Flask rewards | Free quest flasks come in Act 5 (Key to Freedom), Act 7 (Silver Locket) and Act 10 (Safe Passage). Pick them to suit your defence. | all | havoc616 | HV | 3.29 | med |
| all | Labs (league vs alt) | Trials are once per league per account. On alts, skip every trial step and go straight to labs. | all | Rootz; HeartofPhos | PVB ; EL `#ifdef LEAGUE_START` | 3.29 | high |
| all | Vendor regex | Paste a build regex into vendor search every town visit to spot bases. With 3.29 white sockets, link count matters more than colours. | all | havoc616 | HV | 3.29 | med |
| all | Planning | Plan gems and gear before the run, set a time target (sub-12h, sub-8h, sub-4h needs different choices) and use a filter that shows 3-links and Quicksilvers. | all | community | F26 | 3.29 | low |

Count: 96 rows (Acts 1-4: 54; Acts 5-10: 34; general: 8).

## Presets (proposed)

Each preset is a set of toggles over one base route. EL already models the first three (`LEAGUE_START`, `LIBRARY`, `BANDIT_*`).

1. **Speedrun / Alt** (race; trials already done this league)
   - OFF: Tidal Island and Hailrake, The Den / Great White Beast, all trials, the Chemist strongbox, Library, Fetid Pool, Boulderback, the Karui Tattoo island, Silver Locket, Temple of Decay unique room, Hidden Gem secrets.
   - ON: logout after every boss, Ravaged Square portal trick, the Pyramid logout for the waypoint.
   - Level targets: lowest (about 2-4 under zone). Bandits: killing all three is fine.
   - Labs: Normal in A4 (level 32 gate), Cruel after Gruthkul in A7, Merciless after Vilenta in A10. Only farm stop is the Harbour Bridge reset.

2. **League start** (safe; first character; this is EL's `LEAGUE_START`)
   - ON: Tidal Island (Quicksilver), Den (second Quicksilver), all 9 trials (A1 Lower Prison, A2 CoS2 and Crypt, A3 Crematorium, Catacombs and Gardens, A6 Prison, A7 Crypt and CoS2, A8 Bath House, A9 Tunnel, A10 Ossuary), Chemist strongbox, Silver Locket, Karui Tattoo, the 3.29 Hidden Gem rooms, Broken Bridge exiles, Riverways breach.
   - Library: optional toggle.
   - Level targets: about 1-2 under zone. Hard gate of level 32 before Kaom's Stronghold.
   - Farm stops: Chamber of Innocence (40-42) and Blood Aqueduct (58-62).
   - Habits: safety portals at the Beacon and Reliquary, bleed flask in A9, freeze flask in A8.

3. **SSF / Hardcore-safe** (League start plus extra checks)
   - Everything in League start, plus the Library ON (more gem access), the Docks catch-up clear and Essence reset, and the Sash weapon recipe every act.
   - Resist checkpoints: before Merveil (cold), before Kaom and Daresso, and before Kitava A5.
   - Level targets: at zone level, not below.
   - Lab: delay Merciless if under-geared.

4. **First-time player** (new)
   - League-start content ON, plus the optional respec sources (Fetid Pool, Boulderback, Ossuary chest).
   - Show boss mechanic tips (Arakaali, Brutus 50%, Kitava -30%) and XP-loss warnings from Act 6.
   - Level targets: at zone level.
   - Bandits: show the choice with a recommendation. Logout tips shown as hints, not steps.

## Sources we could not use

- **YouTube (Pohx, Tuadh/"Tudash", Fubgun, Zizaran, Imexile, Lolcohol, Steelmage, Mathil, Engineering Eternity, Ventrua)**: WebFetch on video pages returns only the title. Descriptions, chapters and transcripts did not come through, and we are not allowed tools like yt-dlp. Pohx's site (pohx.net) only links to his Act 1-10 RF walkthrough videos (3.29), so it gave no written tips. Tuadh's 3.29 leaguestart runs are listed on poebuilds.cc as videos only.
- **Mobalytics** (Pohx RF Chieftain written guide; Fubgun's PoE1 guides): HTTP 403.
- **speedrun.com** `/poe/resources` and `/poe/guides`: HTTP 403.
- **Reddit and poewiki.net**: not tried, per the rules.
- **Tytykiller**: no current written guide found. We only have a third-party 2019 (3.8) forum summary of his HCSSF run; we used it only for timeless habits and level checkpoints.
- **Zizaran, Imexile, Lolcohol, Steelmage, Mathil, Engineering Eternity, Ventrua**: no fetchable written campaign tips found from 3.25 or later. Search only surfaced build pages and video titles. A GGG forum list mentions Engineering Eternity's simplified layout guides, but they were not fetchable.
- **Exile UI** (MIT): skipped for now, because its default guide mixes Cyclon-derived lines and we could not cleanly separate them.
- **Unlicensed forks** (e.g. nicolasbagatello/poe1-campaign-helper, which has no license): not used.
- **havoc616** is the only named racer with a substantial written 3.29 source. Most zone layout reads come from the MIT exile-leveling route, which follows speedrun strategy but is not by a named racer.
