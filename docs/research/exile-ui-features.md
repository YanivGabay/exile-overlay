# Exile UI: feature map (for overlay design)

Source: `Lailloken/Exile-UI` main-branch clone (`src/Exile-UI`, AutoHotkey **v1.1.36+ 64-bit only**, `Exile UI.ahk:3`) and the GitHub wiki (cloned from `Exile-UI.wiki.git`).
Paths are relative to the repo root. `help` means `data/english/help tooltips.json` → `settings.<key>`, the in-app help strings and the best spec of intended behavior. Wiki pages are named `wiki:<Page>`.

---

## 1. Feature table

Abbreviations: **OK** = omni-key (default CapsLock), **WK** = widget-key (default TAB, held), **SC** = screen-check (pixel or image template that the user must calibrate), **log** = Client.txt tail, **clip** = item text copied with Ctrl+C.

| Module (file) | What it does for the player | PoE | Trigger | Game-data source | Config | Notable limitations |
|---|---|---|---|---|---|---|
| **Act-Tracker / leveling tracker** (`modules/leveling tracker.ahk`, 3.7k lines) | Step-by-step campaign guide overlay. Advances automatically when you enter the target zone. Also: act timer with CSV export, effective-exp/over-level indicator, PoB gem-link tooltips, PoB passive-tree overlay, gem search strings, gear tracker. Details in §3 | both (gear tracker PoE1 only; PoE2 exp shows only the level difference) | Menu-widget button toggles it. Auto-advance on log zone change. `<`/`>` buttons or optional F3/F4 page hotkeys | **log** (`Generating level … area "<id>"`, level-ups); clip (PoB import, gem hover via OK); bundled `data/english/[leveltracker] *.json`; tree JSON downloaded on demand from GitHub (`leveling tracker.ahk:2796`) | Settings menu → `ini\leveling tracker.ini` plus one `ini\leveling guide<N>.ini` per guide slot (up to 9 slots). Drag a white square to move the overlay | GeForce Now has no log, so pages must be advanced manually (wiki:Act-Tracker). Tree overlay only works on a fully zoomed-out tree and must be re-aligned after every relog. Manual tree mode needs the `skilltree` SC |
| **Act-Decoder** (`act-decoder.ahk`) | Zone-layout overlay for campaign zones: shows minimap "clue" images to match, then the full layout. Also sample layouts, multi-part zones, mirror and rotate | both | Hold WK (or a dedicated hotkey; holding opens the overlay, tapping passes the key through, `act-decoder.ahk:63-71`). ALT locks it. Number keys pick a layout | log `areaID` → `img\GUI\act-decoder\zones[ 2]\<areaID> …` images (≈800 files). Layout pack is downloaded as a zip from the GitHub `layouts`/`layouts_2` branch (`settings menu.ahk:180`); version check at `act-decoder.ahk:122` | Settings: opacity, zoom, lock zoom, position | The user matches the clue to the minimap by eye; nothing is automated. Wiki warns that new PoE2 leagues add layouts |
| **Item-info** (`item-checker.ahk`, 2.9k lines) | Compact item tooltip: colored mod tiers (PoE2 renumbered so T1 = best), desired/undesired mod highlighting per class, roll bars, DPS, base percentile, unique roll percentile and drop tier, ilvl requirement per mod, optional comparison with equipped gear | both (gear compare PoE1 only, quality/rune scaling PoE2 only) | Hold OK over an item (or toggle mode). Optional shift-click refresh while crafting needs the `inventory` SC | **clip** (OK sends `^{c}`, `omni-key.ahk:40`). Parses advanced-format lines such as `{ Prefix Modifier "Name" (Tier: N) }` (`item-checker.ahk:1437`). Bundled `data/global/item mods*.json`, `item bases*.json`, `item drop-tiers*.json` | Settings menu, highlight profiles in `ini\item-checker.ini`, equipped gear in `ini\item-checker gear.ini` | Needs the advanced copy format. The wiki says OK sends Ctrl+Alt+C, but the code shows `^{c}`. If the user rebound C or Alt in game, a second omni-key or alternate key is required (`hotkeys.ahk:12-46`, UI.txt:1096-1097) |
| **Map-info panel** (`map-info.ahk`) | Categorized map/waystone mods, user-tiered 1-4 or struck out, roll thresholds (quant/rarity/pack, T17 multipliers), difficulty bar. Compact panel while holding WK | both | OK (tap toggles, hold option) over a map or waystone. Shift-click currency refresh (`inventory` SC) | clip plus bundled `data/english/map-info[ 2].txt` | Settings: per-mod tiers, pinned mods, roll requirements, colors | Disabled when the client language is unknown (`Exile UI.ahk` Init_general `settings.features.mapinfo`) |
| **Map-Tracker** (`map tracker.ahk`) | Logs every map run (time, deaths, portals, kills, side areas, mechanics, loot, map mods, notes, character/build/league), shows an in-game log viewer, exports CSV | both | Automatic from log. WK shows the panel. Click the flashing panel or press OK to send `/kills`. A portal-key reminder is available | **log**: area IDs (`Maptracker_Check`, `map tracker.ahk:148`), death lines, `/kills` response, NPC dialogue (needs the in-game "output dialogue to chat" option). Loot via Ctrl-click in stash (`stash` SC). Some mechanics via per-mechanic image SCs while holding WK | Settings. Data in `ini\map tracker log.ini`, CSV via `Maptracker_LogsCSV` (`:1045`) | Not available on GeForce Now. Kill tracking requires manually triggering `/kills` |
| **Stash-Ninja** (`stash-ninja.ahk`) | Overlays poe.ninja price tags on fixed-layout stash tabs (currency, fragments, etc.). 5 price-range profiles (keys 1-5), bookmarks with regex copy, weekly price history, bulk-sale helper with live exchange listings | both | Long-press OK over an item in a supported tab. GeForce Now uses a separate hotkey (F2) and a tab picker | Prices from `https://poe.ninja/poe{1,2}/api/economy/exchange/current/overview?league=…&type=…` (`stash-ninja.ahk:440-443`), cached in `data\global\[stash-ninja] prices*.ini`. Grid coordinates in bundled `data/global/[stash-ninja] tabs*.json`. Bulk listings via POST `pathofexile.com/api/trade/exchange/<league>` (`_functions.ahk:179-184`) | Settings: per-tab profiles, gap fine-tuning, "tab in folder" offset | PoE1 needs at least one stash folder or the grid misaligns. The gap value may need manual tuning |
| **Rune-Ninja** (`rune-ninja.ahk`) | Reads runic remnant (runeshaping) reward options on screen and shows poe.ninja prices | PoE2 only | Hold OK while the runeshaping UI is open (`runeshaping` or `runeshaping2` controller SC) | **OCR** (Windows.Media.Ocr) of the reward area, plus the poe.ninja cache | Settings plus a user auto-correct dictionary for OCR mistakes | Requires the English OCR language pack in Windows. ALT+OK opens an OCR debug view |
| **Statlas** (`statlas.ahk`) | On the atlas, shows a map's layout image, boss, biome bonuses and Map-Tracker stats | PoE2 only | Hold OK over an atlas node (`atlas` SC) | **OCR** of the hovered map name (`statlas.ahk:32`), bundled `data/english/maps 2.json`, `img/GUI/statlas` | Settings: zoom, tier filter | Needs the English OCR pack |
| **Vaal Street: exchange** (`exchange.ahk`) | Ratio calculator on the currency exchange, small UX tweaks, trade logging, balance tracking, candle graphs | both | OK while the exchange is on screen (`exchange` SC). ALT hides the overlay | Screen (image SC, clicks on in-game fields, Ctrl+A/Ctrl+C of fields, `exchange.ahk:1514`), the `inventory` pixel check, poe.ninja ratios | `ini\vaal street*.ini`, `exchange.ini` | Setup is mostly calibration |
| **Vaal Street: async trade** (`exchange.ahk` AsyncTrade*) | Quick repricing panel for listed items, age/price tracking of sales, sales and purchase logs with a viewer | both | OK while the async sell/buy window is open (`async1`/`async2` SC). OK over an item whose note has `~b/o` reprices it (`omni-key.ahk:55`) | clip of the item note, screen | `ini\async trade.ini` | 2 SCs to calibrate |
| **Betrayal-info** (`betrayal-info.ahk`) | Syndicate reward cheat sheet with user tiering. Optionally recognizes a hovered member card and tracks the whole board (optimal positions) | PoE1 only (`Exile UI.ahk` Init_general) | Hold OK while the board is open (`betrayal` SC) | Bundled `data/english/Betrayal.json` (can be updated from GitHub). Image search with a user-captured template per member and per division (`betrayal-info.ahk:387-403`) | Settings plus `ini\betrayal info.ini` | Full mode needs ~17 member templates plus 4 division templates captured by hand |
| **Sanctum / Sekhema planner** (`sanctum.ahk`) | Scans the floor map, builds a room/connection graph, shows reach counts and available paths to target rooms, avoid-marking. Relic manager sums and searches relic mods. Optional room cheat sheet (PoE1) | both | Hold OK in the sanctum or trial with the floor map open (`sanctum` SC). SPACE locks. OK over relics at the altar (`inventory` SC) | Pixel/colour scan of a client screenshot (`Sanctum_Scan`, `sanctum.ahk:674`), log `areaID` contains `sanctum`. Relics via clip | Two extra calibrations (paths and rooms) inside the overlay | Accuracy depends on calibration |
| **Enchant Finder / anoints** (`anoints.ahk`) | Lists reachable anoint recipes from owned oils (PoE1) or distilled emotions (PoE2), with a keyword/regex filter. Click a result to highlight the node on the in-game tree (via Ctrl+F paste) | both | OK over oils → context menu → "enchant finder". OK over stacks loads amounts | clip (stack sizes), bundled `data/english/anoints[ 2].json` (re-downloadable from GitHub, `settings menu.ahk:493`) | Settings | — |
| **Recombination simulator** (`recombination.ahk`) | Simulates recombinator odds for two items with editable mods and exclusive/NNN flags | PoE1 | OK over an item → context menu → recombination. While open, OK loads items | clip plus bundled mod data | No settings section; font and colour are set in the panel | Based on community findings, so results are approximate |
| **Seed-Explorer** (`seed-explorer.ahk`) | Timeless jewel: shows its effect on every socket, desired notables, trade link and vilsol link | PoE1 | OK over a Timeless Jewel → context menu | clip plus bundled `data/global/[legion] *.csv` (updated from GitHub, `seed-explorer.ahk:446-469`) | Settings | Listed as "retired/legacy" in the README but still initialized (`Init_legion`) |
| **Cheat-sheet toolkit** (`cheat sheets.ahk`) | User-made overlays: image sheets (pasted or snipped), "app" sheets (launch or focus an external app), "advanced" sheets (hover tooltips with ranking). Each opens automatically for the matching in-game UI | both | ALT (or CTRL/SHIFT)+OK; image SC per sheet decides which sheet opens. Arrow keys move, F1-F3 resize | Image search with a user-snipped template per sheet (`cheat sheets.ahk:172-188`) | `ini\cheat-sheets.ini`, `cheat-sheets[ 2]\` folder, sample sheets | Every sheet needs its own calibration snip |
| **Search-strings** (`search-strings.ahk`) | Context menu of saved search/regex strings per in-game search UI (vendor, Gwennen, Lilly, stash…). Scroll cycles sub-strings or numbers. Includes beast-craft strings (PoE1) and generated gem strings for Lilly | both | Tap OK; the matching use-case is found by image SC (`String_Search`, `:351`). Optional "universal" hotkey needs no calibration | Image templates per use-case. Pastes with `^{f}` then `{DEL}^{v}{Enter}` (`search-strings.ahk:106-108`) | `ini\search-strings.ini` | Each use-case needs a calibration snip |
| **FilterSpoon (lootfilter)** (`lootfilter.ahk`, 2.4k lines) | In-client NeverSink/FilterBlade filter editor: OK on an item finds the matching rule, browse/search tiers, economy-based tweaks, filter tester, sound preview, re-sync reminder | both | Modifier+OK over an item, or the menu-widget | Reads `<config dir>\OnlineFilters\*` (NeverSink header required, `lootfilter.ahk:1525-1535`) and writes `FilterSpoon.filter`. Applies by pasting `/itemfilter FilterSpoon` into chat (`:581-591`). Confirms via the log line `Finished reloading online filter` (`client log.ahk:514`) | `ini\lootfilter.ini` (modification profiles) | Experimental. NeverSink filters only |
| **Chat macros** (`macros.ahk`) | Two hotkeys. Tap: `/hideout` or a custom command. Hold: radial "chat wheel" with up to 9 commands (kingsmarch, menagerie, delve, …) | both | Dedicated hotkeys (disabled until set) | Sends `{ENTER}^v{ENTER}` with the command on the clipboard (`macros.ahk:73-78`) | `ini\chat macros.ini` | Uses the clipboard and chat injection |
| **Omni-key context menu** (`omni-key.ahk:Omni_ContextMenu`) | OK over an item with no specific feature opens a menu: wiki, poedb (mod tiers), craftofexile, poelab, blight.raelys, cluster jewel tools, vilsol timeless, siveran calc | both | OK | clip | `settings.features.browser` (auto-paste into some sites) | Opens the browser |
| **Clone-frames** (`clone-frames.ahk` plus `_secondary thread.ahk`) | Copies a screen region (flasks, cooldowns, rage, charges) and draws it elsewhere, e.g. near the character. Scale and opacity, groups, auto-hide when full-screen UIs are open | both | Automatic and always on. Hides by the `gamescreen`/`inventory`/`close_button` pixel checks | Screen copy rendered with `UpdateLayeredWindow` (`clone-frames.ahk:320`). Pixel checks decide visibility | Settings: drag corners with L/R/M mouse buttons, per-pixel fine-tuning, FPS profile | Costs performance. Needs multi-threading for the FPS options |
| **TLDR tooltips** (`TLDR tooltips.ahk`) | OCRs Eldritch altar choices or Vaal side-area text and shows a colour-ranked summary | PoE1 only | Hold the in-game "toggle highlighting" key (Z) or a separate hotkey. The scan area is adjustable with the scroll wheel | **OCR** (`TLDR tooltips.ahk:109`), bundled `data/english/TLDR-tooltips.json` | `ini\TLDR*.ini` | English OCR pack required |
| **QoL: lab** (`qol tools.ahk:Lab`) | Layout overlay and room tracker for casual lab runs | PoE1 | WK in the lab or the plaza. Rooms advance from the log | Import: the user opens poelab.com, copies the layout image, then the compass JSON URL. The tool watches the clipboard (`qol tools.ahk:509-540`). Log area name and seed track the current room | Settings | Manual import every day |
| **QoL: map events** (`qol tools.ahk:MapEvent*`) | Pop-ups for infamous mercenaries, claimable hideouts (filtered by rarity), graftblood almost full, delirium/maven/etc. dialogue, filter re-sync reminder | both | Automatic from log | log: NPC-dialogue prefixes from `data/english/client.txt:191-233`, `] Spawning discoverable Hideout` (`client log.ahk:581`) | Settings: events, duration, position | Dialogue-based events need the in-game "output dialogue to chat" option |
| **QoL: alarm/stopwatch, notepad/sticky notes** | Floating timers and countdowns; notepad with tabs and sticky-note widgets (gem reminder tab) | both | Hold WK, or the menu-widget | — | `ini\qol tools.ini` | — |
| **QoL: essence tooltip** | Shows the next essence tier's stats | PoE1 | Hold OK over an essence (ALT if stash-ninja is enabled) | clip plus `data/english/essences.json` | — | — |
| **QuickPoB** (`qol tools.ahk:1206`) | Experimental. Copies an item into a running PoB, then screen-caps PoB's item-compare frame into a movable widget | both | Hotkey over an item or a trade-site "copy item" button | clip plus a screen grab of the PoB window (needs one-time offset calibration) | Settings | Proof of concept |
| **Add-ons** (`add-ons\loader`) | Experimental plugin system: import a GitHub repo as a feature. It gets `LogRead(line)` callbacks (`client log.ahk:597`) | both | — | — | Settings | — |

---

## 2. Cross-cutting mechanics

### Game window detection
- Startup blocks until `ahk_class POEWindowClass` or `ahk_exe GeForceNOW.exe` exists (`Exile UI.ahk:35-41`). The tool exits after N minutes without a client (the "kill script" setting).
- PoE1 vs PoE2: if the window title or install folder name contains "2" or "ii", the result is `" 2"` (`_functions.ahk:8-28`). More than one client is a fatal error. Every ini, data and img path is then suffixed with `" 2"` (`ini 2\`, `… 2.json`).
- The main loop runs every 1 s and re-runs `Init_client` when the client restarts (`Exile UI.ahk:702-745`). Overlays hide when neither the PoE window nor an AHK GUI is active; the window group `poe_ahk_window` is defined at `Exile UI.ahk:1165-1173`.
- Overlays are AHK GUIs with `-Caption +AlwaysOnTop +ToolWindow`, many with `+E0x20` (click-through). They are not drawn inside the game, so the game must be windowed.

### Resolution and scaling
- The tool reads the game's own `production_Config.ini` (or `poe2_production_Config.ini`). It uses the path found in `logs\LatestClient.txt` ("settings directory:") or `Documents\My Games\…`, and asks the user to locate the file if neither works (`Exile UI.ahk:244-262`).
- **Exclusive fullscreen is refused** with "set it to windowed fullscreen" (`:281`). It also reads `borderless_windowed_fullscreen` and the language from the same file (`:286-305`).
- **Only fixed client heights are supported**, listed in `data/Resolutions.ini`: 720/800/900/1080/1200/1440/1600/1800/2160p. Each entry carries a per-height font size and gamescreen pixel coordinates (`:416-427`).
  - 768/1024/1050 are explicitly rejected (`:641`).
  - Any other height blocks the tool with "Unsupported resolution". It opens the client settings so the user can force a custom resolution, which the tool applies by `WinMove`-resizing the game window on every start (`Resolution_check`, `:1077-1121`; `:358-385`).
- The tool positions the game window itself, docked left/center/right and top/center/bottom/taskbar, and can remove borders (`:345-405`). The wiki asks users to remove other borderless/resolution apps first.
- Screen-check regions are hard-coded fractions of the client height (`screen-checks.ahk:37-58`). Calibration data is stored per resolution in `ini\screen checks (1080p).ini` and `img\Recognition (1080p)\GUI\*.bmp`, so changing resolution means recalibrating.
- Ultrawide wider than 24:10 can enable "black-bar compensation", which shifts the x-offset of all checks (`screen-checks.ahk:9-17`).
- DPI: `SetThreadDpiAwarenessContext(-3)` (per-monitor aware), and all GUIs use `-DPIScale` (`Exile UI.ahk:17`).
- Optional "client filler" covers the desktop around a smaller client.

### Screen-checks (calibration burden)
- **Pixel checks:**
  - `gamescreen`: 1 pixel, PoE1 coordinates from Resolutions.ini. Means "no full-screen UI open".
  - `inventory`: 3 pixels near the top-right of the client. Means "inventory open".
  - `close_button`: PoE2, user-placed with a crosshair.
  - Calibration stores the pixel colours the user captures while the UI element is visible (`Screenchecks_PixelRecalibrate`, `screen-checks.ahk:283-301`). PixelSearch then runs with variation 0 (10 and 25 on GeForce Now).
- **Image checks:** `skilltree`, `betrayal`, `sanctum`, `exchange`, `async1/2`, `stash`, `tradesearch` (PoE1), and `atlas`, `runeshaping(2)` (PoE2).
  - Each has a fixed search box. "cal" left-click auto-crops that box from a client screenshot (`Gdip_BitmapFromHWND`); right-click lets the user snip it manually (`screen-checks.ahk:65-175`).
  - The match uses `Gdip_ImageSearch` with variation 15. On the first successful test the found position is cached as "last coordinates" (`:176-243`).
- **Per-feature user snips on top of those:** every search-strings use-case, every cheat sheet, every betrayal member and division, every map-tracker screen mechanic, and the sanctum path/room calibration.
- Each check has Info, Cal and Test buttons (help `screenchecks *`). Game patches that change textures invalidate templates (wiki:Screen-checks).
- **Net:** using the omni-key for anything other than items requires the user to calibrate each check once per resolution and again after UI-changing patches.

### Hotkeys and the omni-key concept
- Only two hotkeys are needed in general:
  - **Omni-key** (default CapsLock, F1 fallback). Registered as a blocking `*` hotkey while PoE or a tool GUI is active (`hotkeys.ahk:15-46`).
  - **Widget-key** (default TAB, held). Shows the transient overlays: act-decoder, guide hints, map-info panel, map tracker, alarm, notepad, lab.
- Holding ESC opens the radial menu-widget, the hub for settings and toggles (`hotkeys.ahk:Hotkeys_ESC`). An alternative key exists because long-ESC fails for some users unless the tool runs as admin (wiki:Home).
- Omni-key flow (`omni-key.ahk:1-111`):
  1. Clear the clipboard, send `^{c}`, wait 100 ms.
  2. If an item was copied, `Omni_Context()` (`:268-340`) routes by item type, open windows, modifier keys and **hold duration**: >150-200 ms goes to stash-ninja, item-info, gem links or relics; a tap goes to map-info or the context menu.
  3. If nothing was copied, `Omnikey2()` (`:113-246`) runs the cheat-sheet modifier check, then image screen-checks in priority order (betrayal → skilltree → sanctum → exchange → async → atlas → runeshaping), then the town gem list, then search-string use-cases.
- In-game keybind conflicts are handled in the settings: C rebound needs a second omni-key for items; Alt rebound needs an alternative key; "move key" (for cursor movement vs WASD); "c-key rebound" (`settings menu.ahk:2111-2268`).
- An emergency restart hotkey is bound to Ctrl+Alt+Space (`hotkeys.ahk:26`). CapsLock toggling is optional because AHK input toggles CapsLock (help `capslock toggling`).
- Optional `modules\hotkeys custom.ahk` is included if present (`Exile UI.ahk:141`).

### Client.txt reading
- Path: the PoE process directory + `logs\Client.txt` (or `KakaoClient.txt`). If `logs\LatestClient.txt` exists, it is tailed instead after the initial scan (`Exile UI.ahk:1193-1210`, `client log.ahk:62-63`).
- Startup: reads backwards in 3 MB chunks until it finds the last `Generating level` line and the active character's last level line (`client log.ahk:20-45`).
- Then `Log_Loop` runs every **1000 ms** and reads appended text (`Exile UI.ahk:115`, `client log.ahk:349`). It only runs while the game or a tool window is focused (`:322`).
- Events parsed in `Log_Parse` (`client log.ahk:470-598`):
  - `Generating level <lvl> area "<areaID>" with seed <seed>` → areaID, arealevel, map tier (lvl−67 PoE1, lvl−64 PoE2), act (via the areas DB), timestamp (`:477-492`).
  - Login or `*****` → `login` (`:494`).
  - `… is now level N` with `name (Class)` → level and class for the configured character. `/whois` response as a fallback (`Log_CharacterInfo`, `:168-200`; `client.txt:145-147`).
  - `[info …] Name:` local chat → auto-switch the guide slot to that character. Hitting level 2 in Twilight Strand/G1_1 auto-assigns the character to the active guide (`:522-550`).
  - `set source [<area name>]` → area name (PoE1, `:539`).
  - `has been slain` or `has committed suicide` → map deaths. `You have killed # monsters` → kills (`:552-569`).
  - NPC dialogue prefixes → map-tracker mechanics and map events. `Spawning discoverable Hideout`. `Finished reloading online filter <tag>` (FilterSpoon confirmation).
