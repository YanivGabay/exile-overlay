# Exile Overlay: research report

Date: 2026-11-02. Status: research only, no app code.
Goal: build a PoE overlay that beats **Exile UI** + **exile-leveling**, mainly on **setup** and **customization**.

Revision 3: corrections from later research. 3.30 is named "Covens of Umbra"; the reveal is Fri Nov 6, 12:30 PM PST (not Nov 7–8); launch Nov 13 PST. A competitor missing below, XileHUD (156k downloads), is covered in [product-vision.md](product-vision.md).

Revision 2 (same day): added the leveling-guide provenance and critique (§2.3), and a plan for building a better guide (§6.2). The stack stays Electron: Yaniv considered Tauri/Rust and chose Electron.

Detailed evidence, with file:line and issue citations, is in five appendices:

| Appendix | Contents |
|---|---|
| [research/exile-ui-features.md](research/exile-ui-features.md) | Every Exile UI module, cross-cutting mechanics, the leveling tracker in depth, setup friction found in the code |
| [research/exile-leveling.md](research/exile-leveling.md) | Web app features, route DSL, data pipeline, PoB import, Exile UI integration history, what is reusable |
| [research/pain-points.md](research/pain-points.md) | 43 pain points with about 400 GitHub issue links, loved features, unmet wishes |
| [research/rules-tech.md](research/rules-tech.md) | GGG rules with primary sources, comparison of existing overlay stacks, framework comparison |
| [research/guide-provenance.md](research/guide-provenance.md) | Where every piece of Exile UI's leveling guide comes from (with commits), update lag per league, readability and accuracy critique, alternative guides and trackers |

---

## 0. TL;DR

1. **Both projects are MIT.** We may reuse code if we keep their copyright notices. The most valuable piece is exile-leveling's `common/` package: a pure-TS route DSL, a parser that simulates game state and validates routes, and seeded quest, gem and area data.
2. **Exile UI is powerful but hard to set up.**
   - Users must install AutoHotkey v1.1 (64-bit, not v2).
   - It accepts only 9 whitelisted resolutions, and it resizes the game window itself.
   - Every non-item feature needs hand-calibrated pixel or image "screen-checks", which break with HDR, Vulkan, patches or a resolution change.
   - Many fixes mean hand-editing INI files.
   - These problems account for most of its ~450 issues.
3. **What players love** is the auto-advancing act tracker with the PoB gem and tree overlay, a light footprint, one context-sensitive key, and editable routes. **The unmet gaps:** exile-leveling won't support PoE2 or run in game, and Exile UI dropped exile-leveling imports.
4. **GGG rules.**
   - Allowed: an out-of-process overlay that reads Client.txt and sends one Ctrl+C per user keypress (the pattern Awakened PoE Trade, Exiled Exchange 2 and Exile UI have used for years).
   - Forbidden: memory reading, injection, timers or sequences, and input triggered by screen reading.
   - GGG never approves any specific tool.
   - New OAuth app registrations are currently closed.
5. **Stack (decided): Electron + `electron-overlay-window` + `uiohook-napi`, with a React UI.** This is the proven Awakened PoE Trade stack and it gives full reuse of poetools.dev TS/React code. Tauri v2 was considered (smaller installer) and set aside.
6. **The guide itself.** Since v1.57.3 (2025-03-21), Exile UI's leveling guide is **no longer an external project**. Lailloken hand-maintains a fork inside the Exile UI repo, roughly "90% the same" as the exile-leveling route, with CyclonDefinitiv's speedrun tweaks for PoE1 and u/xebtria's sheet as the base for PoE2. Its weaknesses:
   - terse markup that is hard to read (`kill the_bloated_miller`, `follow (img:6) side of wall`);
   - no validation, and hand-patched gem data (one typo hid a gem for 13 months);
   - fixes only reach users who reset their guide, and anyone who edited it gets none;
   - a single route with no variants.

   **Our edge:** a validated route language, gem/quest data generated from game files, readable steps, variant toggles, and user edits stored as patches so upstream fixes still merge (§6.2).
7. **MVP for 3.30 (Nov 13, 11 days away):** a PoE1 leveling overlay only. It has zero-config setup, a drag-and-drop layout edit mode, per-character profiles, a readable route rendered from a validated format, and PoB import. It needs no screen-checks. Treat it as a public beta in week 1 of the league. Item info, map info and PoE2 come later.

---

## 1. Licenses

