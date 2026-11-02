# PoE1 leveling -> maps transition: research notes (compiled 2026-11-02)

Current league: 3.29 Curse of the Allflame. Next: 3.30 "Covens of Umbra", launches 2026-11-13 PST.

Legend: **VERIFIED** = I read it on the cited page (or saw it in a live API response / source code) during this session.
**UNVERIFIED** = from a search-result summary, a third-party aggregator, an inference, or my own background knowledge. Check it before you hard-code it.
"Patch" is the version the source applies to (or its last-updated date if it gives no version).
Not used: poewiki.net and Reddit (both blocked; not bypassed). A few facts below repeat poewiki claims that appeared in search snippets, and those are marked UNVERIFIED.

---

## 0. League timeline and 3.30 statements (official only)

| Fact | Status | Source | Patch |
|---|---|---|---|
| 3.29 Curse of the Allflame ends at 1 PM PST on Nov 9, 2026. 3.30 releases Nov 13 (PST). "Full details to be revealed at ExileCon 2026" (Kelly_GGG, Oct 12 2026) | VERIFIED | https://www.pathofexile.com/forum/view-thread/4010618 | 3.29 / 3.30 |
| 3.30 is named **"Path of Exile 1: Covens of Umbra"**. It is free to play on PC and consoles from Nov 13 PST. The reveal is **Friday Nov 6, 12:30 PM PST** on the ExileCon main stage, on twitch.tv/pathofexile and YouTube (Natalia_GGG, Nov 1 2026). Nov 7-8 NZT is the same moment in New Zealand time. | VERIFIED (the NZT reading is my inference) | https://www.pathofexile.com/forum/view-thread/4012420 | 3.30 |
| Neither official post mentions endgame or Atlas changes. The announcement only promises "our latest developments". | VERIFIED | same two threads | 3.30 |
| "Extreme shakeup" of the endgame: press reports say Octavian (GGG) told streamer Zizaran in an interview. ixbt quotes him as saying "the endgame has simply become repetitive" and that the changes touch maps, bosses and most league mechanics. **No official GGG post says this.** The PC Gamer headline also uses the phrase. | UNVERIFIED (secondhand interview reporting; treat as speculation until the Nov 6 reveal) | https://www.pcgamer.com/games/rpg/path-of-exile-devs-are-planning-an-extreme-shakeup-in-the-next-major-update-to-address-concerns-over-its-stale-endgame-and-lack-of-exciting-loot-drops/ , https://ixbt.games/en/news/2026/10/28/ggg-gotovit-bolsie-peremeny-v-path-of-exile-endgeim-zdet-sereznaia-vstriaska.html | 3.30 |
| Blogs claim Mirage returns, Ritual is reworked, pinnacle and uber bosses are rebalanced, and loot changes. | UNVERIFIED (gold-seller and aggregator blogs, plus player speculation in forum replies) | e.g. mmoexp, poecurrency, u4gm | 3.30 |

**Implication for the overlay:** keep the endgame and voidstone content data-driven. Atlas and voidstone facts may change on Nov 6 to 13.

---

## 1. Pantheon

| Fact | Status | Source | Patch |
|---|---|---|---|
| Pantheon powers unlock by defeating bosses in **Acts 6 to 10**. Each character must unlock the base powers in the campaign. | VERIFIED | https://maxroll.gg/poe/resources/pantheon (updated 2026-03-20) | 3.2x |
| **Major gods (4)** are unlocked by the Act 6, 7 and 8 campaign bosses: **Brine King** = Act 6 boss, **Arakaali** = Act 7 boss, **Lunaris** and **Solaris** = Act 8 bosses (the sisters) | VERIFIED | maxroll pantheon | 3.2x |
| **Minor gods (8)** are unlocked by optional side quests. Maxroll lists Tukohama, Abberath and Ryslatha (Act 6), Gruthkul (Act 7), Yugul (Act 8), and Garukhan and Shakari (Act 9). Maxroll's list omits **Ralakesh**, which is the 8th: poedb lists 12 souls, including Ralakesh. Ralakesh is believed to unlock in Act 7, but that is not verified. | VERIFIED (list) / UNVERIFIED (Ralakesh act) | maxroll pantheon; https://poedb.tw/us/Complete_the_Pantheon | 3.2x |
| One major and one minor power can be active at a time. Swapping is free but only possible in a town or hideout. The default hotkey is **Y**. | VERIFIED | https://poedb.tw/us/Pantheon ; maxroll pantheon | 3.2x |
| Sin introduces the Pantheon in **Act 6**, reportedly after Tukohama is defeated (Karui Fortress). The exact Sin dialogue was not found. | UNVERIFIED (search-result summary of the maxroll campaign guide) | https://maxroll.gg/poe/getting-started/campaign-guide | 3.2x |
| **Upgrades:** put a **Divine Vessel** in the map device with a map that contains the boss shown in the Pantheon menu, then kill the boss. The vessel becomes a **Captured Soul**, which you take to **Sin** to unlock the upgrade. The Atlas search (hotkey G) finds the right map. | VERIFIED | maxroll pantheon; poedb Pantheon | 3.2x |
| Upgrades apply to all characters in the league. A toggle in the menu can downgrade them. Early-league vendor recipe: 5 flasks + 1 Divine Orb gives 5 Divine Vessels. | VERIFIED | maxroll pantheon | 3.2x |
| **Recommended default:** "Soul of the Brine King is the most widely used Major God" (stun and freeze immunity once upgraded). Maxroll gives no minor-god default. | VERIFIED | maxroll pantheon | 3.2x |
| Common leveling or early-map picks: Brine King for safety, Lunaris (movement speed and physical mitigation, per build guides), Solaris for bossing once upgraded. Common minors: Gruthkul, Abberath, Ralakesh, Shakari. | UNVERIFIED (build guides via search; my background knowledge for the minors) | e.g. https://www.poe-vault.com/guides/toxic-rain-pathfinder-pantheon-ascendancies-bandits (3.29) | 3.29 |