- Includes a log-file "backup/trim" tool: it closes the game and moves Client.txt to `Client (old).txt`, keeping the last 500 KB (`Log_Backup`, `client log.ahk:83-166`).

### OCR
- Uses the Windows UWP `Windows.Media.Ocr` engine through COM (`data/External Functions.ahk:10159-10190`).
- Runs in a separate AHK process `modules/_ocr thread.ahk`. Request parameters go through a hidden GUI window's text; the result comes back via `WM_COPYDATA` (`_functions.ahk:576-633`, `Exile UI.ahk:1241-1250`). Timeout is 3 s.
- Used only by TLDR (PoE1), Statlas and Rune-Ninja (PoE2).
- Needs the English OCR language installed in Windows. Every OCR feature has an ALT debug window; Rune-Ninja also has a user auto-correct dictionary.
- Everything else uses pixel or template matching, not OCR. The README says the tool never reads game values or bars.

### Multithreading
- `modules/_secondary thread.ahk` runs as a second process for clone-frames rendering and pixel checks. It talks to the main process over WM_COPYDATA plus JSON in its window text (`Exile UI.ahk:1215-1232`, `Loop_main` `:839-851`). It can be disabled.

### Update mechanism
- Checks `raw.githubusercontent.com/Lailloken/Exile-UI/main/data/versions.json` and `changelog.json` (`_functions.ahk:713-731`). The check runs at start and every 30 minutes if auto-check is on (`Exile UI.ahk:747-751`).
- Install: download the GitHub tag zip `archive/refs/tags/v<ver>.zip` (or a branch for dev/hotfix), unzip via `FileCopyDir` (Windows zip shell), move the files over the tool folder, then reload (`_functions.ahk:780-845`). The settings "updater" page lists all versions for rollback.
- Data refreshes that don't need a release: act-decoder layouts zip, anoints JSON, betrayal JSON, legion CSVs, PoB tree JSON, leagues list, `announcements.json` (news, every 30 minutes).