| Repo | License | Implication |
|---|---|---|
| Lailloken/Exile-UI (1,379★, last push 2026-10-20) | MIT (© 2022 Lailloken) | The repo is MIT, but **not all of its content is safely reusable**. **OK with attribution:** Lailloken's own route text, hint screenshots and the 2025 PoE1 layout redraws. **Avoid:** the PoE2 layouts, which come from Mobalytics' "Campaign Codex Project" (not open content); the 2023 PoE1 layout images, which are Engineering Eternity–style and uncredited; and CyclonDefinitiv-derived knowledge, whose source states no license (credit it at minimum). Its AHK code is of little direct use to a TS app. |
| heartofphos/exile-leveling (218★, last push 2026-08-02) | MIT (© 2025 HeartofPhos) | `common/` (DSL, parser, gem logic, data) and `seeding/` (built from GGG game-file exports via heartofphos/exile-export, the poewiki API and GGG skilltree-export) can be vendored or forked. The companion `exile-log-api` (Rust) is MIT too. |

Action: keep a `THIRD_PARTY_NOTICES` file and credit both authors in the About screen. Also consider reaching out to HeartofPhos, who has said they won't do PoE2 or in-game tools ([EL#104](https://github.com/HeartofPhos/exile-leveling/issues/104)). *Contacting them is Yaniv's call.*

---

## 2. Feature map

### 2.1 Exile UI modules (condensed; full table in the appendix)

Abbreviations: OK = omni-key (CapsLock by default), WK = widget-key (TAB held), SC = a screen-check the user must calibrate, log = Client.txt, clip = Ctrl+C item text.

| Module | What it does | Game | Trigger | Data source | Setup cost |
|---|---|---|---|---|---|
| **Act-Tracker (leveling)** | Step-by-step guide that advances on zone entry; act timer with CSV export; XP-penalty indicator; PoB gem links, passive-tree overlay, Lilly/vendor search strings; gear tracker | both | auto (log) and `<`/`>` buttons | log `Generating level … area "<id>"`, level-ups; PoB from clipboard; bundled guide JSON | low (the tree overlay needs the `skilltree` SC) |
| Act-Decoder | Campaign zone-layout images matched to the minimap by eye | both | hold WK | log areaID → ~800 bundled images | none |
| Item-info | Mod tiers, desired/undesired highlighting, roll bars, DPS, unique roll percentile, compare with equipped gear | both | hold OK on an item | clip + bundled mod/base data | low |
| Map-info | Map/waystone mods ranked by user tiers; difficulty | both | OK on a map | clip + bundled data | low |
| Map-Tracker | Per-map run log (time, deaths, kills, mechanics, loot), CSV export | both | auto (log) | log, NPC dialogue (needs an in-game option), `/kills` | medium |
| Stash-Ninja / Rune-Ninja | poe.ninja prices over stash tabs / OCR of runeshaping rewards | both / PoE2 | long OK | poe.ninja API, Windows OCR | medium (OCR language pack, grid tuning) |
| Statlas | Atlas node info (layout, boss, biome) | PoE2 | OK on atlas | OCR | medium |
| Vaal Street | Currency-exchange ratio calculator, async trade repricing and logs | both | OK + SC | screen + clip | high (calibration) |
| Betrayal-info | Syndicate rewards; board recognition | PoE1 | OK + SC | ~21 hand-snipped templates | high |
| Sanctum planner | Room graph and path planning, relic manager | both | OK + SC | pixel scan | high |
| Anoints / Enchant finder | Recipes from owned oils or emotions | both | OK menu | clip + data | low |
| Recombinator sim, Seed-Explorer (timeless) | Odds / jewel effects | PoE1 | OK menu | clip + data | low |
| Cheat sheets, Search-strings | User overlays and saved regex per in-game search UI | both | OK + SC | per-item snips | high |
| FilterSpoon | Edits a NeverSink filter from inside the game | both | modifier+OK | filter files, chat `/itemfilter` | medium |
| Chat macros, clone-frames, TLDR, lab, map events, timers/notes, QuickPoB, add-ons | Miscellaneous QoL | mixed | various | log / screen copy / OCR | mixed |

