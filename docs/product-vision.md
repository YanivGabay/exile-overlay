# Exile Overlay: product vision

Date: 2026-11-02. Question: what would make a leveler say *"I can't level without this"*?

Every fact below is labelled **[V]** (verified: game data, official patch notes, or 2+ reputable guides agree) or **[U]** (unverified: one weak source, or memory). The full sourced tables are in:

| File | Covers |
|---|---|
| [research/campaign-gear-economy.md](research/campaign-gear-economy.md) | Links, vendor recipes, flasks, currency, regex, trials, resistances |
| [research/what-levelers-rely-on.md](research/what-levelers-rely-on.md) | Habits from 15 creator guides, existing tools, 3.29 changes, poe.ninja API terms |
| [research/endgame-transition-and-log.md](research/endgame-transition-and-log.md) | Pantheon, labs, Act 10 → maps, filters, what Client.txt does and does not contain |

Sources used: official 3.29.0 patch notes, poedb (game data), poe.ninja (live API), maxroll, poe-vault, creator video chapters (Lolcohol, Tytykiller, Imexile, Pohx), GitHub repositories of other tools. poewiki and Reddit block automated access and were not used. Mobalytics returned 403, so claims from it are only search snippets and are marked [U].

---

## 0. Summary

**Guaranteed 5-link: there is no guaranteed 5-link in the 3.29 campaign.** The real league-start link plan is:
1. Buy a **Tabula Rasa** (6 linked white sockets, level 3) as soon as you can trade **[V]**.
2. Bench-craft a **guaranteed 4-link**, unlocked in Kaom's Stronghold in Act 4 (5 fusings) **[V]**.
3. Fuse a 5–6 socket body armour once you have about **150 fusings**, which is the bench's own price for a 5-link **[V cost / U odds]**.

The 5- and 6-link bench crafts only unlock in maps **[V]**. The overlay should show this as a **link plan**, with reminders at the right moments.

**What levelers need most** (ranked by how often creator guides repeat it, and what the best tools ship):
1. A gem and link plan from your build.
2. A passive-point and lab checklist.
3. Staying in the zone's XP range.
4. Movement speed and weapon upgrades through vendor recipes.
5. Warnings before dangerous moments.
6. A campaign timer.

**Proposed beta (5 features):**
1. Gem and link plan with "buy now" reminders.
2. Campaign checklist (passives, trials, labs, Kitava resistances).
3. Level and gear reminders (XP range, movement-speed boots, weapon recipe, link plan).
4. Act timer with splits against your personal best.
5. 3.30 data on day 0, plus league notes.

**Corrections to earlier docs:**
- 3.30 is called **Covens of Umbra**.
- The reveal is **Fri Nov 6, 12:30 PM PST** (Nov 7 in New Zealand).
- Launch is Nov 13 (PST), and 3.29 ends Nov 9 **[V, official forum threads 4012420, 4010618]**.
- There are no official 3.30 campaign details yet.

