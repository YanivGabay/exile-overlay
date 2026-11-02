# Exile Overlay: GGG rules and tech options

Research date: 2026-11-02. Read-only research; nothing was posted anywhere.
Labels: **[primary]** means GGG's own docs, ToS, or a GGG staff post. **[secondary]** means a community or press source. **[est]** means my own estimate, not measured.

---

## TL;DR

1. GGG's only written policy for local tools is the **"API Policies and Third-Party Requirements"** section of pathofexile.com/developer/docs. It allows reading Client.txt, allows standalone executables ("not encouraged, but permitted"), limits macros to one manual action per invocation, forbids anything that "interacts with the game or game files", and requires a non-affiliation notice.
2. GGG never approves a specific tool. Staff repeatedly say "we cannot comment on the legality of third-party tools." A GGG staff member said in 2024 that Awakened PoE Trade has "aspects... that probably violate the ToS", yet it remains widely used.
3. Our feature set is the same pattern Awakened PoE Trade, Exiled Exchange 2 and Exile UI have shipped for years: a leveling tracker driven by Client.txt plus item info triggered by a user hotkey that sends Ctrl+C. Do not read or inject into process memory, do not automate input, do not trigger macros from timers or screen reading, and do not ship a logout macro.
4. Tech recommendation: **Electron + `electron-overlay-window` + `uiohook-napi`**, the APT/EE2 stack, which is proven on PoE1 and PoE2. Keep the UI as a framework-neutral React/TS package so a later **Tauri v2** port stays possible. Do Windows releases on GitHub Actions `windows-latest`. Tauri is the runner-up: the installer is about 10x smaller, but there is no overlay-tracking library and no click-through mouse-forwarding.

---

## Part A: GGG rules

### A1. Primary sources

