# Exile Overlay: research report

Date: 2026-11-02. Status: research only, no app code.
Goal: build a PoE overlay that beats **Exile UI** + **exile-leveling**, mainly on **setup** and **customization**.

Detailed evidence, with file:line and issue citations, is in four appendices:

| Appendix | Contents |
|---|---|
| [research/exile-ui-features.md](research/exile-ui-features.md) | Every Exile UI module, cross-cutting mechanics, the leveling tracker in depth, setup friction found in the code |
| [research/exile-leveling.md](research/exile-leveling.md) | Web app features, route DSL, data pipeline, PoB import, Exile UI integration history, what is reusable |
| [research/pain-points.md](research/pain-points.md) | 43 pain points with about 400 GitHub issue links, loved features, unmet wishes |
| [research/rules-tech.md](research/rules-tech.md) | GGG rules with primary sources, comparison of existing overlay stacks, framework comparison |

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
5. **Tech recommendation: Electron + `electron-overlay-window` + `uiohook-napi`, with a React UI.** This is the proven Awakened PoE Trade stack and it gives full reuse of poetools.dev TS/React code. **Runner-up: Tauri v2**, which has a ~10× smaller installer but no ready-made overlay tracking or click-through mouse forwarding.
6. **MVP for 3.30 (Nov 13, 11 days away):** a PoE1 leveling overlay only. It has zero-config setup, a drag-and-drop layout edit mode, per-character profiles, and route import from PoB, exile-leveling and Exile UI. It needs no screen-checks. Treat it as a public beta in week 1 of the league. Item info, map info and PoE2 come later.

---

## 1. Licenses

| Repo | License | Implication |
|---|---|---|
| Lailloken/Exile-UI (1,379★, last push 2026-10-20) | MIT (© 2022 Lailloken) | Code and data such as default guides, area data and hint images may be reused with attribution. Its AHK code is of little direct use to a TS app, but its **bundled data** (default PoE1/PoE2 guide JSON, act-decoder zone-layout images, map-mod tiers) is valuable. Check the provenance of the images before reusing them, since some may be community-made. |
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

**Recommendation: Electron.** It has the lowest risk on the hardest part (window tracking, click-through and the hotkey/clipboard dance), all of it MIT and battle-tested on PoE1 and PoE2. It also gives full code sharing with the monorepo. Keep the UI framework-neutral (no `electron` imports in UI packages, IPC behind one interface) so a Tauri port stays cheap if download size becomes a selling point.

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

### 6.2 MVP for 3.30 (league start Nov 13; reveal Nov 7–8)

**In scope (PoE1 only):**
- Electron shell: overlay attached to the PoE window, click-through, tray icon, settings window, auto-update from GitHub Releases.
- Game and log auto-detection; log tailer that reads from the end of the file (no full scan, so a 7 GB log costs nothing); events for area entered, level up and character login.
- Leveling tracker widget:
  - default PoE1 route (vendored exile-leveling `common/`, updated for 3.30 changes if the reveal touches the campaign);
  - auto-advance on area id;
  - compact and full views;
  - prev/next/re-sync hotkeys.
- PoB import: gem links widget and quest/vendor gem steps.
- Layout edit mode: drag, resize, opacity and scale, stored relative to the client, reset.
- One profile per character, auto-selected from the log.
- First-run wizard and a Diagnostics panel.
- Transparency page and GGG non-affiliation notice.

**Out of MVP:** item-info and all Ctrl+C features, the passive-tree overlay, layout images, map tracker, PoE2, i18n, Linux, code signing (if approval isn't in time), web route editor.

**Risk:** the 3.30 reveal (Nov 7–8) may change campaign or gem rewards. exile-leveling's data refresh usually lags league launch by days to weeks, so we would have to seed gem and quest data ourselves from the patch notes or a game-file export.

### 6.3 Effort estimate (Claude-assisted dev, one person reviewing)

| Item | Estimate |
|---|---|
| Electron shell + overlay window + hotkeys + tray + updater + CI release | 2–3 days |
| Log tailer + game detection + diagnostics + wizard | 1.5 days |
| Vendor exile-leveling `common/`, route rendering, auto-advance, views | 2 days |
| PoB import → gem steps + gem-links widget (reuse `@poe-mono/pob-parser`) | 1 day |
| Layout edit mode + profiles + persistence | 2 days |
| 3.30 data refresh + Windows testing in game | 1–2 days (the in-game part needs Yaniv or Tomer) |
| **MVP total** | **~10–12 working days**. That is tight for Nov 13; realistic is a **beta during league week 1 (Nov 13–20)**, or an alpha at launch with only tracker + layout |
| Phase 2: item-info (Ctrl+C parser, tiers, poetools links), tree overlay, PoE2 leveling | +3–4 weeks |
| Phase 3: map-info/tracker, i18n, plugin API, web route editor, signing, Linux | +4–6 weeks |

Someone on Windows must run the game to test; that cannot be done from WSL.

---

## 7. Open questions and decisions

1. Is the target ship date launch day, an alpha with tracker + layout (riskier), or a week-1 beta (recommended)?
2. Stack: Electron (recommended) or Tauri?
3. Open source (MIT, which helps trust and SignPath signing) or closed? Recommendation: open source.
4. Where should it live: a separate repo (this one), or `apps/overlay` inside poe-mono-repo for package reuse? Recommendation: inside the monorepo as `apps/overlay`, keeping this repo for research and planning, because the reuse of `pob-parser`, `poe-assets` and `sharing` is the main advantage.
5. Should we contact HeartofPhos (exile-leveling) about collaborating or upstreaming PoE2 data? This is outward-facing, so it's Yaniv's call.
6. Reddit sentiment still needs a manual pass (blocked for the agent).