**Cross-cutting mechanics**
- One omni-key does Ctrl+C, then routes by item type and hold time. If nothing was copied, it runs screen-checks in priority order.
- Client.txt is polled every 1 s.
- INI files per feature and per game (`ini\`, `ini 2\`).
- PoE1 vs PoE2 is guessed from the folder or window name containing "2".
- The tool reads the game's `production_Config.ini` and refuses exclusive fullscreen.
- Updates arrive as a zip downloaded from GitHub and unpacked over the install folder.
- Windows OCR is used for 3 features.

Open detail: the wiki says the omni-key sends Ctrl+Alt+C, but the code sends `^{c}` (`modules/omni-key.ahk:40`) while the parser expects advanced-format tier lines. We need to confirm in game which copy format each client returns before building item-info.

### 2.2 exile-leveling

| Area | What exists |
|---|---|
| Route view | Collapsible acts, click-to-complete steps, "edges" (area changes) with a current-location marker |
| Route DSL | Line-based: `{enter\|1_1_2}`, `{quest\|a1q2}`, `{waypoint\|…}`, `{portal\|set}`, `{kill\|Hillock}`, `{dir\|270}`, `{copy\|regex}`, `#ifdef LEAGUE_START`, `#sub` hints. The parser **simulates game state**: it validates connectivity, waypoints, portals and crafting recipes, and emits the ordered edge list used for auto-progress |
| Data | `areas.json` (163 areas), `quests.json` (94, with class-gated quest and vendor gem rewards), `gems.json` (846). Seeded from GGG game files + poewiki + skilltree-export, by hand, in bursts around each league launch |
| PoB import | Code or pastebin/poe.ninja/pobb.in/maxroll URL → class, bandit, gem link groups, tree specs. Adds "Take X / Buy X (cost)" steps and per-quest gem regexes |
| Tree viewer | SVG per PoB spec with a delta between specs |
| Editor | Code editor per section with import/export (pastebin). Parse errors only go to the browser console |
| Auto-progress | Separate Rust helper `exile-log-api` tails `LatestClient.txt` → WebSocket → the page advances one edge at a time |
| Persistence | localStorage only: one build per browser, no profiles, no sync |
| Missing | PoE2 (author won't), in-game overlay, compact view, mules/gem swaps, layout images, localization, visible error reporting |

**Exile UI ↔ exile-leveling.** Exile UI used to import exile-leveling's "3rd-Party Export" JSON, but has since dropped it ([EUI#575](https://github.com/Lailloken/Exile-UI/issues/575), [EUI#579](https://github.com/Lailloken/Exile-UI/issues/579)). It now ships its own guide fork for PoE1 and PoE2 and imports a PoB code, a pobb.in link or its own guide JSON from the clipboard. Both tools key on **GGG area ids**; that is the contract to keep.

### 2.3 Who actually produces Exile UI's leveling guide

Full evidence (commit SHAs, dates, issue links): [research/guide-provenance.md](research/guide-provenance.md).

**Short answer: today, one person maintains all of it, Lailloken, inside `Lailloken/Exile-UI`.**
- **Until v1.57.3 (2025-03-21):** the PoE1 route came from exile-leveling (users pasted its export), and the gem and quest data was copied from exile-leveling's seeded JSON.
- **Since then:** the route, data, images and AutoHotkey renderer are all forked into the Exile UI repo. Zone layouts sit in the same repo's `layouts` / `layouts_2` branches and are downloaded at runtime.
- So the "other project" Yaniv has in mind is the origin, **exile-leveling**. What users see now is Lailloken's hand-maintained fork of it.

| Piece | File / location | Came from | Maintained how |
|---|---|---|---|
| PoE1 route (228 pages, 629 lines) | `data/english/[leveltracker] default guide.json` | exile-leveling route, reworked with CyclonDefinitiv's hints (definitivguide.com + his "advanced campaign guide" Google Doc; no repo, no license) | By hand; rewritten before each league |
| PoE2 route (136 pages) | `… default guide 2.json` | u/xebtria's public Google Sheet (Jan 2025); heavily rewritten for 0.3–0.5 | By hand; "drafted as I played" |
| PoE1 gem/quest rewards | `[leveltracker] gems.json` | Copy of exile-leveling's data (GGG game files + poewiki), restructured in 2025-03 | **Hand-patched, no generator script** |
| PoE2 gem data | `[leveltracker] gems 2.json` | Hand-built | **Not updated since 0.4 (2025-12-16)** |
| Areas | `[leveltracker] areas*.json` | exile-leveling `areas.json` (PoE1); hand-built (PoE2) | By hand |
| Zone layouts | branches `layouts` (468 PoE1 images), `layouts_2` (337 PoE2 images) | PoE1: Engineering Eternity–style images (2023, uncredited), redrawn by Lailloken in 2025 from Cyclon's guide. PoE2: Mobalytics Campaign Codex | Runtime download |
| Renderer | `modules/leveling tracker.ahk`, `act-decoder.ahk` | Lailloken | — |

**What's wrong with it:**

| Dimension | Finding |
|---|---|
| **Readability** | Home-grown lowercase markup with underscores in the shipped text: `kill the_bloated_miller`, `(color:ff00ff)buy_gems in (img:hideout)`. Directions are compass-icon numbers the reader must decode (`follow (img:6) side of wall`). `\|\|` packs two steps into one line. 144 colour codes carry meaning with no legend. The page advances when you enter the *last* area id on it, so the current objective is implicit |
| **Accuracy** | No validator; exile-leveling's parser simulates the route, Exile UI's JSON is hand-edited. The gem typo "focused chanelling" hid that gem for **~13 months** ([#795](https://github.com/Lailloken/Exile-UI/issues/795)). Scion gem data was wrong for 49 days ([#721](https://github.com/Lailloken/Exile-UI/issues/721)). There was a wrong act ([#665](https://github.com/Lailloken/Exile-UI/issues/665)) and a wrong NPC ([#695](https://github.com/Lailloken/Exile-UI/issues/695)). A renamed area id in PoE2 0.5 broke auto-advance |
| **Updates per league** | Good on PoE1 launch day (usually −5 to +0 days, faster than exile-leveling, whose 3.28 gems landed at +60). The tail is slow: fixes come from user reports over weeks. PoE2 lags each act restructure by 4–11 days. **Delivery lag:** fixes apply only after the user resets the guide slot, and a user who edited the guide never gets fixes unless they discard their edits |
| **Customization** | 9 slots, a few toggles (league start, bandit, optionals, gem quests), a full editor, and clipboard JSON. Missing: per-step done state, route variants (fast vs simple, [#818](https://github.com/Lailloken/Exile-UI/issues/818)), merging upstream fixes into edits, sharing by link, and moving gem-buy steps (they are injected at runtime, so the editor can't see them; [#833](https://github.com/Lailloken/Exile-UI/issues/833)) |
| **Route quality** | Good. It uses speedrun tricks from Cyclon (Hidden Underbelly, A1 Dweller shortcut, relog steps, skipping empty hand-ins). PoE2 coverage is the best of any open tool |

**What others do better:**
- **exile-leveling:** a validated DSL with readable sentences, per-step check-off, and data seeded from game files.
- **CyclonDefinitiv:** teaches *how to read* each zone layout ("Zone Read"), instead of showing an image to match.
- **Kami-Guru/path-of-levelling-2** (PoE2, Electron, MIT): gem setups that change at level breakpoints.
- **JusKillmeQik/PoE-Leveling-Guide:** per-build notes kept separate from the route.
- **Vyary/qutm:** a PoE2 Tauri tracker with a points-of-interest widget.

---

## 3. Setup and customization pain points (top items)

Sources: all 450 Exile UI issues and all 66 exile-leveling issues, plus issue titles from APT, EE2 and Sidekick. Full table with links is in [research/pain-points.md](research/pain-points.md).

**Reddit gap:** Reddit was blocked for the research agent, and it did not route around that. Reddit sentiment is therefore second-hand only. Filling it needs a manual pass, or a session with Reddit access.

| # | Pain point | ~Issues | Severity | Evidence (sample) |
|---|---|---|---|---|
| 1 | Pixel/image screen-check calibration: per resolution, breaks with HDR, Vulkan/Win11, patches and streaming | 30–67 | High; top support load | [#290](https://github.com/Lailloken/Exile-UI/issues/290), [#696](https://github.com/Lailloken/Exile-UI/issues/696), [#351](https://github.com/Lailloken/Exile-UI/issues/351) |
| 2 | Install: AHK v1.1 64-bit required, zip/working-dir errors, folder location (Program Files, OneDrive), admin rights, antivirus | 36–94 | High; first-run blocker every league | [#340](https://github.com/Lailloken/Exile-UI/issues/340), [#152](https://github.com/Lailloken/Exile-UI/issues/152), [#148](https://github.com/Lailloken/Exile-UI/issues/148), [#547](https://github.com/Lailloken/Exile-UI/issues/547) |
| 3 | Resolution whitelist and the tool resizing the game window (breaks ultrawide, 32:9 and windowed) | 27–58 | High | [#812](https://github.com/Lailloken/Exile-UI/issues/812) (24 comments, open), [#141](https://github.com/Lailloken/Exile-UI/issues/141) |
| 4 | Multi-monitor / mixed DPI: widgets on the wrong screen or off-screen; fixes via INI | ~12 | High | [#311](https://github.com/Lailloken/Exile-UI/issues/311), [#770](https://github.com/Lailloken/Exile-UI/issues/770), [#539](https://github.com/Lailloken/Exile-UI/issues/539) |
| 5 | Wrong config file / wrong game (PoE1 vs PoE2) detected | ~13 | High (won't start) | [#668](https://github.com/Lailloken/Exile-UI/issues/668), [#494](https://github.com/Lailloken/Exile-UI/issues/494) |
| 6 | Hotkey model: overloaded omni-key, assumed in-game keybinds, no mouse buttons, non-QWERTY, conflicts with APT/EE2 | ~25 | Medium–High | [#787](https://github.com/Lailloken/Exile-UI/issues/787), [#620](https://github.com/Lailloken/Exile-UI/issues/620), [#701](https://github.com/Lailloken/Exile-UI/issues/701) |
| 7 | Leveling import churn ("invalid import data", dropped exile-leveling support), tracking breaks in lab/trials/multi-level areas | ~35 | High at league start | [#575](https://github.com/Lailloken/Exile-UI/issues/575), [#747](https://github.com/Lailloken/Exile-UI/issues/747) |
| 8 | Update breakage and stale data after patches | ~40 | Medium–High each league | [#805](https://github.com/Lailloken/Exile-UI/issues/805), [#816](https://github.com/Lailloken/Exile-UI/issues/816) |
| 9 | Widget placement: can't drag onto a 2nd monitor, no per-resolution positions, no reset; redesigns with no opt-out; unwanted beeps | ~20 | Medium | [#655](https://github.com/Lailloken/Exile-UI/issues/655), [#667](https://github.com/Lailloken/Exile-UI/issues/667), [#716](https://github.com/Lailloken/Exile-UI/issues/716) |
| 10 | Performance: huge Client.txt (up to 7 GB), 30–90 s input lock at startup, G-Sync disengaging | ~20 | Medium–High | [#468](https://github.com/Lailloken/Exile-UI/issues/468), [#671](https://github.com/Lailloken/Exile-UI/issues/671), [#808](https://github.com/Lailloken/Exile-UI/issues/808) |
| 11 | No diagnostics: the tool "just doesn't show"; debugging via `dev=1` and Discord DMs | ~10 | Medium | [#446](https://github.com/Lailloken/Exile-UI/issues/446), [#691](https://github.com/Lailloken/Exile-UI/issues/691) |
| 12 | English-only (features turn off in other client languages); exile-leveling has no i18n | ~12 (EUI), ~47 (EE2) | High for non-English players | [#743](https://github.com/Lailloken/Exile-UI/issues/743), [EL#31](https://github.com/HeartofPhos/exile-leveling/issues/31) |
| 13 | Linux/Proton: the most-discussed thread for every overlay | 1 huge thread each | High for a niche | [#446](https://github.com/Lailloken/Exile-UI/issues/446) (44), [APT#1647](https://github.com/SnosMe/awakened-poe-trade/issues/1647) |
| 14 | Controller / GeForce Now unsupported | ~13 | Medium | [#231](https://github.com/Lailloken/Exile-UI/issues/231), [#459](https://github.com/Lailloken/Exile-UI/issues/459) |
| 15 | exile-leveling: route too dense (wants compact / gems-only), no keyboard nav, PoB import fragile, no mules or gem swaps | ~17 | Medium | [EL#53](https://github.com/HeartofPhos/exile-leveling/issues/53), [EL#58](https://github.com/HeartofPhos/exile-leveling/issues/58), [EL#109](https://github.com/HeartofPhos/exile-leveling/issues/109) |

**Keep what users love:** the auto-advancing act tracker plus the PoB tree and gem overlay ("couldn't live without it every league"), a light footprint, one smart key, an open and editable route format, and fast fixes after patches.

---

## 4. GGG rules

Primary sources: [developer docs, API Policies & Third-Party Requirements](https://www.pathofexile.com/developer/docs/index#policy), [Terms of Use §7](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy), and GGG staff forum posts ([Sian_GGG 2024](https://www.pathofexile.com/forum/view-thread/3584808), [Chulainn_GGG 2024](https://www.pathofexile.com/forum/view-thread/3474232)). Full table: [research/rules-tech.md](research/rules-tech.md).

| Behaviour | Status |
|---|---|
| Standalone executable running beside the game | **Permitted** ("not encouraged, but permitted") |
| Reading Client.txt | **Allowed**, as long as the user knows what we read |
| Macro: user-invoked, one set function, one game action per keypress (e.g. Ctrl+C, or one `/hideout`) | **Allowed** |
| Timers, cycling, sequences, input triggered by file changes or screen reading | **Forbidden** |
| Memory read/write, DLL injection, D3D hooks, packet sniffing | **Forbidden; account termination** |
| Separate transparent overlay window drawn over the game | Tolerated, never addressed in writing |
| Pixel checks or OCR used only to show or hide our own UI | Grey; Exile UI ships it |
| Logout macros | Grey; **don't ship** |
| Trade search API (`/api/trade/search`) | Undocumented, grey; APT uses it and obeys `X-Rate-Limit-*` headers |
| OAuth apps | Desktop apps must be a public client with PKCE; required `User-Agent: OAuth {id}/{ver} (contact: …)`. **New registrations are currently closed**, so nothing in the MVP may depend on OAuth |
| Branding | Required notice: "This product isn't affiliated with or endorsed by Grinding Gear Games in any way." No GGG logos |

GGG never approves any specific tool ("we cannot comment on the legality of third-party tools"). A GGG staff member said APT "probably" violates the ToS in places, yet it has been used by hundreds of thousands of players for years. I found no evidence of a kernel anti-cheat; there is client-side detection, with some false positives reported in PoE2 early access.

**Our compliance rules:**
1. Out-of-process overlay only.
2. Exactly one keystroke combo per user hotkey.
3. Client.txt and screen data drive display only, never input.
4. Rate-limited, honest-UA network calls.
5. A transparency page listing what we read and what we send.

---

## 5. Tech options

| | Electron (APT/EE2 stack) | Tauri v2 | C# WPF / Sidekick-style | AHK v2 |
|---|---|---|---|---|
| Reuse of poetools.dev TS/React | Full (UI and logic; main process is TS) | UI only; native layer in Rust | UI via WebView2 + C# natives | none |
| Overlay attached to the game window | **Ready**: `electron-overlay-window` (tracks the PoE window via `SetWinEventHook`, handles DPI) | build our own (~300–600 LOC Rust, estimate) | P/Invoke, easy | native |
| Click-through with interactive regions | `setIgnoreMouseEvents(true,{forward:true})` | all-or-nothing ([tauri#6164](https://github.com/tauri-apps/tauri/issues/6164) open) | full control | native |
| Hotkeys + Ctrl+C | `uiohook-napi` (proven) | Rust LL hook + enigo | SharpHook | native |
| Windows OCR (later) | sidecar exe needed | direct (`windows` crate) | direct | proven |
| Installer / RAM | ~100 MB / ~250 MB (estimate) | ~5–10 MB / ~100 MB (estimate) | ~80–100 MB | tiny, but AV flags |
| Build from WSL | UI dev in WSL; the shell needs Windows or CI `windows-latest` | official cross-compile (cargo-xwin) | compiles, can't run | n/a |
| Proven on PoE | yes (APT 2.6k★, EE2 1.2k★) | no | yes (Sidekick, Lurker) | yes (Exile UI) |
| Exclusive fullscreen | no (none of them support it without injection) | no | no | no |

**Decision: Electron** (Yaniv considered Tauri/Rust on 2026-11-02 and chose Electron). It has the lowest risk on the hardest part (window tracking, click-through and the hotkey/clipboard dance), all of it MIT and battle-tested on PoE1 and PoE2. It also gives full code sharing with the monorepo. Keep the UI framework-neutral (no `electron` imports in UI packages, IPC behind one interface) so a Tauri port stays cheap if download size becomes a selling point.

**Dev workflow:**
- Build the overlay UI as a Vite app in WSL, against fixtures (recorded Client.txt lines, item clipboard text) and a "fake game window" mode.
- Run and test the real shell on Windows from a Windows-side checkout.
- Release from GitHub Actions `windows-latest` with electron-builder (NSIS) + electron-updater.
- Code signing: SignPath (free for OSS) or Azure Trusted Signing. Both take days to approve, so the first beta will likely be unsigned and show a SmartScreen warning.

---

## 6. Proposal: what "much better" means

### 6.1 Five pillars

1. **Setup in under a minute, with zero calibration.**
   - One installer, no runtime, settings in `%APPDATA%`, works from any folder, no admin.
   - Finds the running PoE1 or PoE2 process, gets Client.txt from the process path, and reads the language from the log or config.
   - **Never touches the game window.** Any resolution or aspect ratio; DPI and multi-monitor aware.
   - The first-run wizard is three screens: detected game ✓, pick hotkeys (with conflict detection against in-game binds and APT/EE2 defaults), import build (optional).
   - A **Diagnostics panel** answers "why isn't it showing?": game, window rect, log path and size, language, permissions, hotkey state.
2. **Layout edit mode.**
   - Press a hotkey and the overlay becomes editable: drag, resize, snap to edges and other widgets, toggle widgets, set opacity, font scale and compact mode per widget.
   - Positions are stored relative to the game client rect, per resolution profile, and clamped on-screen, with a "reset layout" button.
   - Widgets can go on a 2nd monitor.
   - Layouts are exportable and shareable (a poetools.dev link via the monorepo `sharing` package).
3. **Profiles per character and build.** Each profile bundles route, PoB, gem plan, tree and layout. It auto-switches on the character name from Client.txt and keeps alts and mules separate.
4. **The best leveling tracker on PoE1 and PoE2.**
   - Reuse exile-leveling's DSL and validator, with errors shown in the UI.
   - Import from PoB code or links (pobb.in, poe.ninja, maxroll, pastebin, through our existing CORS proxy and `@poe-mono/pob-parser`), exile-leveling route text, and Exile UI guide JSON.
   - Views: full, compact, gems-only, "next 3 steps".
   - Keyboard next/prev, plus re-sync to the current zone.
   - Gem buy/take steps with per-quest regex copy, PoB tree-delta overlay, XP-penalty indicator, act timer with splits.
   - A web route editor on poetools.dev that shares the same packages.
5. **Signals that don't break.**
   - Prefer Client.txt and clipboard.
   - If screen detection is ever needed, auto-calibrate from known UI geometry with a live "detected ✓" indicator. Never require user snips.
   - Patch-day data is a remote JSON fetch, not an app release.

Later differentiators:
- item-info with links to poetools tools (gem profit, cluster, trade links);
- map-info;
- PoE2 leveling;
- i18n with a community translation pipeline;
- plugins (React widgets with a typed event bus: `areaEntered`, `levelUp`, `itemCopied`);
- controller-friendly mode;
- Linux/Proton (Electron makes it possible; APT has partial support).

### 6.2 A better guide, not just a better overlay

The overlay is only as good as the route content behind it. Exile UI's guide problems are mostly about *process*: hand-edited markup, hand-patched data and no validation. They are not caused by the overlay. We fix the process and treat the guide as a product with its own pipeline.

**1. Content lives in its own versioned package, separate from the app.**
- A `guides` package (in the monorepo, or a public content repo so the community can send PRs) holds the routes for PoE1 and PoE2 plus generated data.
- CI validates every change and publishes versioned JSON to our CDN (Cloudflare).
- The app hot-updates guide content without an app release, and shows "guide updated: 3 fixes in Act 4" in-app.

**2. A route language based on exile-leveling's DSL, extended.**
- Start from exile-leveling's `common/` (MIT): `{enter|areaId}`, `{quest|id}`, `{waypoint}`, `#ifdef`, `#sub`, and its parser that simulates the route against the area graph (connectivity, waypoints, portals).
- Extensions:
  - **stable step ids**, so user edits and progress survive content updates;
  - **named variants** (`#variant fast|simple`, `#option hidden_underbelly`, library, bandit, league-start), shown as toggles in the UI;
  - **sub-area mapping**, so multi-level zones and trials don't break tracking (Exile UI [#747](https://github.com/Lailloken/Exile-UI/issues/747));
  - a PoE2 area graph and quest model.
- CI fails on unknown area ids, unreachable areas, unknown quests/gems and unused options. This catches the whole class of bugs behind Exile UI's #795, #665 and the 0.5 area-id break before shipping.

**3. Generated game data, never hand-patched.**
- Gems, quest rewards, vendor rewards per class, areas and level recommendations are regenerated from GGG game files each patch.
- Sources: exile-leveling's `seeding/` with heartofphos/exile-export, poewiki Cargo for vendor tables, and RePoE where it's current.
- A diff report per patch ("3 gems changed vendor act, 1 new gem") goes to a human for review.
- Hand corrections live in a small, reviewed `overrides` file that the generator applies. They are never edited into the output.
- PoE2 gets the same pipeline. This also lets us ship accurate gem data on day 0 instead of +9 to +60 days later.

**4. Readable rendering.**
- **One action per line, in plain words.** Structured tokens render as chips: zone name with act, NPC + quest, waypoint/portal icons, and directions as **arrow + word** ("↗ north-east").
- A legend for every icon and colour, plus an always-visible **"Next: enter The Coast"** objective line, because progress is explicit rather than tied to the last area id on a page.
- Views:
  - **Full:** with hints.
  - **Compact:** the next 3 steps.
  - **Gems-only:** quest rewards and vendor buys.
  - **Speedrunner:** zone names only.
- Per-step check-off. The route auto-advances on area id and re-syncs to the current zone with one key.

**5. Build-aware steps that you can edit.**
- PoB import produces gem take/buy steps with costs and per-vendor regex. These are materialised as real steps (with ids), so the user can move, hide or re-time them, which Exile UI can't do ([#833](https://github.com/Lailloken/Exile-UI/issues/833)).
- **Level-gated gem setups and tree deltas:** "at level 12, swap to setup B", taken from PoB skill sets and tree specs, the way path-of-levelling-2 does it.

**6. User edits as patches, not forks.**
- Personal notes, hidden steps, added steps and reordered steps are stored as a patch keyed by step ids, on top of a pinned guide version.
- When the guide updates, the patch is re-applied, and only real conflicts are shown. This removes Exile UI's "reset the slot to get fixes" trap.
- Patches and full custom routes can be shared as a poetools.dev link. Later: a small catalog of community routes, such as a mule route or a 2nd-character route.

**7. Layout knowledge we are allowed to ship.**
- Teach the zone read in text: "check the NE path first; dead end means variant B". Use our own layout images, made in-house or community-contributed under a clear license.
- Do **not** reuse Mobalytics or Engineering Eternity images.
- Ask CyclonDefinitiv for permission or a partnership before using his material. That is outward-facing, so it's Yaniv's call.

**8. A fast feedback loop at league start.**
- A **"report this step"** button sends the area id, step id, guide version and an optional note to our worker, deduplicated into a triage list.
- A launch-day hotfix channel ships content fixes within hours, not after a slot reset.
- A pre-league draft is written from the patch notes during the reveal → launch week.

**9. Web and overlay share one engine.**
- The same packages power a route viewer and editor on poetools.dev, with live validation and preview, and the overlay renders the result.
- The web version is also a good second-monitor and onboarding path for players who won't install anything. This covers what exile-leveling offers, plus PoE2.

### 6.3 MVP for 3.30 (league start Nov 13; reveal Nov 7–8)

**In scope (PoE1 only):**
- Electron shell: overlay attached to the PoE window, click-through, tray icon, settings window, auto-update from GitHub Releases.
- Game and log auto-detection; log tailer that reads from the end of the file (no full scan, so a 7 GB log costs nothing); events for area entered, level up and character login.
- Leveling tracker widget:
  - default PoE1 route (vendored exile-leveling `common/` + route, validated in CI, updated for 3.30 changes if the reveal touches the campaign);
  - readable rendering (chips, arrow+word directions, "Next:" line);
  - stable step ids;
  - league-start and library toggles;
  - auto-advance on area id;
  - compact, full and gems-only views;
  - per-step check-off;
  - prev/next/re-sync hotkeys.
- Guide content served as versioned JSON from our CDN, hot-updatable without an app release.
- Gem/quest data regenerated for 3.30 through exile-leveling's seeding pipeline (needs game files on Windows), plus an `overrides` file.
- PoB import: gem links widget and quest/vendor gem steps.
- A "report this step" button.
- Layout edit mode: drag, resize, opacity and scale, stored relative to the client, reset.
- One profile per character, auto-selected from the log.
- First-run wizard and a Diagnostics panel.
- Transparency page and GGG non-affiliation notice.

**Out of MVP:**
- item-info and all Ctrl+C features;
- the passive-tree overlay;
- layout images and zone-read text;
- user patches over the route (step ids are in from day 1, so we can add patches later without migration);
- route variants beyond league-start and library;
- level-gated gem setups;
- map tracker, PoE2, i18n, Linux;
- code signing (if approval isn't in time);
- the web route editor.

**Risk:** the 3.30 reveal (Nov 7–8) may change campaign or gem rewards. exile-leveling's data refresh usually lags league launch by days to weeks, so we would have to seed gem and quest data ourselves from the patch notes or a game-file export.

### 6.4 Effort estimate (Claude-assisted dev, one person reviewing)

| Item | Estimate |
|---|---|
| Electron shell + overlay window + hotkeys + tray + updater + CI release | 2–3 days |
| Log tailer + game detection + diagnostics + wizard | 1.5 days |
| Vendor exile-leveling `common/`, step ids, readable renderer, auto-advance, views, check-off | 2.5 days |
| Guide content package: CI validation, CDN publish, in-app hot-update, "report step" endpoint | 1.5 days |
| 3.30 data regen (seeding pipeline + overrides) and route fixes after the reveal | 1–2 days (the extraction needs game files on Windows) |
| PoB import → gem steps + gem-links widget (reuse `@poe-mono/pob-parser`) | 1 day |
| Layout edit mode + profiles + persistence | 2 days |
| Windows testing in game | 1 day (needs Yaniv or Tomer) |
| **MVP total** | **~12–14 working days**. Launch day (Nov 13) is not realistic. Realistic is a **beta in league week 1–2 (Nov 17–24)**, or an alpha at launch with only tracker + layout, without the content pipeline |
| Phase 2 (guide): user patches over the route, variants (fast/simple, Hidden Underbelly), level-gated gem setups, tree overlay, web route viewer/editor on poetools.dev | +2–3 weeks |
| Phase 2 (overlay): item-info (Ctrl+C parser, tiers, poetools links) | +2 weeks |
| Phase 3: PoE2 route + data pipeline (PoE2 1.0 is reportedly due 2026-12-11; ideal timing), layout images + zone-read text, map-info/tracker, i18n, plugin API, signing, Linux | +5–7 weeks |

Someone on Windows must run the game to test; that cannot be done from WSL.

---

## 7. Open questions and decisions

1. Is the target ship date launch day, an alpha with tracker + layout (riskier), or a week-1–2 beta (recommended)?
2. ~~Stack~~: decided, Electron.
3. Should guide content be a **public content repo** that accepts community PRs, with the app staying wherever we decide? Recommendation: yes. Accurate guide content is the moat, and open PRs speed up league-start fixes.
4. Should we contact CyclonDefinitiv about permission or a partnership for route and layout knowledge? Recommendation: yes, after an alpha exists. This is outward-facing.
5. Open source (MIT, which helps trust and SignPath signing) or closed? Recommendation: open source.
6. Where should it live: a separate repo (this one), or `apps/overlay` inside poe-mono-repo for package reuse? Recommendation: inside the monorepo as `apps/overlay`, keeping this repo for research and planning, because the reuse of `pob-parser`, `poe-assets` and `sharing` is the main advantage.
7. Should we contact HeartofPhos (exile-leveling) about collaborating or upstreaming PoE2 data? This is outward-facing, so it's Yaniv's call.
8. Reddit sentiment still needs a manual pass (blocked for the agent).