| Source | What it says |
|---|---|
| Developer docs, "API Policies and Third-Party Requirements" (`#policy`): https://www.pathofexile.com/developer/docs/index#policy **[primary]** | **Websites/web apps:** "Little to no risk for end users." **Executable apps that run independently from the game:** "While not encouraged, these are permitted." / "Reading the game's log files is okay as long as the user is aware of what you are doing with that data." **Macros:** "Automation of key-strokes (or other inputs) that affect the game in any way must follow our macro rules: Macros must be invoked manually by the user; automated invocations such as but not limited to: timers, reacting to file changes or from reading the screen are not allowed. Each macro invocation must have one set function (it cannot cycle between actions). The resulting function must only perform one action that interacts with the game." **Executables that interact with the game or game files:** "strictly against our Terms of Use (7b, 7c, 7i)... Creation or use of these type of applications will result in immediate account termination." |
| Same page, developer guidelines **[primary]** | Must not imply GGG endorsement and must not use logos to imitate official platforms. Public apps must show: *"This product isn't affiliated with or endorsed by Grinding Gear Games in any way."* No credentials in code or binaries. One product per registered application. Desktop executables must use a **public** OAuth client. Do not reverse-engineer undocumented endpoints. Requests for "any other internal website APIs or in-game resources will be denied." Shipping features that break the guidelines "can terminate both your account and your users' accounts." |
| Same page, **app registration** **[primary]** | At fetch time the page said: *"We are currently unable to process new applications."* We probably **cannot get an OAuth client right now**. Design so OAuth is optional. |
| Same page, rate limits (`#ratelimits`) **[primary]** | Responses carry `X-Rate-Limit-Policy`, `X-Rate-Limit-Rules` (ip/account/client), `X-Rate-Limit-{rule}` (hits:period:restriction-seconds), `X-Rate-Limit-{rule}-State` and `Retry-After`. These "should be parsed and followed." 4xx responses (401/403/429) count as invalid requests: "Reasonable attempts must be made in order to avoid passing the threshold." "Exceeding these limits frequently will result in your application access being revoked." Limits "can change at any time." |
| User-Agent requirement (developer docs) **[primary]** | Every request must send `User-Agent: OAuth {clientId}/{version} (contact: {contact})`. |
| OAuth: https://www.pathofexile.com/developer/docs/authorization **[primary]** | Public (desktop) clients: Authorization Code **with PKCE (S256)** only, a local redirect such as `http://127.0.0.1:8080/callback`, and **no `service:*` scopes**. Users see an "unverifiable" warning. Public clients share rate limits with all other public clients. Tokens: access 10 h, refresh 7 days, and refresh does not extend the expiry. Account scopes: `account:profile`, `account:leagues`, `account:stashes`, `account:characters`, `account:league_accounts`, `account:item_filter`. |
| API reference: https://www.pathofexile.com/developer/docs/reference **[primary]** | **No trade-search endpoint is documented.** PoE2 (`realm=poe2`) is supported only for characters, leagues/ladder, item filters and the public Currency Exchange endpoint (`web.poecdn.com/api/currency-exchange/poe2`). The docs say "There are currently limited APIs that return PoE2 game information." Stashes and the Public Stash API are PoE1 only. |
| Terms of Use: https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy **[primary]** | Clause 7, "without the prior written approval of GGG" you may not: (7.2) "Modify or adapt (including through third parties and third-party tools) the game client or its data"; (7.3) "Utilise any automated software or 'bots'"; (7.5) "Connect to the Servers through any software other than the authorised game client software"; (7.6) use "data gathering and extraction tools" on the Website; (7.9) reverse engineer or decompile. Clause 22 forbids circumventing API limits. Clauses 6 and 17 allow termination, account cancellation and IP blocks. The ToS **does not name** overlays, clipboard, OCR or memory reading explicitly. Memory reading falls under 7.2/7.9 and the dev-docs "interact with the game" ban. |
| Sian_GGG, Nov 3 2024: https://www.pathofexile.com/forum/view-thread/3584808 **[primary]** | "we cannot comment on the legality of third-party tools, as we aren't able to thoroughly and accurately check exactly how they work. We do not encourage the creation or use of third-party tools because they provide advantages for players that use them." GGG cannot guarantee a tool stays allowed. |
| Chulainn_GGG, Jan 4 2024, on APT: https://www.pathofexile.com/forum/view-thread/3474232 **[primary]** | "Many people use Awakened PoE Trade without issue, but there are aspects about it that I think probably violate the ToS." |
| GGG support reply on APT (relayed by a user, Oct 2020): https://www.pathofexile.com/forum/view-thread/2972236 **[primary, relayed]** | "All we can suggest is not using any software that may interact with the game files or offer an in game advantage." |
| Bex, after checking with Chris Wilson (Reddit, relayed on the forum Nov 2020): https://www.pathofexile.com/forum/view-thread/2996559/page/2 **[primary, relayed]** | "You may not run programs that interact with the Path of Exile game client." Described as the policy of "the last eight or so years." |
| GGG cheat warning, 2015: https://www.dsogaming.com/news/path-of-exile-cheaters-warned-a-final-time/ **[secondary, quotes GGG]** | "Do not run cheating software such as maphacks or bots. Further use of cheating software will result in the termination of your Path of Exile account." Maphacks such as PoEHUD/ExileApi work by reading memory. |

I found **no** Jonathan Rogers statement on third-party tools. Searches for Chris Wilson's own words on logout macros found only second-hand paraphrases (see A2).

### A2. Behaviour by behaviour