---

## 2. Ascendancy / Labyrinth

| Lab | Area level | Trials required | Asc. points | Status / source |
|---|---|---|---|---|
| Normal | **33** | 6 trials from Acts 1-3: Lower Prison (A1), Crypt Lvl 1 and Chamber of Sins Lvl 2 (A2), Crematorium, Catacombs and Imperial Gardens (A3) | 2 | VERIFIED, https://maxroll.gg/poe/getting-started/labyrinth-guide (updated 2025-10-14) |
| Cruel | **55** | 3 trials from Acts 6-7: Prison (A6), Crypt Lvl 1 and Chamber of Sins Lvl 2 (A7) | 2 | VERIFIED, maxroll |
| Merciless | **68** | 3 trials from Acts 8-10: Bath House (A8), Tunnel (A9), Ossuary (A10) | 2 | VERIFIED, maxroll |
| Eternal (Uber) | **75**; improved offerings raise it to **83** | None. It needs the campaign finished plus 1 **Offering to the Goddess** (improved offerings come from Trial of Glory) | 2 | VERIFIED, maxroll |

- There are 8 ascendancy points in total (VERIFIED, maxroll).
- The lab entrance is **Aspirants' Plaza**, reached through a plaque in the Act 3 **Sarn Encampment** after the six initial trials (VERIFIED, maxroll).
- poedb's Lord's Labyrinth quest page also places the hub in Sarn Encampment (VERIFIED, https://poedb.tw/us/The_Lords_Labyrinth).
- **Area ids** (VERIFIED, https://poedb.tw/us/Aspirants_Plaza): Aspirants' Plaza is `Labyrinth_Airlock` (Act 3, area level 33). poedb also lists `1_Labyrinth_AirlockClean` (Act 1, level 1). poedb does not map these ids to difficulties.
- Lab area ids match `^\d+_labyrinth|endgame_labyrinth`, per the regex in a PoE log tool (VERIFIED as code, https://github.com/bear421/poe-map-log-viewer/blob/main/src/ingest/log-tracker.ts). This suggests Normal, Cruel and Merciless use a numeric prefix and Eternal uses `EndGame_Labyrinth`. UNVERIFIED for exact values.
- **Typical character levels** for each run (UNVERIFIED, community practice and my background knowledge; none of the fetched guides state them):
  - Normal: about 33-40, at the end of Act 3 or start of Act 4.
  - Cruel: about 55-62, during Acts 7-8.
  - Merciless: about 68-75, right after Act 10 or in early white maps.
  - Eternal: about 75-85, in yellow or red maps.
- poewiki (via search snippet) says Cruel needs character level 40 to enter. UNVERIFIED.
- 3.29 added the **Luminary** Scion ascendancy (permanent Mercenaries). It also changed Assassin, Inquisitor, Occultist, Reliquarian and Hierophant nodes. In 3.29 you no longer need to free the Scion in Act 3 to create one. (VERIFIED, https://www.pathofexile.com/forum/view-thread/3985332, 3.29.0)

---

## 3. End of Act 10 to early maps checklist

| Step / fact | Status | Source | Patch |
|---|---|---|---|
| After killing Kitava in Act 10, you meet **Commander Kirac on the Karui Shores**. He gives you a **Map Device** in your hideout. The Atlas unlocks "after completing some tasks for Commander Kirac during the Epilogue". Maxroll does not name the tasks. | VERIFIED | https://maxroll.gg/poe/getting-started/atlas-explained (updated 2026-05-08) | 3.2x |
| Maps start dropping in Act 8 but are rare. Tiers: **White T1-5, Yellow T6-10, Red T11-16** (T17 exists separately) | VERIFIED | maxroll atlas-explained | 3.2x |
| 3.29: you start by running one of the **four starting maps in the centre of the Atlas**. Kirac sells maps. | UNVERIFIED (search summary of mobalytics; the page returned 403 to fetch) | https://mobalytics.gg/poe/guides/basic-endgame-guide-scorpius | 3.29 |
| Kirac's shop sells maps, scarabs and map currency. It resets when you open a Kirac mission (maxroll). Another source says you can pay 10k gold to refresh it. | VERIFIED (reset on mission) / UNVERIFIED (gold refresh) | https://maxroll.gg/poe/getting-started/atlas-progression-guide | 3.2x |
| **Atlas passive points** come from Map Completion Bonuses: kill the map boss with the map **Magic (white), Rare (yellow) or Corrupted Rare (red)**. There are **138 points** in total: 100 from completion, 10 from unique maps, 5 from Nightmare maps, and 23 from pinnacle and originator quests. Each Voidstone's Book also gives 1 point and 2 refund points. | VERIFIED | maxroll atlas-progression-guide; atlas-explained | 3.2x |
| Questlines start around T6 and run to T14-16. They unlock the 3 map-device Beacons. | VERIFIED | maxroll atlas-progression-guide | 3.2x |
| **Voidstones (current):** Searing Exarch and Eater of Worlds give the **Eldritch** voidstone, the Maven gives **Ceremonial**, Uber Elder gives **Decayed**, and the **Incarnation of Dread** gives **Omniscient**. Sirus is **no longer** listed as a voidstone source. With all 4 socketed, every map is T16. | VERIFIED (as stated by maxroll, 2026-05-08). UNVERIFIED which patch replaced Sirus (3.28 per one third-party guide) | maxroll atlas-explained; atlas-progression-guide | 3.28/3.29 |
| League-start priority (maxroll "Alch and Go", 3.29): reach yellow maps fast, "prioritize completing the eldritch quests and acquiring map completion over everything else", and run the strategy "until you acquire the first two void stones". The goal is all 4 voidstones ASAP. | VERIFIED | https://maxroll.gg/poe/currency/league-start-alch-and-go (updated 2026-07-24) | 3.29 |
| **3.29 endgame changes**: **Anomalies** on the Atlas, which Kirac labels; they can appear after completing voidstone-affected maps and are not affected by the Atlas tree. Reflecting Mist and the Nameless Seer moved into Anomaly areas. The Decayed Voidstone socket now connects to the Forge of the Phoenix. Untainted Paradise is now a random Atlas event node. Abyss was revamped and got a new pinnacle boss. A **Scrying Orb** currency was added. Catalysts now come only from Ultimatum. The map pool was reshuffled. Reflect mods were replaced with Thorns. A new Altered Prophecy Atlas-tree cluster was added, plus a Mercenary notable in 3.29.x. | VERIFIED (summarised from the official notes, first ~100k chars) | https://www.pathofexile.com/forum/view-thread/3985332 ; https://maxroll.gg/poe/news/upcoming-changes-and-farming-strategies-in-3-29 | 3.29.0-3.29.x |
| Practical checklist: buy and run white maps from Kirac, pick a starter Atlas tree, do bonus completion, run Merciless lab (68), get resistances capped (Act 10 leaves you at -60% via the Kitava penalties), upgrade Pantheon (Divine Vessel), switch the filter to a mapping strictness, then do the Eldritch quests followed by the voidstones. | UNVERIFIED (synthesis of guide content plus background knowledge) | n/a | 3.29 |

---

## 4. Loot filters

| Fact | Status | Source | Patch |
|---|---|---|---|
| NeverSink strictness levels: **0-SOFT, 1-REGULAR, 2-SEMI-STRICT, 3-STRICT, 4-VERY-STRICT, 5-UBER-STRICT, 6-UBER-PLUS-STRICT**. New players should start at SEMI-STRICT and raise strictness as the character gets stronger. The filter switches between a "leveling mode" and an "endgame mode" at **item level 68**. | VERIFIED | https://github.com/NeverSinkDev/NeverSink-Filter (README) | current |
| Common community practice: Regular or Semi-strict while leveling, Strict to Very Strict once in yellow and red maps. | UNVERIFIED (practice; the README does not prescribe this) | n/a | n/a |
| Local install: copy the `.filter` file to `%userprofile%/Documents/My Games/Path of Exile`. In game, go to Escape, **Options, Game, Filters** (the README says "Game -> Filters", not UI) and pick from the dropdown. The menu has a refresh/reload button for local edits. | VERIFIED (README) / reload button UNVERIFIED (forum post) | NeverSink README; https://pathofexile.com/forum/view-thread/3146081 | current |
| **Online filters:** you follow a filter on the pathofexile.com filter ladder (`/item-filter/ladder/follower`). These "auto-update"; restart the game or reselect the filter in options to pick up changes. GitHub downloads do not auto-update. | VERIFIED (README wording) | NeverSink README | current |
| **FilterBlade:** "Sync" is a one-time upload to your PoE account, available in game right away. "Sync Auto" is a premium (Patreon) feature with continuous updates. The default strictness is Semi-Strict. | VERIFIED | https://www.filterblade.xyz/ | current |
| A `/itemfilter <name>` chat command switches filters (I believe it was added in the 3.17-era notes). The forum's Siege of the Atlas filter post does **not** mention it. A `/reloaditemfilter` claim came from a currency-seller site. | UNVERIFIED | https://www.vhpg.com/?p=65156 (low quality); https://www.pathofexile.com/forum/view-thread/3230194 | ? |
| Exactly when an updated online filter takes effect in a running client (login, zone change, or character select) is **not documented officially**. Community sources say to restart or reselect. | UNVERIFIED | NeverSink README; forum threads | n/a |
| **Developer API** (scope **`account:item_filter`**): `GET /item-filter` lists filters, `GET /item-filter/<id>` gets one, `POST /item-filter` creates one, and `POST /item-filter/<id>` updates it (partial update; the docs anchor calls it "patch"). Body fields are `filter_name`, `realm` (pc, xbox, sony, poe2), `description?`, `version?`, `type?` (Normal or Ruthless), `public?` (default false; once public it cannot be made private), and `filter` (the text). The `?validate=true` query validates against the current game version and returns `validation{valid,version,validated}`. **HTTP 202** means "additional processing". The docs say **nothing about in-game auto-refresh**. | VERIFIED | https://www.pathofexile.com/developer/docs/reference | current API |

---

## 5. Price checking at league start

| Fact | Status | Source | Patch |
|---|---|---|---|
| Live poe.ninja PoE1 endpoints, probed 2026-11-02, both HTTP 200 JSON: **`https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=<L>&type=Currency`** returns `{lines[], currencyDetails[]}`, with fields `currencyTypeName, pay, receive, chaosEquivalent, detailsId, …`. **`https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=<L>&type=BaseType`** returns `{lines[]}` with fields `name, levelRequired, variant, itemClass, itemType, chaosValue, divineValue, exaltedValue, count, listingCount, detailsId, sparkLine`. The Allflame BaseType response had 8926 lines (about 3 MB). | VERIFIED (live) | API responses | 3.29 |
| League list: **`https://poe.ninja/poe1/api/data/index-state`** returns `economyLeagues` (Allflame, Hardcore Allflame, Standard, Hardcore) and `oldEconomyLeagues`. The league query value is the display name, e.g. `league=Allflame`. | VERIFIED (live) | API response | 3.29 |
| The legacy `https://poe.ninja/api/data/currencyoverview` and `/api/data/itemoverview` endpoints now return **404**. They are still documented in community docs (types: Currency, Fragment, Oil, Scarab, Fossil, Essence, DivinationCard, SkillGem, BaseType, Map, Unique*, AllflameEmber, …). | VERIFIED (404 live) / doc VERIFIED | https://github.com/ayberkgezer/poe.ninja-API-Document | 3.29 |
| poe.ninja has **no official public API documentation page**: `poe.ninja/poe1/api` returned 404. The endpoints above are undocumented and could change. | VERIFIED (404) | n/a | n/a |
| "poe.ninja has no data for the first ~24-48h of a league": **no source confirms this**. Mirror sites show "no price data yet" for a new league until listings accumulate. poe.ninja ingests the public stash river, so data usually appears within hours but is thin and volatile on day 1-2. | UNVERIFIED (the 24-48h figure is not confirmed; the "within hours" claim is my background knowledge) | https://outof.games (mirror) | n/a |
| Fallback: the official trade site (pathofexile.com/trade, including bulk exchange) works from minute one. The overlay should show "no data / low confidence" when ninja returns empty or low-count lines (`count` / `listingCount` fields). | UNVERIFIED (design suggestion) | n/a | n/a |

---

## 6. Client.txt signals (PoE1)

Line prefix example: `2024/01/15 12:34:56 12345678 abc [INFO Client 1234] : ...`

| Signal | Line / pattern | Status | Source |
|---|---|---|---|
| Death | `: <Char> has been slain.` and `: <Char> has committed suicide.` | VERIFIED (multiple PoE1 tools) | https://github.com/dermow/TraXile (TrX_EventMapping.cs); https://github.com/Lailloken/Exile-UI (data/english/client.txt); https://github.com/briansd9/exile-diary |
| Level-up | `: <Char> (<Class/Ascendancy>) is now level <N>` | VERIFIED | TraXile; Exile-UI; kburke8/poe-watcher tests |
| Zone entry | `: You have entered <Area>.` plus `Generating level <N> area "<AREA_ID>" with seed <S>`, which gives the area **id and area level** | VERIFIED | TraXile; bear421/poe-map-log-viewer |
| Kitava resistance penalty (A5/A10) | `: You have been permanently weakened by Kitava's cruel affliction. You now have -30% to all Resistances.` | VERIFIED (real log sample in test code) | https://github.com/kburke8/poe-watcher (src-tauri/src/log_watcher.rs) |
| Campaign finished | `] Sin: May a new dawn arise!` | VERIFIED (as code) | TraXile |
| Lab finished | `Izaro:` death lines such as `Izaro: Triumphant at last!`, `Izaro: You are free!`, `Izaro: I die for the Empire!`, … | VERIFIED (as code) | TraXile |
| Trial of Ascendancy **completion** | **No dedicated line found.** You can infer it only from entering the trial area or from the plaque. The PoE1 leveling tool ExileQuesting says explicitly that "Client.txt does not prove completion" of labs. | VERIFIED that a PoE1 tool states this / UNVERIFIED that no such line exists | https://github.com/Stoffe101/ExileQuesting (src/core/guide-experience.ts) |
| Passive points | `: You have received a Passive Skill Point.` / `2 Passive Skill Points.` is confirmed for **PoE2**. **For PoE1 I found no evidence** of this line. PoE1 tools instead read the output of the **`/passives`** chat command, which **is** written to Client.txt: "N total Passive Skill Points (N allocated)", "N total Ascendancy Skill Points", "N Passive Skill Points from quests: (1 from The Dweller of the Deep) …". | PoE2 line VERIFIED / PoE1 absence UNVERIFIED / `/passives` VERIFIED (tool doc) | bear421 log-tracker.ts (PoE2 examples); https://github.com/Stoffe101/ExileQuesting/blob/main/docs/PASSIVES_RECONCILIATION.md |
| Passive allocation | `Successfully allocated passive skill id: X, name: Y` | VERIFIED in a mixed PoE1/PoE2 tool; PoE1 presence UNVERIFIED | bear421 log-tracker.ts |
| NPC dialogue | `] <NPC Name>: <text>` (Einhar, Alva, Niko, Trialmaster, Izaro, Sin, …). This needs **Options > (UI/Interface) > Chat > "Output Dialogue to Chat"** turned on. The setting name varies by source ("Output Dialogue To Game"). | VERIFIED as code patterns / setting UNVERIFIED (forum post plus tool README) | TraXile; https://github.com/klayveR/poe-log-monitor ; web.poecdn.com forum 3786931 |
| Other | `/whois` reply (`is a level N in the …`), `/kills`, `AFK mode is now ON`, trade accepted, party join/leave, `The Nameless Seer has appeared nearby.`, `A Reflecting Mist has manifested nearby.`, `Card drawn from the deck:` | VERIFIED (as code) | Exile-UI; TraXile; bear421 |

**NOT in Client.txt** (to the best of the evidence):
- **XP values or XP gain.** No tool parses an XP line, so XP must be inferred from level-ups. UNVERIFIED negative.
- **Quest completion events.** There is no generic "quest completed" line; use `/passives`, NPC dialogue or zone heuristics. UNVERIFIED negative.
- **Trial completion and lab ascendancy-point claim.** UNVERIFIED negative.
- **Item drops and pickups, gold, Pantheon changes, inventory, gear.**
- **Monster kills**, except `/kills` command output; boss kills only appear indirectly through boss dialogue lines.

Client.txt is in English only when the client language is English; PoE localises these lines (noted for PoE2 by the speedkalandra README; assume the same for PoE1, UNVERIFIED).