### Install steps (wiki:Home)
1. Set the game to windowed or windowed-fullscreen at a supported height, and remove other window-mod tools.
2. Install **AutoHotkey v1.1 (not v2), 64-bit**.
3. Download the repo zip, extract it, and rename the folder. Don't put it on C: or in a cloud-synced folder, because write-permission problems have been reported.
4. Run `Exile UI.ahk`.
5. Hold ESC in game to open the menu-widget, then open settings.
6. In the general/client settings, set resolution, docking and borders. The wiki says to set these once and never change them.
7. In the hotkeys section, declare in-game rebinds.
8. Enable features one by one and calibrate the screen-checks each one needs.

### Settings storage
- Plain INI files: `ini\` for PoE1 and `ini 2\` for PoE2. `ini\config.ini` is shared (version, language, update and kill settings).
- One INI per feature: `config.ini`, `hotkeys.ini`, `leveling tracker.ini`, `leveling guide<N>.ini`, `screen checks (<h>p).ini`, `map tracker log.ini`, and so on.
- Calibration images go in `img\Recognition (<h>p)\…`; CSV exports in `exports\`.
- Overlay positions are saved in the INIs after dragging (e.g. `x-coordinate`/`y-coordinate`, `leveling tracker.ahk:515-519`).
- INI schema migrations are hard-coded by version (`Exile UI.ahk:457-532`).

### Language support
- UI text is in `data/<lang>/UI.txt`. Patterns for parsing the game client (item text, log lines, NPC names) are in `data/<lang>/client.txt`; this is a translator-facing key=value file (`data/english/client.txt` header). Only `english` ships; community packs are dropped in.
- The client language comes from the game config (`Exile UI.ahk:303-305`). An unknown language disables item features: the omni-key shows a "language" error (`omni-key.ahk:44-49`) and map-info is disabled. Korean is detected via KakaoClient.

### PoE2 handling
- PoE2 is a runtime flag `vars.poe_version = " 2"` that selects separate ini/data/img sets and branches.
  - Branches: different screen-check list (`screen-checks.ahk:44-54`), act structure with acts 1-4, interludes and epilogue (`leveling tracker.ahk:39-45`), map tier = arealevel − 64, gem-cutting overlay, waystones.
- Feature gates:
  - PoE1-only: betrayal, TLDR, geartracker, recombination, essence tooltip, lab.
  - PoE2-only: statlas, rune-ninja.

### Other platforms and inputs
- GeForce Now:
  - The window is detected by exe.
  - No clipboard or log access, so stash-ninja and the act tracker fall back to manual hotkeys.
  - Image and pixel variation is increased (`Init_geforce`, `Exile UI.ahk:443-451`).
- Controller: "input method 2", with limited support.

---

## 3. Leveling tracker in depth

### Import (`Leveltracker_Import`, `leveling tracker.ahk:1478-1539`)
- **Clipboard only; no URL fetch of exile-leveling.** The user copies the data, then clicks `import` in the settings for a guide slot. The clipboard content decides the path:
  - Contains `" areaid"` → treated as an **Exile UI custom guide JSON**. This is an array of acts → pages → lines, exported from the built-in editor (`:1136`) and written per act to `[Guide] act1..act10` in `leveling guide<N>.ini`.
  - Contains `pobb.in` → the tool fetches `<url>/raw` (`:1489-1495`), then imports it as PoB.
  - Anything else → treated as a raw **PoB export code**: base64, then zlib, then XML (`Leveltracker_PobImport`, `:2515`). It extracts class, ascendancies, bandit, skill sets/gem groups, every tree spec (node lists by `treeVersion`), and vendor preferences.
- The **default guide** ships as `data/english/[leveltracker] default guide.json` (PoE1) and `… guide 2.json` (PoE2). The wiki and help credit it as "originally derived from exile-leveling by HeartofPhos", with Cyclon/xebtria optimizations.
  - A leftover string, "gems only guides are not supported (exile-leveling has a gems-only option)" (`UI.txt:525`), shows that direct exile-leveling JSON import existed in the past. The current code no longer branches on it.
- **Guide format.** A page is a list of lines, or `{condition:[key,val], lines:[…]}` where the key is `league-start` or `bandit`. Line tokens:
  - `areaid<ID> ;; comment`: the target zone. The **last non-hint areaid on the page** becomes `target_area` (`:3184-3192`).
  - `(img:quest|waypoint|0-7 compass|portal|…)`, using icons from `img/GUI/leveling tracker/*.png`.
  - `<quest_id>` quest reward hooks, `(quest:x)`, `(hint)__` indented hint, `(color:RRGGBB)`, `(lvl:N)`, `kill X` (auto-highlight), `arena:X`.
  - Prefixes `leaguestart:` / `twinkrun:` / `optional:` are filtered by the slot toggles (`UI.txt:546-552`).
- **Build-aware rewriting** (`Leveltracker_Load`, `:1541-1714`). With a PoB imported, the tool uses `[leveltracker] gems.json` (quest/vendor availability per class) to:
  - inject `(hint)__ gem reward: X` lines (colour by attribute),
  - insert `buy gem: X` lines,
  - drop quest hand-ins with no relevant reward or mark them `(img:skip)`,
  - add Lilly hideout purchases when not league-start.
- **Gem-pickup configurator:** a per-gem act override plus skip.

### Step advancement
- `Log_Loop` checks `vars.log.areaID == guide.target_area`. If it matches and more than 2 s have passed since a manual page change, it calls `Leveltracker("+")` (`client log.ahk:450-451`).
- `Leveltracker_Progress` is also re-run on level change or on entering a hideout or a known campaign zone, to redraw the exp display and the target (`client log.ahk:383-387`).
- The overlay hides in the lab, the sanctum and `g3_10` (`:389-390`).
- Manual control:
  - `<` / `>` buttons, or F3/F4 if page hotkeys are enabled.
  - Long-press `>` fast-forwards until a page that references the **current areaID** ("re-sync") (`leveling tracker.ahk:375-447`).
  - Long-press `<` resets progress.
- Progress is saved as `[Progress] pages=N` in the slot INI.

### Supporting data and images
- `[leveltracker] areas*.json`: id, name and level per act. It drives the exp calculation, act detection and level recommendations (PoE2 "recommendation" field).
- Effective-exp formula: PoE1 safe-zone formula in `Leveltracker_Experience` (`:554-584`). PoE2 shows only the level difference with green/yellow/orange/red colouring.
- **Hint images:** `img/GUI/leveling tracker/hints[ 2]/*.jpg` (26 for PoE1). A line containing a hint key's text is highlighted teal, and holding WK shows the picture (`Leveltracker_Hints`, `:1407-1452`). Crafting-recipe hints come from the areas DB.
- **Zone layouts** are a separate feature (Act-Decoder, keyed by areaID). Gem setups come from PoB, not from images: holding OK over a gem shows every PoB skill set containing it, and the scroll wheel switches sets (`Leveltracker_PobGemLinks`, `:2322`).
- **Passive tree overlay:**
  - Rendered from PoB node lists plus tree JSON. Bundled trees: 3_28, 3_29, PoE2 0_4/0_5; others are downloaded from GitHub (`:2796`).
  - Opened by OK on the tree (`skilltree` SC). Q/E switch specs, W shows an overview, 1-4 show ascendancy trees, MMB snaps the centre. Green marks new nodes, red marks respecs.
  - Alternative: manual screenshot slots (paste or snip) per slot.
- PoE2 **gem-cutting overlay**: OK on an uncut gem opens the gem-cutting UI and pastes a regex for each gem group.
- PoE1 **Lilly/vendor gem search strings** are auto-generated on PoB import, chunked to fit the 250-character search limit.

### Customization
- Up to 9 guide slots, each with its own guide, progress, PoB, tree images, timer and character binding.
- Toggles per slot: league-start, optionals, bandit (PoE1), gem-quests, "all gem quests".
- Full **guide editor** (`Leveltracker_GuideEditor`, `:860-1406`):
  - pages grouped per act, conditions per page, search, live preview, colour picker, insertion helpers for areaid/quest/img tokens;
  - export JSON to the clipboard; reset to the default guide;
  - edited guides are protected from default-guide updates.
- Overlay: font size, transparency, auto-fade after N seconds (shown again on hover or in town), position by drag.
- Timer:
  - act splits are written to `exports\campaign runs[ (PoE 2)].csv` (`:3680-3696`);
  - pauses when the window is unfocused or the player is AFK for 10 s; optional hideout pause; flashes while paused.
- Geartracker (PoE1): OK over items adds them to a list; a "gear rdy" notice appears when your level meets the item's requirement.

---

## 4. Setup friction visible in the code

1. **AutoHotkey v1.1.36+ 64-bit must be installed separately.** There is no compiled exe, and v2 is rejected (`#Requires`, `Exile UI.ahk:3`). The OCR and secondary threads are launched with `A_AhkPath` (`:1220`, `_functions.ahk:601`).
2. **Windowed or windowed-fullscreen only.** Exclusive fullscreen causes a hard error (`Exile UI.ahk:281`). The tool depends on reading the game's `production_Config.ini`; if the file can't be found the user picks it in a file dialog, and if it fails to parse the tool restarts and resets setup.
3. **Fixed resolution whitelist.** Other heights require forcing a custom resolution through the tool, and 768/1024/1050 are banned. The tool moves and resizes the game window on every launch. Changing monitor or resolution invalidates every calibration, which is stored per height.
4. **Manual calibration everywhere** (§2 Screen-checks). Each SC-based feature needs Info, then Cal, then Test with the UI open and closed, and calibrations break after patches that change textures. Betrayal image mode, cheat sheets, search strings, sanctum and map-tracker screen mechanics add more manual snips.
5. **In-game settings the user must match:**
   - declare rebound C/Alt keys; the omni-key relies on the default copy shortcut;
   - enable "output dialogue to chat" for mechanic tracking and map events;
   - enter the in-game key for "toggle highlighting" (TLDR) and the portal key (portal reminder);
   - PoE1 stash needs at least one folder;
   - enter the character name for level tracking.
6. **Admin rights:** not required by default. The wiki says running as admin fixes the long-ESC menu for some users. Write-permission problems (C: drive, OneDrive/Google Drive folders) have a dedicated "write permissions" test in settings (help `write permissions`).
7. **Windows OCR language pack:** English must be installed as a secondary language for TLDR, Statlas and Rune-Ninja.
8. **Clipboard and chat injection:** the omni-key clears and overwrites the clipboard. Macros, search strings, FilterSpoon and `/kills` paste through chat, so the chat box must be closed but accessible.
9. **CapsLock side effects:** the default omni-key is CapsLock, and AHK toggles CapsLock, which can trigger voice-chat binds. There is an opt-out.
10. **Log size:** large Client.txt files slow startup (3 MB backward reads, `client log.ahk:20-45`). The settings show the log size and load time and offer a backup/trim tool that must close the game.
11. **Single client only.** Overlays are separate top-level windows, so the user must keep focus on PoE or tool windows. Overlays hide when anything else has focus for about 3 ticks (`Exile UI.ahk:937-948`).
12. **Updates** are unpacked over the install folder. A legacy-to-v1.50 jump needs a clean install (`Exile UI.ahk:460-463`).