| Behaviour | Status | Basis |
|---|---|---|
| **Read Client.txt** (zone changes, level-ups, whispers) | **Allowed** (explicit) | Dev docs: "Reading the game's log files is okay as long as the user is aware..." Disclose it in the UI and privacy text. https://www.pathofexile.com/developer/docs/index#policy |
| **Ctrl+C / Ctrl+Alt+C item copy** sent on a user hotkey, then read the clipboard | **Allowed in practice; grey on paper** | One manual invocation and one game-facing action meets the macro rule. Industry standard since POE-TradeMacro (APT, EE2, Sidekick, Exile UI). Chulainn_GGG's "probably violate" comment shows it is tolerated, not blessed. |
| **One action per keypress** (macros) | **Rule** | "Each macro invocation must have one set function... only perform one action that interacts with the game." Chat commands such as `/hideout` count as one action: https://pathofexile.com/forum/view-thread/2077975 (community guide, not staff). |
| **Toggles, cycling, timers, sequences** | **Forbidden** | "cannot cycle between actions"; "timers, reacting to file changes... not allowed." |
| **Triggering input from screen reading or pixel detection** | **Forbidden** | "automated invocations... from reading the screen are not allowed." |
| **Pixel or screen checks used only to show, hide or move our own overlay** (no game input) | **Grey, widely shipped** | Not a macro, so the macro rule doesn't apply. Exile UI does this and says it "never reads/checks game-related values or bars": https://github.com/Lailloken/Exile-UI (README Transparency Notice), https://github.com/Lailloken/Exile-UI/wiki/Screen-checks. No GGG ruling exists. |
| **OCR of on-screen text on a user keypress** (display only) | **Grey** | Not forbidden by any text. Exile UI does it with Windows.Media.Ocr. Never use OCR results to send input. |
| **Overlay window drawn over the game** (separate top-level window, no injection) | **Tolerated; not addressed in writing** | No policy text on overlays. Overwolf PoE Overlay II, APT, EE2 and Sidekick all do it, and GGG answers questions with "cannot comment" (https://pathofexile.com/forum/view-thread/3637217). **In-process overlays (DLL injection or D3D present hooks) count as "interacting with the game client" and are forbidden.** |
| **Memory reading or writing, DLL injection, packet reading or modification** | **Forbidden; bannable** | ToS 7.2/7.5/7.9, dev-docs "interact with the game" ban ("immediate account termination"), and the 2015 maphack warning above. Note that Poe-Lurker's hook library Winook "uses host processes and DLL injection to set up hooks" (https://github.com/macote/Winook). Avoid that pattern. |
| **Logout macros** | **Grey; don't ship** | No current written GGG ruling. Forum sources relay a past Chris Wilson acceptance of instant logout as a mechanic (https://www.pathofexile.com/forum/view-thread/2073591), with conflicting interpretations (https://www.pathofexile.com/forum/view-thread/2196574). Auto-logout at a health threshold violates "reading the screen". LutBot-style TCP-socket killing touches the client's connection (ToS 7.5 risk). Out of scope for us. |
| **Trade search (`/api/trade/search`, `/api/trade/fetch`)** | **Grey** | Undocumented "internal website API". APT proxies it with Electron's default UA and session cookies, and implements an `X-Rate-Limit` parser (`main/src/proxy.ts`, `renderer/src/web/price-check/trade/RateLimiter.ts` in https://github.com/SnosMe/awakened-poe-trade). If we use it, obey the headers strictly, send an honest UA, and keep invalid requests (429/4xx) near zero. A user claims some price-checker bans come from API spam (https://www.pathofexile.com/forum/view-thread/3584808, user post). |
| **Documented APIs** (characters, item filters, currency exchange) | **Allowed with OAuth** | We probably can't register right now ("unable to process new applications"). The Currency Exchange endpoint is public and covers poe2. |
| **Upload or modify item filters via API** | Allowed (`account:item_filter`) | API reference. Writing filter *files* on disk is long-standing practice (FilterBlade, NeverSink). |
| **Branding** | Rule | Show the non-affiliation notice and don't use GGG logos as our app identity. |

### A3. PoE2-specific notes

- The same ToS and dev-docs policy cover PoE2; no separate PoE2 tool policy exists. PoE2 API coverage is narrower (A1).
- Several reports describe false-positive "cheating software detected" pop-ups in PoE2 early access, December 2024: https://sportskeeda.com/mmo/path-exile-2-cheat-detection-system-flagging-players-randomly-new-patch [secondary] and https://web.poecdn.com/forum/view-thread/3776258 (not fetchable, 403). GGG runs **client-side detection**, but I found **no evidence of a kernel-level anti-cheat** in PoE1 or PoE2.
- One user reports a ban after using Exiled Exchange 2 through GeForce Now (May 2025). The appeal was auto-denied and support removed details, so the cause is unconfirmed: https://www.pathofexile.com/forum/view-thread/3777565. Treat it as anecdotal; cloud gaming plus local tooling is unusual.
- PoE2 now has a **built-in in-town price check** (forum complaint thread, May 2026, "PRICE CHECK ONLY IN TOWN"): https://www.pathofexile.com/forum/view-thread/3934444. For PoE2 this lowers the value of a price-check feature and raises the value of leveling and item-evaluation features.

### A4. Compliance design rules for our overlay

1. A separate top-level window only. No injection, no memory access, no D3D hooks, no packet sniffing.
2. Input sending is limited to **one keystroke combo per user hotkey** (Ctrl+C / Ctrl+Alt+C, or optionally one chat command). Never on a timer, never from Client.txt or screen events, no toggles or sequences.
3. Client.txt and screen data drive **display only**.
4. Network: a documented API, or a strictly rate-limited trade API via official headers with an identifiable UA. Cache poe.ninja/RePoE-style static data.
5. Show the non-affiliation notice and a transparency page (what we read and what we send), modeled on Exile UI's README notice.

---

## Part B: Tech options

### B1. Existing overlays (GitHub data pulled 2026-11-02 via `gh`)

| Project | Stack | Stars / last push / latest release | Overlay technique | Hotkeys and copy | Updates / installer | Known problems |
|---|---|---|---|---|---|---|
| **Awakened PoE Trade** (SnosMe/awakened-poe-trade) | Electron 40 main process (TS, esbuild) + **Vue 3** renderer (Vite, Tailwind) | 2,593★ / 2026-09-24 / v3.29.108 (2026-09-09) | `electron-overlay-window` 4.1: a frameless, transparent, skip-taskbar BrowserWindow kept aligned to the PoE window by title through `SetWinEventHook` (foreground, location-change, minimize, destroy). Click-through via `setIgnoreMouseEvents(true)`. A "Shift+Space" toggle makes it interactive (`OverlayController.activateOverlay/focusTarget`). | `uiohook-napi` (libuiohook low-level hooks) for observing and sending keys. `HostClipboard.ts` clears the clipboard, sends Ctrl+C, polls every 48 ms for up to 500 ms, and restores the old clipboard after 120 ms. | electron-updater; NSIS Setup.exe **~98 MB** plus a portable exe | Overlay needs **windowed/borderless**, not exclusive fullscreen (https://steamcommunity.com/app/238960/discussions/0/1842367319517845549). AV false positives (#48 FileRepMalware, #797). FPS issue #218. Washed-out ShadowPlay recordings #1936. Wrong offsets at some resolutions #1281. Wayland click issues #1933. Must run as admin if the game is elevated. |
| **Exiled Exchange 2** (Kvan7/Exiled-Exchange-2) | Fork of APT for PoE2, same stack | 1,194★ / 2026-09-17 / v0.16.3 | Same (`electron-overlay-window` 4.0.2) | Same (`uiohook-napi`) | electron-updater; **~103 MB** | Same as APT, plus the unconfirmed ban anecdote above |
| **Sidekick** (Sidekick-Poe/Sidekick) | C# **.NET 10 + Blazor** UI. Hosts: **WPF + WebView2** (`Microsoft.AspNetCore.Components.WebView.Wpf`) on Windows, **Avalonia + WebView** on Linux, also MAUI and a Docker web build | 513★ / 2026-11-02 / v2026.10.1 | WPF `BrowserWindow` with `Topmost = true` hosting a WebView2 Blazor UI. Shown on hotkey, not a permanently tracked click-through layer. | **SharpHook** (libuiohook for .NET) and **TextCopy** | **Velopack** (full ~98 MB, delta ~14 MB) | Supports PoE1 and PoE2. The Blazor/C# UI can't share code with React. |
| **PoE Overlay Community Fork** (PoE-Overlay-Community/PoE-Overlay-Community-Fork) | Electron + **Angular**. The original moved to Overwolf ("PoE Overlay II") in 2020. | 491★ / 2026-09-01 / v0.9.0 | Electron transparent window | Electron and native hooks | electron-updater; **~92 MB** | Maintenance mode; the original author went to Overwolf |
| **Exile UI** (Lailloken/Exile-UI) | **AutoHotkey v1.1** (`#Requires AutoHotkey >=1.1.36 <2`) | 1,379★ / 2026-10-20 / v1.65.1 (source zip, no binaries) | AHK GUI windows (`AutoHotkeyGUI`). **Pixel/image "screen checks"** to detect open UIs, plus "clone frames" that project screen regions. | AHK hotkeys and `Send`. **OCR via UWP `Windows.Media.Ocr`** (`ocr_uwp`, `modules/_ocr thread.ahk`). | Self-updating script; needs AHK installed | **Closest to our feature set** (Act-Tracker leveling guide from Client.txt, compact item-info tooltips, PoE1+PoE2). Screen checks need recalibration after game patches. AHK v1 is legacy. |
| **Poe-Lurker** (C1rdec/Poe-Lurker) | C# WPF (.NET 8), MahApps | 607★ / 2026-05-18 / v2.2.2 (2025-11) | WPF transparent windows | **Winook = DLL injection into the game process for thread-level hooks**, a risk pattern we must avoid | Squirrel/Velopack-style nupkg; **~80 MB**; SignPath code signing | Trade-manager focus (whispers via Client.txt) |
| **Chromatic** (web calculators such as siveran's) | Website | n/a | Not an overlay; web-only tools carry the lowest risk per GGG | n/a | n/a | n/a |
| **Overwolf PoE Overlay II** (https://poeoverlayii.overwolf.com/) | Overwolf (CEF) | n/a | Overwolf in-game overlay platform | n/a | Overwolf client | Third-party platform dependency; data-sharing concerns raised by users |

`electron-overlay-window` (SnosMe/electron-overlay-window): 241★, last push 2026-04-16. The README lists **Windows 7–10** and X11. It is used on Windows 11 in practice by APT and EE2. It supports one overlay window per process, finds the target by title, and only works with top-level windows. Source: https://github.com/SnosMe/electron-overlay-window

### B2. Framework comparison for our build

| Criterion | **Electron** | **Tauri v2** (WebView2) | **C# WPF/WinUI** (+WebView2 or native XAML) | **AHK v2** |
|---|---|---|---|---|
| React/TS reuse from the poetools.dev monorepo | **100%** of UI and logic. Main process is also TS. | **100%** of the UI. Native side (hooks, overlay tracking, OCR, SendInput) must be written in **Rust**. | WebView2 host: UI reuse ok, all native code in C#. Native XAML: none. | None |
| Game-window overlay tracking | **Off-the-shelf**: `electron-overlay-window`, proven on PoE | **No equivalent library.** Build it with the `windows` crate or `wineventhook` (https://docs.rs/wineventhook) plus `set_position/set_size`, about 300–600 LOC [est] | Easy with P/Invoke (`SetWinEventHook`, `SetWindowPos`) | `WinGetPos` polling or a `SetWinEventHook` callback |
| Click-through with interactive regions | `setIgnoreMouseEvents(true, {forward:true})`: Chromium still gets mouse-move, so hover regions can toggle click-through (Windows/macOS). Docs: https://www.electronjs.org/docs/latest/api/browser-window | `setIgnoreCursorEvents(bool)` only, which is all-or-nothing `WS_EX_TRANSPARENT`. **The forward option is an open feature request**: https://github.com/tauri-apps/tauri/issues/6164. Workaround: poll the cursor position in Rust and toggle. Open bug with transparent always-on-top windows going black on Win10 when toggling cursor events: https://github.com/tauri-apps/tauri/issues/15947 | Full control (`WS_EX_TRANSPARENT/LAYERED`, per-pixel hit test in native XAML). WebView2 itself swallows clicks on transparent areas: https://github.com/MicrosoftEdge/WebView2Feedback/issues/1004 | Native (`WinSet, ExStyle, +0x20`) |
| Global hotkeys | `globalShortcut` (RegisterHotKey, swallows the key) or `uiohook-napi` (observe and send) | `tauri-plugin-global-shortcut` (RegisterHotKey) or a Rust LL hook (`rdev`/`windows`). SendInput via `enigo`/`windows`. | SharpHook / P/Invoke | Native, the best ergonomics |
| Sending Ctrl+C and reading the clipboard | Proven (`uiohook-napi` keyTap plus `clipboard`) | `enigo` + `tauri-plugin-clipboard-manager` | SendInput + Clipboard | `Send ^c` + `Clipboard` |
| OCR (Windows.Media.Ocr) | Needs a native addon or sidecar (small Rust/C# exe). No maintained Node binding found. | **Direct** via the `windows` crate (`Windows::Media::Ocr::OcrEngine`). Requires MTA; no packaging needed: https://docs.rs/crate/windows/latest/source/src/Windows/Media/Ocr/mod.rs | **Direct** (WinRT projection) | Proven (Exile UI) via COM/WinRT calls |
| Installer and auto-update | electron-builder NSIS (~90–100 MB, per APT/EE2 releases) + electron-updater (GitHub Releases) | NSIS **~3–10 MB** [est]; WebView2 ships with Win11. Signed updates through `tauri-plugin-updater` (https://v2.tauri.app/plugin/updater/) | Velopack (~80–100 MB self-contained, or a few MB framework-dependent; delta updates) | Script plus AHK runtime, or a compiled exe (often flagged by AV) |
| RAM | ~200–350 MB [est] (Chromium multiprocess) | ~80–150 MB [est] (msedgewebview2 processes) | 60–120 MB native XAML; +WebView2 similar to Tauri [est] | 20–40 MB [est] |
| AV false positives | Occasional (APT #48, #797). Mitigate with code signing. | Lower than Electron, but low-level hooks and SendInput in unsigned binaries can trigger heuristics | Same as Tauri | **High**: compiled AHK is often flagged [general knowledge, unverified] |
| DPI / multi-monitor | Handled in `electron-overlay-window` (setBounds twice when the monitor DPI changes) | Physical vs logical pixels via `scaleFactor()`; must be handled ourselves | Per-monitor-v2 manifest; mature | Manual |
| Exclusive fullscreen | **No** (borderless only) | **No** | **No** (without injection) | **No** |
| Dev from WSL2 | Renderer runs in WSL (Vite, browser). The main process with native modules must run on Windows, so keep a Windows-side `npm install` or run it in CI. electron-builder can target Windows from Linux with Wine/Docker, but native-module prebuild handling is fiddly. | **Officially supported cross-compile**: `npm run tauri build -- --runner cargo-xwin --target x86_64-pc-windows-msvc` produces an NSIS installer from Linux. MSI needs Windows. https://v2.tauri.app/distribute/windows-installer/. The built `.exe` can be launched from WSL via interop. **Best WSL story.** | `dotnet build` with `EnableWindowsTargeting=true` compiles WPF on Linux, but it can't run or test there | Edit in WSL, run on Windows; no build step |
| CI (GitHub Actions) | `windows-latest`: `npm ci && electron-builder --win --publish` (as APT does) | `windows-latest` with `tauri-apps/tauri-action`, or a Linux runner with cargo-xwin | `windows-latest` + Velopack `vpk pack` | n/a |
| Code signing | Needed for SmartScreen and AV. Azure Trusted/Artifact Signing or SignPath (free for OSS, used by Poe-Lurker) | Same | Same | Same |
| Proven on PoE | **Yes** (APT, EE2, PoE Overlay) | No public PoE overlay found | Yes (Sidekick, Lurker) | Yes (Exile UI, TradeMacro) |

### B3. Recommendation

**Electron (TS main process) + `electron-overlay-window` + `uiohook-napi`, renderer in React, packaged with electron-builder NSIS + electron-updater, released from GitHub Actions `windows-latest`.**

Reasoning:
- **Lowest technical risk.** The hardest parts (title-based window tracking, foreground and minimize events, DPI moves, click-through with mouse-forward, interactive toggle, clipboard copy with restore) are solved and battle-tested on exactly PoE1 and PoE2 by APT and EE2 (3.8k★ combined). All the code is MIT, so we can study it and copy patterns.
- **Maximum reuse.** The poetools.dev monorepo is TS/React. Item parsers, data and UI can be shared packages, and even the main process is TS. Tauri would force a Rust layer for every native concern.
- **Compliance by construction.** An out-of-process overlay, user-triggered single Ctrl+C, and Client.txt reading are the exact behaviours GGG's policy explicitly permits or long tolerates.
- **Costs we accept:** a ~100 MB installer and ~250 MB RAM, plus Electron upgrade churn with the native modules (APT pins and patches them).
- **WSL workflow:** develop the overlay UI as a normal Vite app in WSL against fixtures (sample Client.txt lines and item clipboard texts). Run a mock "game window" mode in the browser. Test the real shell on Windows from a Windows-side checkout or the CI artifact. Build releases only on `windows-latest`.

**Runner-up: Tauri v2.** Choose it if a small download (~5 MB) and low RAM are product priorities, or if OCR becomes central (native `Windows.Media.Ocr`). Budget for writing our own Rust overlay tracker (`SetWinEventHook`) and cursor-polling click-through, since tauri#6164 is still open. Keeping the UI framework-neutral (no `electron` imports in UI packages, IPC behind one interface) keeps this migration cheap.

**Not recommended:** C# WPF/WinUI, because it shares nothing with the TS codebase (Sidekick shows it works, but only with a Blazor UI). AHK v2 is great for prototypes and Exile UI proves the feature set, but it brings AV flags, no code reuse, and a poor UI-customization story.

**Do not** use Overwolf (platform dependency), DLL-injection hook libraries (Winook-style), or any in-process rendering.

---

## Source list
- https://www.pathofexile.com/developer/docs/index#policy, #ratelimits
- https://www.pathofexile.com/developer/docs/authorization
- https://www.pathofexile.com/developer/docs/reference
- https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy
- https://www.pathofexile.com/forum/view-thread/3584808 (Sian_GGG)
- https://www.pathofexile.com/forum/view-thread/3474232 (Chulainn_GGG)
- https://www.pathofexile.com/forum/view-thread/2972236 (support reply, relayed)
- https://www.pathofexile.com/forum/view-thread/2996559/page/2 (Bex/Chris, relayed)
- https://pathofexile.com/forum/view-thread/2077975 (community macro guide)
- https://www.pathofexile.com/forum/view-thread/2073591 , https://www.pathofexile.com/forum/view-thread/2196574 (logout discussions)
- https://pathofexile.com/forum/view-thread/3637217 (Overwolf overlay question)
- https://www.pathofexile.com/forum/view-thread/3777565 (EE2 ban anecdote)
- https://www.pathofexile.com/forum/view-thread/3934444 (PoE2 in-town price check)
- https://www.dsogaming.com/news/path-of-exile-cheaters-warned-a-final-time/
- https://sportskeeda.com/mmo/path-exile-2-cheat-detection-system-flagging-players-randomly-new-patch
- https://github.com/SnosMe/awakened-poe-trade , https://github.com/SnosMe/electron-overlay-window , https://github.com/Kvan7/Exiled-Exchange-2 , https://github.com/Sidekick-Poe/Sidekick , https://github.com/PoE-Overlay-Community/PoE-Overlay-Community-Fork , https://github.com/Lailloken/Exile-UI , https://github.com/C1rdec/Poe-Lurker , https://github.com/macote/Winook
- https://www.electronjs.org/docs/latest/api/browser-window
- https://v2.tauri.app/distribute/windows-installer/ , https://v2.tauri.app/plugin/updater/ , https://github.com/tauri-apps/tauri/issues/6164 , https://github.com/tauri-apps/tauri/issues/15947
- https://github.com/MicrosoftEdge/WebView2Feedback/issues/1004
- https://docs.rs/wineventhook , https://docs.rs/crate/windows/latest/source/src/Windows/Media/Ocr/mod.rs