**New competitor I missed earlier:** **XileHUD** ([github.com/XileHUD/poe_overlay](https://github.com/XileHUD/poe_overlay), Electron, PoE1 and PoE2) has **156k release downloads**. It has a leveling module with auto zone detection, PoB integration, click-through mode and a speedrun timer with history **[V, GitHub API]**. Exile UI already has gem quests from PoB, Lilly search strings, an XP display and act splits. So these features are expected, not differentiators. **What sets us apart is accuracy, readability and setup**: a tracker that's right 99.9% of the time on real play, a readable zone card, zero calibration, and content checked automatically.

---

## 1. The 5-link question

| Way to get links | When | Reliability | Fact |
|---|---|---|---|
| **Tabula Rasa** (unique Simple Robe, 6 linked white sockets, level 3) | As soon as you can trade (Act 1–2) | Best | [V] poedb. Price late in 3.29 is 5c with 1,322 listings on poe.ninja; the day-1 price wasn't available |
| **Bench: Four Linked Sockets** (5 fusings) | After Kaom's Stronghold (Act 4) | Guaranteed 4-link | [V] poedb crafting bench |
| **Fuse a 5–6 socket item** | Whenever you have ~150 fusings | Luck; the bench charges 150 for a 5-link | Bench cost [V]; per-orb odds [U] (old community logs, GGG never published them) |
| Bench: Five / Six Linked Sockets (150 / 1,500 fusings) | **Maps only** (Plaza or Infested Valley / Grotto) | Guaranteed, but endgame | [V] costs; 5-link unlock map disputed [U] |
| Divination cards: The Chains that Bind (6-link), The Jeweller's Boon (5-link) | Drop in maps | Luck | [V] poedb drop areas |
| Mercenary duel gear (3.29) | From Act 3 | Unknown | [U] Gear can be linked; no source confirms a 5-link |
| Vendor recipes | n/a | **Don't create links**; they only turn links into currency | [V] |

**3.29 changes that matter:**
- Sockets are white by default and any gem fits any socket. Chromatic Orbs are no longer sold, and the bench R/G/B colour crafts are gone **[V, patch notes]**. Any old "chrome your 4-link to RGB" advice is now wrong.
- poe.re's coloured-link regex (`[rgb]`) no longer matches white sockets, so our search strings must use `[rgbw]` or link-only patterns **[V, poe.re source]**.

**In the overlay:** a small "Links" line in the footer from Act 1 onwards:
- From Act 1: "Plan: Tabula Rasa (trade) → bench 4-link after Kaom's Stronghold → fuse 5-link (~150 fusings)".
- After Kaom's Stronghold: "Bench 4-link now (5 fusings)".
- Vendor search text that finds 4-, 5- and 6-link items in shops, one click to copy.

When 3.30 is revealed, any new link source goes into the guides repo's league notes.

---

## 2. Ranked feature list

Ranking combines three things:
- how often top creators teach the habit (15 sources, [what-levelers-rely-on.md §1](research/what-levelers-rely-on.md));
- whether the best tools already ship it (a must-have, not a differentiator);
- whether Client.txt or a PoB import can drive it automatically (it can't be a "can't level without" feature if the user has to keep it up to date by hand).

| # | Feature | Why levelers need it (evidence) | How it shows in the overlay | Data / feasibility | Status |
|---|---|---|---|---|---|
| 1 | **Gem and link plan from PoB, with "buy now" reminders** | Creators' #5 habit ("know your gems and links per level", buy at levels 12/16/18/24/28/38) [V]. Every top tool does gem plans | Gem widget: current setup for your level, and what changed since the last setup ("new: Sunder, swap Ruthless → Melee Phys"). In a town with a gem vendor: "Buy now: X, Y (Nessa)" plus a copy-search button. 3.29: all classes can buy Faster Attacks (Nessa, after The Caged Brute) and Faster Casting (Yeena, after Sharp and Cruel) [V patch notes] | PoB skill sets and gem data (done). Level from Client.txt (done). Buy-reminder logic: new | Partial: gem steps, links widget and per-quest search text are done |
| 2 | **Campaign checklist: passive points, trials, labs** | The two most repeated habits (#1 skill-point quests in 6 sources, #2 labs after A3/A7/A10 in 7) [V]. speedrun.com has an "all points + labs" category [V] | Footer: "9 of 23 quest passives". An orange alert before you leave an act: "You skipped The Marooned Mariner (+1 passive)". Trials: "Trials 4/6 for Normal lab", then "Do Normal lab now (area level 33)" after Act 3. The 6 Normal trials (A1 Lower Prison; A2 Crypt, Chamber of Sins 2; A3 Crematorium, Catacombs, Imperial Gardens) [V] | Passive quests: done (22 quests from poedb, CI-checked in every route variant). Trials: from route steps plus zone visits (no trial-completion line exists in Client.txt [U negative]). Optional: parse `/passives` output if the player types it [V tool docs] | Passives: done. Trials and labs: new |
| 3 | **Stay in the XP range: zone level vs your level, level targets** | Habit #4 (5 sources) [V]. Targets from maxroll: level 12 after Fairgraves, 16 after Fidelitas, 18 after Weaver, 24 after Tolman, 28 after Lunaris/Piety, 32 before Kaom's Stronghold, 38 after Malachai [V] | Zone line: "Area level 14 · you are 12: fine" (green), or orange when outside the penalty-free range. A "be level 32 before Kaom's Stronghold" warning at the gate. Boss check from route hints: "Brutus: level 8 recommended, you are 6" | Level-ups from Client.txt [V]; area levels from game data; penalty formula 3 + floor(level/16) [V, long-standing]; targets in guides data | Partial: penalty check and boss check done; targets: new |
| 4 | **Movement speed and weapon reminders (vendor recipes)** | Habit #3 (movement speed, 6 sources) and #6 (weapon recipes, 6 sources) [V] | One-line reminders at the right level: "Level 12: you can make 15% movement speed boots (boots + Quicksilver + Augmentation)". Boots tiers need levels 1/12/24/32/44 [V]. "Act 2: magic Rustic Sash + Whetstone on your weapon = 40–49% phys" (rare sash 50–69% from Act 4) [V]. Casters: Chain Belt + Whetstone [V]. Each with a copy-search button for the base (poe.re patterns: MS boots `Runn`/`rint` [V]) | Recipes [V] poedb/maxroll; triggers by level and act; search strings from poe.re patterns (MIT? check the licence before reusing code; the patterns themselves are facts) | New |
| 5 | **Danger prep at the right moment** | Habit #8 (flask plan: Act 8 freeze, Act 9 bleed in the Belly of the Beast) and #9 (resists before Kitava) [V F/G guides] | Alert as you enter the zone before each danger: "Kitava next: cap your resistances; after the fight they drop 30%". Real detection: Client.txt prints "You have been permanently weakened by Kitava's cruel affliction. You now have -30% to all Resistances." [V, real log sample] | Log line [V]; danger zones in guides data | Resist warning: done (route-based). Log-detected banner and Act 8/9 prep: new |
| 6 | **Act timer with splits against your personal best** | XileHUD and Exile UI both ship it [V]. Benchmarks: world records 1:55 any% / 2:17 all points+labs (Imexile, speedrun.com); Pohx reaches Kitava ~4.6 h in 3.29; "solid" 7–8 h; new players 25 h+ [V/U] | Small timer: "Act 4 · 1:42:10 · −3:05 vs your best". Splits table in settings. Pauses on character select and in the hideout | Zone timestamps from Client.txt [V]; per-character history on disk | New (table stakes) |
| 7 | **Zone tips we write ourselves**: exits, waypoints, quest targets | Habit #11 (practice, know layouts) is disputed: one creator argues layouts are useless and heuristics matter [V]. Exile UI's best-liked feature is its layout images [V] | One line per zone, e.g. "Exit is usually opposite the entrance; follow the river". Never copied images | Needs in-game verification by us; no unlicensed sources | New: content work, ongoing |
| 8 | **Act 10 → maps checklist** | Every early-maps guide has one [U synthesis] | After "Sin: May a new dawn arise!" (log line [V]): checklist with Kirac on Karui Shores (map device) [V], Merciless lab (area level 68) [V], cap resists (−60%) [V], pantheon upgrade with a Divine Vessel [V], switch the loot filter to a mapping strictness, start the atlas tree | Log line and static checklist | New, cheap |
| 9 | **Deaths and level speed** | Requested by the coordinator; useful for racers | "3 deaths this act · 6.2 levels/hour". Client.txt has deaths ("has been slain") [V] but **no XP lines** [U negative], so we show levels per hour, not XP per hour | Log only | New, cheap |
| 10 | **Bandit, pantheon and ascendancy-order reminders from PoB** | Bandit choice is in every PoB [V]. Pantheon defaults: Brine King is the usual major god [V maxroll] | Bandit step follows the PoB's choice (done: route option). Pantheon line when it unlocks (Act 6–8 bosses [V]). "Ascendancy: take Unflinching first" from the PoB's ascendancy nodes in tree order | PoB (done for bandit); pantheon facts [V]; ascendancy order needs parsing the tree spec | Bandit: done. Rest: new |
| 11 | **Passive tree: next points from PoB** | Tree overlay is Exile UI's second most-liked feature [V pain-points] | "Next: +3 points toward Resolute Technique" between PoB specs; full tree view later | PoB tree specs (parsed); needs the tree graph (GGG skilltree-export) for "next points"; heavier | Later (phase 2) |
| 12 | **Gear checklist from PoB + one-key item check** | Coordinator idea; Exile UI's item info is popular [V] | "Looking for: +life boots, 30% move speed"; press a key over an item to check it against the list | Needs a Ctrl+C item parser (one keypress = allowed [V rules]). Big job | Later |
| 13 | **Quick price check (poe.ninja)** | Awakened PoE Trade / Exiled Exchange 2 own this space [V] | Hover + key: chaos value | poe.ninja economy API is allowed **only through our own caching backend** with a descriptive User-Agent; the builds/profiles API is **closed to third parties** [V, poe.ninja/docs/api]. No data at league start (claim [U]) | Later or never: low value against APT |
| 14 | **Loot filter switch campaign → maps** | Coordinator idea | Suggest a stricter NeverSink level at maps | NeverSink already switches from leveling to endgame at item level 68 automatically [V]; online filters auto-update [V]; in-game path Options > Game > Filters [V] | **Drop**: the filter already does it |
| 15 | **League-mechanic tips after the reveal** | Every league | Footer "League tips" (done) filled from patch notes | Guides repo, same-day update | Mechanism done; content after Nov 6 |

What we can't do (verified limits):
- No quest-completion line exists in Client.txt [U negative], so quest steps can only be inferred from zones or ticked by hand.
- No XP numbers.
- No reliable lab-completion proof beyond Izaro's death lines [V as code].
- poe.ninja build data is off-limits [V].

---

## 3. Coordinator's extra ideas: verdict

| Idea | Verdict | Why |
|---|---|---|
| Loot filter that switches campaign → maps | **Drop** | NeverSink already switches at item level 68 [V]. At most, one checklist line at maps (#8) |
| Passive tree progression per level from PoB | **Keep, phase 2** (#11) | Valued, but needs the tree graph and a renderer |
| Gear checklist from PoB + Ctrl+C check | **Keep, phase 2** (#12) | Needs the item parser; allowed (one key, one action) |
| Quick price check with poe.ninja | **Later / low** (#13) | Needs our own proxy; APT and EE2 dominate; no data on day 1 |
| Bandit, pantheon, ascendancy-order reminders | **Keep**: bandit done; pantheon in the checklist (#10) | Cheap |
| Speedrun timer with splits vs personal best | **Keep, beta** (#6) | Table stakes against XileHUD and Exile UI |
| Act 10 → early maps checklist | **Keep, beta-cheap** (#8) | Log line exists |
| Deaths and XP per hour | **Keep, as levels/hour** (#9) | No XP lines in the log |

---

## 4. Proposed beta scope (what ships Nov 13–24)

1. **Gem and link plan** (#1 + the link plan from §1): setup by level from PoB, "buy now" reminders with copy search, link plan line.
2. **Campaign checklist** (#2 + #5 + #8): passive points (done), skipped-quest alerts (done), trials and lab prompts, Kitava detection from the log, Act 8/9 prep, Act 10 → maps checklist.
3. **Level and gear reminders** (#3 + #4): XP range and level targets, movement-speed boots and weapon recipe reminders by level.
4. **Act timer with splits** (#6), plus deaths and levels/hour (#9) in the same small line.
5. **3.30 on day 0** (#15): route/data fixes and league notes from the Nov 6 reveal, shipped through the guides repo the same day.

Out of the beta: tree progression, gear checklist and item check, price check, filter switching. Zone tips are written continuously and ship as content updates.

**Effort:** items 1–4 are about 4–5 days of work on top of what exists (the engine already has the hooks: per-character levels, zone history, PoB build, campaign data). Item 5 depends on the reveal and on extracting game data on Yaniv's Windows install.

---

## 5. Open questions for Yaniv

1. Is the beta scope above right (gem/link plan, checklist, level/gear reminders, timer, 3.30 day 0)?
2. Your "guaranteed 5-link" memory: was it a specific league's mechanic or a quest reward? If you remember which, I'll check whether 3.30 brings it back. As of 3.29 there's no campaign 5-link.
3. Price check: skip it for the beta, since APT/EE2 cover it? Recommended: skip.
