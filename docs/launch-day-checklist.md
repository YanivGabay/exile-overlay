# 3.30 Covens of Umbra: launch-day checklist

Launch: **Thursday Nov 13 (PST)**. Patch notes: **Wednesday Nov 11 (NZT)**, i.e. late Nov 10 UTC.

## Status on Nov 11: patch notes are out

The [3.30.0 patch notes](https://www.pathofexile.com/forum/view-thread/4013680) were posted on Nov 11. The guide now uses them (source `patch-330`); anything only from the ExileCon reveal ([maxroll summary](https://maxroll.gg/poe/news/3-30-covens-of-umbra-reveal-summary), [PCGamesN](https://www.pcgamesn.com/path-of-exile/3-30-covens-of-umbra-exilecon-2026)) keeps the "unconfirmed" badge, and a test fails if a reveal-sourced note loses it.

| In the guide | Source | Status |
|---|---|---|
| Disrupt a Coven rite to choose a Fate for the zone boss (harder fight, better rewards) | patch notes | confirmed |
| Rites from the first zones; up to 3 Fates per boss | reveal coverage | unconfirmed (not in the notes) |
| Fate advice: only on bosses you kill easily, none on act bosses in hardcore | our advice | unconfirmed |
| Fated bosses drop Viscera for your Wickerman | patch notes | confirmed |
| Wickerman slots; campaign drops lower tiers only | reveal coverage | unconfirmed |
| Fated Brutus → arm Viscera (max life) | reveal example | unconfirmed |
| Item tiers 2-5 on magic/rare drops **from Act 6**; more sockets/links | patch notes | confirmed |
| Mercenaries: -30% resistances in area level 46-67, -60% at 68+ | patch notes | confirmed (new Act 6 tip) |
| Vendors: Wisdom scrolls 15 gold, level 34-37 gems cost Alchemy, cheaper mid-campaign gambling | patch notes | confirmed (new tip) |
| Act 7 Viridian Wildwood, Act 9 Mirage | patch notes | confirmed (new tips) |
| Changed layouts, 20+ new zone bosses | PCGamesN | unconfirmed (not in the notes) |
| 5-link drops in The Slave Pens and Act 6 Twilight Strand | 3.27/3.29 only; not in the notes | **likely gone**, check in game |
| Kitava's resistance penalty | not in the notes | unchanged |
| Scarabs gone, Threads are opt-in (maps checklist) | FAQ + reveal | Threads opt-in confirmed |

**What the patch notes don't change:** no player passive tree section (only ascendancy value changes and the Reliquarian shuffle), no gem removals or renames, no campaign quest or Nessa/Yeena/Clarissa/Siosa changes.

**Still waiting:**
- **Notables:** GGG's [skilltree-export](https://github.com/grindinggear/skilltree-export) still ends at 3.29.1 (checked Nov 11). The notes list no player notable changes; diff the export when it lands.
- **Arcane Link** (new gem: Scion reward for Breaking the Seal, also sold by Petarus and Vanja to Marauder, Duelist and Templar): `gems.json`/`quests.json` need its id and level from the 3.30 game data.
- `poe1/manifest.json` `gameVersion` stays 3.29 until the tree and gem data are 3.30.

## Patch-notes pass (done Nov 11) and what is left

Work on branch `3.30-prep` in the guides repo and `ui-ux-pass` in the app.

1. Run the patch-notes pass (the `poe-patch-notes` skill, poe-mono-repo PR #529). Grep the notes for:
   - **campaign, act, zone, area, layout, boss, quest, reward**: route steps, kill steps and passive-point quests;
   - **vendor, recipe, Nessa, Yeena, Clarissa, Siosa**: the vendor-recipe reminders, `importantRecipes` and gem buy steps;
   - **gem, support, skill** (renamed, removed or added gems): `poe1/data/gems.json` and the PoB gem matching;
   - **passive, notable, keystone, ascendancy**: tree data, plus the AWoRA plan in `docs/builds/`;
   - **Kitava, resistance, penalty**: `resistPenalties`;
   - **Labyrinth, trial**: `labs`;
   - **socket, link, fusing, tier**: the link plan and the 5-link notes;
   - **Covens, Fate, Wickerman, rite**: league tips. Turn confirmed ones `verified: true`, fix or delete the rest.
2. When GGG pushes the 3.30 tree to skilltree-export:
   - run `tools/build_tree.py`, add `poe1/tree/3_30_*.json`, and point the bundle at it;
   - diff the notable names against 3.29.1 and list the added and removed ones in the PR.
3. Set `poe1/manifest.json` `gameVersion` to `3.30` only once the data matches.
4. Run `npm run check` in the guides repo, refresh `guides-snapshot/poe1.json` in the app, and run `npm test`.
5. Ask Yaniv before merging either branch or publishing anything.

## First hour of the league (Nov 13)

Play a fresh character with the real overlay (`run-real.cmd`, ask Yaniv first) and a clean copy of the log.

**The app still works with the new client (first 5 minutes):**
- [ ] The overlay attaches to the 3.30 client; the window title is still "Path of Exile" (Diagnostics → Game window).
- [ ] Client.txt is found automatically (Diagnostics → Log file), at the same path as before.
- [ ] Log lines still parse: zone changes move the guide, "is now level" updates the level, "has been slain" counts deaths. If not, check the `parseLine` patterns in `packages/log-watcher` against the new lines.
- [ ] The first zone's area id is still `1_1_1`, and The Twilight Strand → Lioneye's Watch move the guide. Area ids changing is the biggest risk: run `scripts/validate-runs.ts` on the new log after Act 1.
- [ ] Hotkeys register (Diagnostics → Hotkeys not registered: none).

**Guide content vs. the real game (Acts 1-2):**
- [ ] Where the first Coven rite appears, and what disrupting it looks like. Write it into the Act 1 tip and mark it verified.
- [ ] How Fates are put on a boss (Hillock? Brutus?), and where the Wickerman is (town or hideout).
- [ ] Brutus's Fated drop (Warden's Arm or not).
- [ ] Zone layouts: where the "layouts changed" note is true, note which zones; the zone tips with `confidence: low` are the first to check.
- [ ] New bosses in zones that had none: do they change any `{kill|…}` step or block an exit?
- [ ] Vendor recipes still give movement speed boots and +1 wands; Nessa's gem list matches the "Gems you can buy now" panel.
- [ ] The vendor search strings still fit the search box (copy one, paste it, check the highlights).

**Later on day 1 (Act 5-6, often the same evening):**
- [ ] The Slave Pens and the Act 6 Twilight Strand: is there a 5-link source? If not, delete the `5l-*` notes and the FIVE_LINK steps (or keep them off by default). If yes, mark them verified.
- [ ] Kitava's resistance penalty in Acts 5 and 10 (`resistPenalties`).
- [ ] Any crash: Diagnostics → Copy report, then the app log.

## Shipping a fix on launch day

Guide-only fixes ship without an app release: push to the guides repo's `main` (CI builds the bundle, and the app re-checks every 30 minutes). This only reaches players once the guides repo is public, and both pushing to `main` and going public need Yaniv's OK. Anything in the app (log parsing, area ids in code) needs an app build: follow [release-checklist.md](release-checklist.md).
