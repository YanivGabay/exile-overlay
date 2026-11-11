# Exile UI leveling guide: where it comes from, how often it's updated, and how good it is

Research date: 2026-11-02. This was read-only research; nothing was posted.

Sources:
- GitHub API commit and release history of `Lailloken/Exile-UI`. The local clone is shallow (1 commit), so all history comes from `gh api`. The raw tables are in `scratchpad/prov/c_*.tsv`, and issue excerpts are in `scratchpad/prov/issues.txt`.
- The bundled files in `src/Exile-UI/`.

**Reddit could not be read.** reddit.com is blocked for WebFetch. I did not use mirrors. Reddit-only claims below are marked as second-hand.

This builds on `exile-ui-features.md` §3 and `exile-leveling.md` §4–5 and does not repeat them.

---

## 0. Verdict on "the guide is implemented through a different GitHub project"

**This was true until March 2025. It is no longer true.**

**Before 2025-03-21: an external project supplied the content.**
- The PoE1 route came from **HeartofPhos/exile-leveling**. Users built a route on the web app, then pasted its "3rd-party export" into Exile UI (EUI#38/#136/#186/#274/#286).
- Exile UI only rendered that route.
- Its quest and gem data was a straight copy of exile-leveling's seeded JSON. Commits `aa9be552` (2024-03-31, "updated exile-leveling JSONs") and `1e8e6629` (2024-08-17, "exile-leveling update") match exile-leveling's own 2024-08-17 "seed data" commit.

**v1.57.3 (released 2025-03-21) forked everything into the Exile UI repo.** The release notes say:

> "the PoE1 Act-Tracker no longer requires Exile-Leveling guide imports … PoB and routing features from Exile-Leveling have been integrated into this tool … the default guide was derived from Exile-Leveling … to have more control over how guides are displayed in an in-game overlay"

The maintainer's PSA (EUI#579, 2025-06-07) adds: "the default PoE1 guide is still about 90% the same."

**Today, everything is written and maintained by one person (Lailloken) inside `Lailloken/Exile-UI` (MIT, 1,379 stars, pushed 2026-10-20):**
- the route text;
- the gem, quest and area databases;
- the hint images and layout images;
- the renderer, which is AutoHotkey: `modules/leveling tracker.ahk` and `modules/act-decoder.ahk`.

**The only "other place" is two orphan branches of the same repo.** `layouts` and `layouts_2` were split off on 2026-06-26 (`99d46b82`, `29946500`; "prep: exclude layouts from releases, download as separate package"). The app downloads them at runtime from `raw.githubusercontent.com/Lailloken/Exile-UI/refs/heads/layouts[_2]` (`modules/act-decoder.ahk:122`).

**External projects are upstream sources of content, not code. All of it was transcribed or redrawn by hand, with no automated sync:**
- exile-leveling: the PoE1 route skeleton and data;
- CyclonDefinitiv: PoE1 route optimisations, hints, and the PoE1 layout knowledge;
- u/xebtria's Google Sheet: the PoE2 route skeleton;
- Mobalytics' "Campaign Codex Project": the PoE2 layouts;
- Engineering Eternity: the 2023 PoE1 layout diagrams.

So the user's complaint is really about Lailloken's hand-maintained fork. It is not about exile-leveling, which has since moved on independently: it added auto-progress, maxroll import and the Allflame route in July 2026.

---

## 1. Provenance of each artifact

| Artifact (path in `Lailloken/Exile-UI`) | What it is | Origin (evidence) | First / last commit | Commits |
|---|---|---|---|---|
| `data/english/[leveltracker] default guide.json` (PoE1, 44 KB) | 10 acts, **228 pages, 629 lines** in Exile UI's token markup | **Forked from exile-leveling's route** (`common/data/routes/act-*.txt`). First commit `d4a78898` 2025-03-12, "Placeholder PoE1 default guide", v1–v4 through 2025-03-19. Rewritten 2025-10-25/26 (`1dbcf3c5`, `cf695d0d`; release v1.60.1 says "added many new hints based on CyclonDefinitiv's guide" and "implemented the Hidden Underbelly route"). v1.58.5 (2025-06-12) added hints from "Cyclon's advanced campaign guide" (a Google Doc: `docs.google.com/document/d/1dYpg8IsPw3vLJnKZhezq7vK4JOTk_tWN8ln6RkbH9yc`). The lineage is still visible in the wording: exile-leveling "Little streams connect the 3 Rhoa nests" → EUI "follow streams for (img:quest) (quest:3_glyphs)"; exile-leveling "Look for 2 pillars near {waypoint}" → EUI "(hint)__ follow path between 2 pillars" | 2025-03-12 → 2026-08-03 (`b235bd2e`) | 58 |
| `… default guide 2.json` (PoE2, 32 KB) | 7 "acts" (A1–4 plus interludes), 136 pages | **Derived from u/xebtria's PoE2 "campaign walkthrough" Google Sheet.** Release v1.56.4 (2025-01-17): "a default guide I created based on u/xebtria's reddit post" (reddit.com/r/PathOfExile2/comments/1hy70wg). The sheet is public, with zone / order / steps / notes / rewards columns: `docs.google.com/spreadsheets/d/17D5MKBapwQvYm4hmgvGTReQHdOWHzdrj-RgLPB8P09A`. Path history: first `data/global/default guide 2.txt` (`8519ef6a` 2025-01-14), then `data/english/[leveltracker] default guide 2.txt` (`c769edcd` 2025-01-22), then `.json` (`26d8aa4b` 2025-03-12). Major rewrites: `e160101e` (0.3, 2025-08-14), `e754bfc6` (0.4, 2025-11-27), `ee77b23b`…`0ac14e14` (0.5, 2026-05). Since about 0.4 it has diverged heavily from xebtria; the help text still says "acts 1-3 originally derived from u/xebtria's quick-guide" (`help tooltips.json:597`) | 2025-01-14 → 2026-09-03 (`bf478eb6`) | 62 + 7 (txt era) |
| `[leveltracker] gems.json` (PoE1, 149 KB, 470 gems plus `_quests`) | Per gem: `attribute`, `level`, and `quests: {quest: {quest:[classes], vendor:[classes]}}` | **Originally a copy of exile-leveling's `quests.json` and `gems.json`.** exile-leveling seeds those from GGG `.dat` files plus poewiki Cargo vendor data (see `exile-leveling.md` §2.2). It was restructured into Exile UI's own shape in `61f48c30` (2025-03-18, +9,506/−3,772), and since then has been **hand-edited per league**. Commit messages show manual fixes: "fixed a typo" `1cd16b58`, "fixed a typo in the PoE1 gem DB" `3410e8ae`, "fixed momentum and precision for Scion" `714e5801`, "fixed incorrect gem-rewards for elemental proliferation" `57e3ab6b`. The maintainer, on EUI#721: "I derived my databases from exile-leveling when I 'ported over' its functionality… Momentum is still listed as purchasable after Hillock on both the wiki and poedb". **There is no generator script in the repo** | 2023-12-06 move (`0f1950be`, from older paths) → 2026-07-24 | 23 |
| `[leveltracker] gems 2.json` (PoE2, 26 KB) | `{skill|spirit|support: {name: [req-level-ish, attribute]}}` | Hand-built: "Restructured PoE2 gem DB" `84b0a3ec` (2025-03-19), "Updated gem DB" `92af6b8d`, "0.4 updates" `d7a12ac5`. **Not touched since 2025-12-16**, so it was not updated for 0.5 (2026-05-29). I did not verify whether 0.5 changed any gem values | 2025-03-19 → 2025-12-16 | 9 |
| `[leveltracker] areas.json` (PoE1) | `[[{id, lvl, name}]]` per act | Originally exile-leveling's `areas.json` (GGG `WorldAreas` ids). Restructured `8764a21a` (2025-03-13); `e0b4a758` "Fix mapnames in DB" | 2023-12-06 → 2026-01-21 | 9 |
| `[leveltracker] areas 2.json` (PoE2) | `{id, name, recommendation:"min | max"}` | Hand-built (`492dcd55` 2025-01-14 "added act-tracker areaIDs"). The level recommendations are hand-tuned (`0b054e59`, `5f3185dd`) | 2025-01-14 → 2026-09-02 | 17 |
| `img/GUI/leveling tracker/hints/*.jpg` (26) and `hints 2/*.jpg` (16) | Annotated in-game screenshots (for example `hidden_grate.jpg`: a crane and grate with arrows) | **Self-made by Lailloken.** These are in-game captures with his own annotations; no third-party credit. The hint *ideas* often come from exile-leveling and Cyclon (see `671b358a` 2025-10-25, "updated/added hint images", the same day as the Cyclon-based rewrite) | 2025-03 → 2026-06 | — |
| **PoE1 zone layouts**, branch `layouts`, `zones/*.jpg` (468 files: `<areaid> N.jpg` is the clue thumbnail, `<areaid> N_M.jpg` the full layout) | Black background, white minimap-outline traces, purple entrance square, yellow targets | **Two generations:** (a) **2023** (`4c78c156`/`1f4adb53`/`5806e17f`/`6421745b`, 2023-07-30, "Add files via upload", 194 PNGs in `img/GUI/leveling tracker/zones/`). These are **Engineering Eternity–style diagrams**: a grey background with green path lines, a blue waypoint and a white entrance. They are visually identical to the images in JusKillmeQik/PoE-Leveling-Guide (whose README credits "_Treb/ Engineering Eternity – zone layout images"), and Lailloken mentioned qik's images in EUI#237. **No credit was given in Exile UI.** (b) **2025-06** "restructured / added more PoE1 act-decoder layouts" (`a631d6e7`, `1253112b`, `9f83bb7a`): **redrawn from minimap traces by Lailloken**, with an icon legend (`explanation.jpg`: point of interest, suggested order, alt location, minimap clues, boss). The settings credits for Act-Decoder PoE1 (`modules/settings menu.ahk:127-133`) say ">> CyclonDefinitiv's layout guide [definitivguide.com]" and ">> lailloken (compilation && editing)". So the knowledge comes from Cyclon and the drawings are Lailloken's | 2023-07-30 → split 2026-06-26 (`99d46b82`) | — |
| **PoE2 zone layouts**, branch `layouts_2`, `zones 2/*.jpg` (337 files) | Same style | Release v1.57.5 (2025-04-04): "added the zone layouts from the **Campaign Codex Project**" (Mobalytics `mobalytics.gg/poe-2/guides/campaign-layout-act-1`). The settings credits say ">> poe 2 campaign codex discord". Added `16c7e00b` 2025-04-04, then re-done for the "act-decoder" in `2c8eba53`…`242fb403` (2025-05). The wiki warns: "PoE2 league-launches sometimes introduce new layouts" | 2025-04-04 → 2026-06-26 (`29946500`) | — |
| Passive-tree JSON `data/global/[leveltracker] tree*.json` | Built by Lailloken from GGG exports. Missing versions are downloaded from `main` or `dev` at runtime (`leveling tracker.ahk:2796`) | — | — | — |

### External projects checked

| Project | What Exile UI took | License | Maintainer | Last update | Stars |
|---|---|---|---|---|---|
| **HeartofPhos/exile-leveling** (web app plus DSL route; heartofphos.github.io/exile-leveling) | PoE1 route skeleton, gems/quests/areas data, PoB-import ideas | MIT | HeartofPhos (solo) | pushed 2026-08-02 (`b7b2dd0e`; `eb9aa717` "Allflame route update" 2026-07-24) | 218 |
| **CyclonDefinitiv**: definitivguide.com (Docusaurus on GitHub Pages: `server: GitHub.com`, but **no public repo found**) plus "advanced campaign guide" Google Doc | PoE1 route optimisations and hints (v1.58.5, v1.60.1); PoE1 layout knowledge (Act-Decoder credits) | **None stated.** "Copyright © 2026 CyclonDefinitiv". Per-zone pages (e.g. `/docs/PoE1/Act 1/Lower Prison`) carry labelled layout screenshots and a "Zone Read" text explaining how to recognise variants and when to relog | Cyclon (Patreon / YouTube / Twitch) | Site references the 3.28 launch; © 2026 | n/a |
| **u/xebtria, "PoE2 campaign walkthrough"** (Reddit post 2025-01-10 linking a public Google Sheet) | PoE2 route skeleton (v1.56.4) | None stated | xebtria. The sheet reportedly gained a "change history" tab (second-hand via search snippet; **I could not read Reddit**) | unknown | n/a |
| **Campaign Codex Project** (Mobalytics PoE2 layout guides plus a Discord) | PoE2 layouts (v1.57.5) | Mobalytics content, not open | community / Mobalytics | n/a (Mobalytics returned 403 to fetch) | n/a |
| **JusKillmeQik/PoE-Leveling-Guide** (AHK overlay; zone notes plus EE layout images) | Indirect: the 2023 layout images are the same EE style; the "map pathing images (ala qik)" request was EUI#237 | MIT (images credited to Engineering Eternity) | JusKillmeQik | pushed 2024-07-25 (3.25 builds); dormant | 386 |
| Engineering Eternity (Treb), PoE1 layout videos and a Google Doc | Original source of the 2023 diagram images | not stated | — | old | — |

---

## 2. Update cadence per league

Launch dates:
- PoE1: 3.25 2024-07-26; 3.26 2025-06-13; 3.27 2025-10-31; 3.28 Mirage 2026-03-06 (poewiki/mobalytics); 3.29 2026-07-24 (GGG announcement, via search).
- PoE2: 0.1 2024-12-06; 0.2 2025-04-04; 0.3 2025-08-29; 0.4 2025-12-12; 0.5 2026-05-29; 0.5.5 2026-09-04.

Offsets are in days relative to launch.

| League | Guide/route commits | Gem-DB commits | Notes |
|---|---|---|---|
| 3.25 (still imported from exile-leveling) | — | +0 `072d9b33` "act-tracker JSONs"; **+22** `1e8e6629` "exile-leveling update" | The data lag was inherited from upstream |
| 3.26 | −1 `3029523a`, +0 `5828cc8b` | −1 `0f3cb096` "3.26 initial support" | Focused Channeling (new 3.26 gem) was misspelt "focused chanelling", so it **never showed up until fixed 2026-07-13** (EUI#795, `3410e8ae`): **about 13 months** |
| 3.27 | −6/−5 full rewrite (`1dbcf3c5`, `cf695d0d`); +1 wrong A10 NPC (`a2e4fd5f`, EUI#695); +3, +10, +19 tweaks | −5 act mismatch for "breaking the seal" (EUI#665); +0 `aad88ac0`; **+3** level requirements `1cd16b58`; **+49** Scion momentum/precision `714e5801` (EUI#721, reported +47) | Good pre-launch work, then a trickle of user-reported fixes |
| 3.28 Mirage | −4…−2 tweaks; +9 removed 5L optionals ("didn't carry over from Keepers"); +17 new A1 Dweller route | +0 "preliminary"; **+9** "updated 3.28 gem information" `e3abfded`; +17 removed renamed gems; **+111** "updated some 3.28 gem info" `8bab2733` | exile-leveling upstream only shipped "3.28 gems" on 2026-05-05 (**+60**), so EUI now beats its own upstream |
| 3.29 | −8, −4, −3 prep; +0 "A1 route changes based on pre-release info"; +3; **+10** "allflame only required on league-start" | −2 `b82988ef` "updated gem-rewards"; +0 fixed elemental proliferation (Templar) | Fixes on launch day are typical |
| PoE2 0.1 | Guide first shipped **+39** (`8519ef6a`, 2025-01-14; release v1.56.4 2025-01-17) | — | Built from xebtria's sheet a month after the EA launch |
| PoE2 0.2 | −20…−9 "final-ish"; +8 "0.2.0e guide changes"; **+32** "PoE2 guide overhaul" | +3, +6 | — |
| PoE2 0.3 (new act structure) | −15 rewrite; −4 "provisional"; **+4/+5** "initial A4 and interludes support (**drafted as I played**)" | −6, +5 | EUI#646 (launch +2): "there is no support for post-A3 content yet" |
| PoE2 0.4 | −15 "major rewrite"; −1 burst; +3 "finalized A4"; +9, +26, +34, +39 | +4 `d7a12ac5` | — |
| PoE2 0.5 (A1 reorder) | −9…−1 pre-launch; +3 "updated area-ID for A2 Dreadnought" (tracking break); **+11** "added Aldur quest-line"; +45 fixed missing optional/league-start tags | **none** | `gems 2.json` is stale since 0.4 |
| PoE2 0.5.5 | −2 `0f557c39` "guide updates for 0.5.5 event" | — | — |

### Delivery lag on top of commit lag

A guide update reaches a user **only after they reset the guide slot**. `Leveltracker_ProgressReset()` reloads the default guide only `If !(…info.custom)` (`leveling tracker.ahk:3320`). The changelog repeats "these updates will be applied the next time you reset your guide slot" (`data/changelog.json:14,61`).

A user who **edited** the guide with the built-in editor never receives fixes. They must click "load default guide" in the editor (release v1.60.1), which throws away their edits. There is no merge or diff.

### Issues about guide accuracy (Exile UI)

| Issue | Problem | Fix |
|---|---|---|
| #646 | PoE2 0.3: Act 4 not supported at launch | +4d |
| #665 | Golem gems shown under the wrong act | +1d |
| #666 | Suboptimal A3 order; maintainer: "the route was largely based off of exile-leveling… to avoid exp-loss" | — |
| #695 | Wrong NPC in A10 ("classic lapse of concentration") | — |
| #721 | Scion gem availability inherited from wrong wiki/poedb data | — |
| #728 | User thought A8 was "bugged"; it was the new Hidden Underbelly route, which was unclear | — |
| #747 | Multi-level areas break tracking | — |
| #766 | New zones not tracked; actually a GFN limitation | — |
| #795 | Gem typo, a 13-month-old bug | — |
| #818 | "Hidden Underbelly" grate is hard to find; user wants a toggle | Maintainer: "Every time a campaign guide/tool is showcased on Reddit, one of the first questions is whether that route is included" (second-hand Reddit sentiment) |
| #833 (open) | Can't schedule gem buys before they're needed | Maintainer: "would require quite a bit of work" |

Import churn: #136/#186/#274/#286 (2022–23 exile-leveling export breakage) and #575/#579/#690/#751 (2025–26 confusion after exile-leveling import was dropped).

exile-leveling's own accuracy issues (EL#59/#65/#73/#83/#87, wrong vendor/quest gems because wiki data lags; EL#91–#101, route fixes) are covered in `exile-leveling.md` §5.

---

## 3. Critique as a guide

### Readability

The format is a page of 2–5 terse lowercase lines in a home-grown markup.

**Underscores stand in for spaces, and these tokens are written into the shipped text itself:**
- `"kill the_bloated_miller"`
- `"break the (color:cc99ff)3_runic_seals"`
- `"(hint)_ - (color:red)0.5.5_event_may_have_diff_league_rewards"`
- `"(color:ff00ff)buy_gems in (img:hideout) (color:fec076)your_hideout"`

**Directions are compass-icon indices.** The reader must know what `(img:6)` looks like:
- `"follow (img:6) side of wall"`
- `"(hint)__ see a ledge? follow (img:2) side"`
- `"(hint)__ (img:6) / (img:1) before (color:cc99ff)bridge, rarely (img:3)"`
- `"(hint)__ follow (img:6) edge. if it doesn't", "(hint)__ go further (img:6) or (img:4), go (img:1)"`

That last example is a sentence split across two hint lines.

**Area ids sit inside the text, with a `;;` display comment.** For example, `"enter areaid1_1_2 ;; the coast"`. The renderer hides the id, but anyone editing has to work in ids.

**Dense jargon and inline options:**
- `"(color:ff00ff)safe: set (img:portal) near (color:cc99ff)bridge or (img:arena)", "(color:ff00ff)fast: enter areaid1_1_4_0 ;; flooded depths"`, two strategies on one page.
- `"optional: ward rune: (color:cc99ff)league || (img:skill) arena:bramble"` and `"(img:quest_2) renly: (img:skill) || enter areaidg1_2"`: `||` packs two steps into one line.

**Meaning carried by colour.** The page uses 144 `(color:)` tokens with no legend in the text: magenta for "choice", lilac for a landmark, red for a boss or warning, teal for "hold TAB for picture".

**Paging is implicit.** A page advances when you enter the *last* `areaid` on it. The "next" target is therefore invisible as a concept. Pages that mention a zone only as an orientation landmark get greyed (v1.57.3), which adds yet another visual code.

**Gem steps are not in the text.** They are injected at runtime from `gems.json` plus the PoB (EUI#579: "these aren't included in the guide-text because they are handled dynamically"). The editor therefore can't show or move them (#833).

**Positive points:**
- It is compact: about 2.8 lines per page, 629 lines for 10 acts.
- It is tuned for a small overlay.
- It is heavily iconised: 521 `(img:)` tokens.
- There are hint pictures on teal text.

### Accuracy and process

**No validation.** exile-leveling's parser simulates game state (connectivity, waypoints, portals). Exile UI's JSON is hand-edited with no checker. As a result:
- typos silently disable gems (#795);
- act numbers drift (#665);
- area ids go stale after GGG renames (`80294f50` "updated area-ID for A2 Dreadnought", which broke auto-advance).

**Gem data is copied, not generated.** The original copy came from exile-leveling (dat files plus poewiki). Since 2025-03 it is patched by hand from wiki/poedb and user reports, so its errors are those sources' errors plus transcription errors.

**One maintainer for everything** (overlay, 20+ features, both games). Commit messages show a test-by-playing workflow: "PoE1 guide: final (!) tweaks", then "final (?) tweaks"; "drafted as I played".

**The route does follow speedrun knowledge**, through Cyclon:
- Hidden Underbelly in A8;
- Yugul killed in A8;
- the A1 Dweller shortcut;
- logout-to-town ("relog") steps;
- library only if the build needs it (`14b6cf28`);
- skipping hand-ins with no reward (`1440d64b`).

The weaknesses:
- These are **single-route** choices. There is no "old/simple route" toggle (#818).
- Choices are expressed by stacking "safe:/fast:" on one page.

### Customization

**What exists:**
- 9 slots;
- league-start, bandit, optionals, gem-quests and "all gem quests" toggles;
- a full in-app editor;
- clipboard JSON import/export.

**What's missing:**
- merging upstream fixes into an edited guide;
- a per-step "done" state (only page-level progress);
- non-linear or branch-aware tracking;
- sharing by URL or a catalog;
- localisation of route text (gem names have experimental localisation, `2da621a5`).

### PoE2 coverage

PoE2 has better coverage than any open alternative:
- campaign A1–4 plus 3 interludes;
- optionals and league rewards;
- level recommendations;
- 337 layout images;
- a gem-cutting regex.

Its weaknesses:
- It lagged each act restructure by about 4–11 days.
- The gem DB is stale since 0.4.
- PoE2 1.0 is reportedly set for 2026-12-11, and it will likely need another rewrite.

---

## 4. Alternatives (what people use, how each is built, what it does better)

*Reddit was not readable, so preference signals are second-hand. Stars are from the GitHub API on 2026-11-02.*

| Tool / guide | Game | How it's built | Better than Exile UI at | Weak at |
|---|---|---|---|---|
| **exile-leveling** (HeartofPhos) | PoE1 | React web app; route DSL with `#ifdef`; data seeded from GGG `.dat` plus poewiki; MIT, 218★ | Validated route model; readable full sentences ("Find and kill Hillock ➞ Lioneye's Watch"); per-step check-off; maxroll and pobb.in import; Jul-2026 auto-progress via `exile-log-api` | Not an overlay; no PoE2; gem data lags (3.28 gems at +60d) |
| **CyclonDefinitiv**: definitivguide.com plus advanced campaign Google Doc | PoE1 (+ PoE2 layouts) | Docusaurus on GitHub Pages; per-zone pages with layout screenshots plus a "Zone Read" decision procedure | The **teaching** of layout reading ("check NE path first; dead end ⇒ variant X; relog if…"); the de-facto speedrun route source | Static website, not tracked; no license |
| **Maxroll campaign guides** (`maxroll.gg/poe/getting-started/campaign-guide`, `maxroll.gg/poe2/getting-started/path-of-exile-2-campaign-guide`) plus per-build leveling sections | Both | Editorial CMS | Polished prose and pictures; build-specific leveling | PoE2 page last updated 2024-12-11 per search snippet; no overlay |
| **Mobalytics Campaign Codex** (PoE2 act layout guides) | PoE2 | Editorial plus community Discord | Source of PoE2 layouts | Web only (and Mobalytics desktop app) |
| **poe2wiki quick guide** (u/youGottaBeKiddink, per PoE Vault) and **xebtria's Sheet** | PoE2 | Wiki page / Google Sheet table: zone, order, step, note, reward | Plain-English checklist; "if not mentioned, you don't have to do it" | Not tracked; manual |
| **JusKillmeQik/PoE-Leveling-Guide** | PoE1 | AHK; Client.txt zone detection; per-act `notes.txt`/`guide.txt` per build; EE layout images; MIT, 386★ | Per-build notes per zone; layout images shown automatically | Dormant since 2024-07 |
| **Kami-Guru/path-of-levelling-2** | PoE2 | Electron/TS, MIT, 43★, pushed 2026-05-28 | Per-build act and zone notes; **gem setups that change by level breakpoints**; level diff / exp modifier; movable elements | Electron hotkey limits; small team |
| **Vyary/qutm** ("Quest Tracker Improved") | PoE2 | Tauri/TS, Apache-2.0, 5★, active 2026-10-30 | Zone guide plus a "layout widget" of points of interest; cross-platform builds; explicitly Client.txt-only (ToS) | New, small |
| **Kazte/path-of-levelling** → **mkj777/poe-leveling-app** | PoE1 | TS (Tauri+React fork), MIT | Renders **exile-leveling exports** in-game, i.e. "exile-leveling as an overlay" | Tiny; depends on the upstream export format |
| **karakasis/Path-of-Leveling** | PoE1 | Java, MIT, 74★, 2022 | Gem/level planner plus XP tracking | Dead |

### What the better ones do that Exile UI doesn't
1. **Full-sentence steps with a separate structured layer.** exile-leveling's DSL `{enter|1_1_2} #The Coast`, versus prose written with underscore tokens.
2. **Validation and seeded data.** The route is simulated against the area graph, and gems/quests come from game files rather than hand-patched JSON.
3. **Layout reading taught as a procedure** (Cyclon's "Zone Read"), rather than an image you have to match.
4. **Level-gated gem setups** (path-of-levelling-2) instead of only "buy gem X at quest Y".
5. **Separating "route" from "user notes"**, so upstream fixes don't clobber edits (qik's per-build `notes.txt` sits next to the route).

Takeaways for our design:
- Keep the Client.txt `areaid` contract.
- Author the route in a validated DSL, as exile-leveling does.
- Ship content separately from the app, with versioned hot-updates, because Exile UI already does this for layouts.
- Merge user overrides as patches over the default route.
- Generate gem and quest data from game files (dat) for both games.
- Make variant routes (fast vs. simple) first-class toggles.

---

## Sources
- Commit lists: `gh api 'repos/Lailloken/Exile-UI/commits?path=data/english/%5Bleveltracker%5D%20…'` (saved in `scratchpad/prov/c_*.tsv`).
- Releases: v1.56.4, v1.57.3, v1.57.5, v1.58.5 and v1.60.1 at github.com/Lailloken/Exile-UI/releases.
- Issues: github.com/Lailloken/Exile-UI/issues/{237,579,646,665,666,695,721,728,795,818,833}.
- Search snippets for league dates:
  - [3.29 date](https://seasontimer.live/blog/path-of-exile-3-29-release-date/)
  - [Mirage 3.28](https://www.poewiki.net/wiki/Mirage_League)
  - [PoE2 0.5](https://www.thefpsreview.com/?p=150357)
  - [0.5.5](https://www.mmobomb.com/news/grinding-gear-games-reveals-upcoming-path-of-exile-2-0-5-5-update)
- [definitivguide.com](https://www.definitivguide.com/)
- [PoE Vault article on the PoE2 quick guide](https://www.poe-vault.com/poe2/news/the-fastest-path-through-poe2s-campaign-players-think-so)
- [Maxroll PoE1 campaign guide](https://maxroll.gg/poe/getting-started/campaign-guide) and [Maxroll PoE2 campaign guide](https://maxroll.gg/poe2/getting-started/path-of-exile-2-campaign-guide)
- [Engineering Eternity–based layout doc](https://docs.google.com/document/d/1sExA-AnTbroJ-HN2neZiij5G4X9u2ENlC7m_zf1tqP8/mobilebasic)
- [Mobalytics PoE2 act 1 layouts](https://mobalytics.gg/poe-2/guides/campaign-layout-act-1)
