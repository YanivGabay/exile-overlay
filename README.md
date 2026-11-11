# Exile Overlay

A leveling overlay for Path of Exile 1 that sets up in a minute and stays out of your way. It reads the game's log file to know which zone you're in and moves the guide on when you change zones. It never touches game memory or files and never sends inputs.

**[Download the latest release](https://github.com/YanivGabay/exile-overlay/releases/latest)** · Windows · free and open source (MIT) · beta for the 3.30 league

![The guide over the game in a zone, with gem links and the passive tree on the left](docs/screenshots/zone-with-build.png)

## Quick start

1. **Install.** Download `ExileOverlay-Setup-<version>.exe` from the [latest release](https://github.com/YanivGabay/exile-overlay/releases/latest) and run it. The beta isn't code-signed: if Windows says "Windows protected your PC", click **More info** → **Run anyway**. ([Install notes](docs/install.md))
2. **Set up.** The Setup window opens by itself:
   - Choose how you play: league start, speedrun, SSF/hardcore-safe or first time.
   - Optionally, paste your Path of Building code or link.
   - Click **Done**.

   ![Setup: live checks for the game window, game log and guide, then how you play](docs/screenshots/setup.png)
3. **Play.** Start Path of Exile in **Windowed** or **Windowed Fullscreen** and log in. The guide appears on the right once you enter a zone. The game log is found automatically. If the game's in an unusual folder, Setup offers **Choose Client.txt…**.

| Key | Does |
|---|---|
| F4 / F3 | next / previous zone, if the guide is off |
| Shift+F4 | jump to the zone you are in |
| F6 | move and resize panels (press again to save) |
| F7 | hide or show the overlay |

All keys can be changed under Settings → Hotkeys. Settings opens from the tray icon.

## What you get

- Each zone shows what to do and where to go next, and the guide moves on by itself as you change zones.
- Your build's gems and links for your level, what to take from quests and what to buy, and which passive tree fits now.
- In town, vendor search text to copy in one click: links, movement speed boots, +1 wands, weapon recipe bases.
- Reminders that matter: boots, weapon upgrades, level checks before big bosses, danger zones, Kitava's resistance penalty.
- A campaign timer with act splits and live pace against your best run, plus a run summary to share at the end.
- League tips for the current league, marked "unconfirmed" until they're checked in game.
- Movable, resizable panels that fade while you play; layouts are saved per game resolution.

| In town with a build | Layout edit mode (F6) |
|---|---|
| ![Town: gem shopping list and vendor search](docs/screenshots/town-with-build.png) | ![Edit mode: drag, resize, fade](docs/screenshots/edit-mode.png) |

## What it reads and sends

- **Reads** the game's log file (`Client.txt`) for your zone, character name, class and level. Nothing else on your PC.
- **Downloads** guide updates from [exile-overlay-guides](https://github.com/YanivGabay/exile-overlay-guides), app updates from this repo's releases, and the build links you paste.
- **Never** reads or changes game memory or files, sends keys or clicks to the game, or uploads anything about you.
- Draws in its own transparent window on top of the game; it never moves or resizes the game window.

## Problems?

Settings → **Diagnostics** shows what the overlay sees and, in red, what's missing. **Copy report** gives you a report without your user or character names; paste it into an [issue](https://github.com/YanivGabay/exile-overlay/issues). More in [docs/install.md](docs/install.md).

## Contributing

- **A wrong route step or tip:** press F6 in game and click **report** next to the step; it opens a pre-filled issue in [exile-overlay-guides](https://github.com/YanivGabay/exile-overlay-guides). Route fixes ship to every player within 30 minutes, without an app update.
- **A bug in the app:** open an [issue](https://github.com/YanivGabay/exile-overlay/issues) with the Diagnostics report.
- **Code:** pull requests are welcome. Run `npm test` and `npm run typecheck` first, and keep content your own (no text or images copied from other guides).

## Development

Node 24 (`nvm use`), then:

```sh
npm install
npm test               # vitest, all workspaces
npm run typecheck
cd apps/overlay && npm run dev    # needs Windows to attach to the game
```

`npm run dist` in `apps/overlay` builds the installer (Windows). Releases are built by CI from a `v*` tag: see [docs/maintainers](docs/maintainers/README.md).

### How it fits together

```
apps/overlay/src/
  main/                    Electron main process
    index.ts               startup: creates the services and windows and wires them together
    commands.ts            every command a window can send to main (IPC)
    config.ts              URLs and test-hook environment variables
    game/                  finds and tails Client.txt
    guide/                 loads guide bundles, compiles the route, tracks progress per character
    state/                 the single AppState, saved to settings.json and broadcast to every window
    windows/               overlay window over the game, settings window, tray, hotkeys
    support/               app log, crash handling, updates
    testing/               offscreen capture and scripted tours (only with test env vars)
  preload/                 the small API the windows get (window.api)
  renderer/
    overlay/               the in-game overlay
      layout/              widget frame, click-through regions, fading, stacking
      guide/  build/  search/  status/   one folder per widget
    settings/              the settings window: tabs/ and components/
    common/                api hooks, error boundary, theme
  shared/                  types and pure logic used by both sides (timer, changelog, reports)
packages/
  log-watcher/             parses and tails Client.txt; finds it from the running game
  route-engine/            route language, guide compiler, progress tracking, PoB builds, passive trees
guides-snapshot/poe1.json  the guide bundle shipped inside the app (fallback when offline)
scripts/                   log replay, accuracy check, offscreen UI tours for Windows
```

Data flows one way: log lines → `GameLog` → `GuideService` → `AppState` → every window. Windows never change state directly; they send a command (`shared/types.ts` lists them) and main updates the state.

Docs: [install notes](docs/install.md) · [maintainer checklists](docs/maintainers/README.md) · [working notes and research](docs/notes/README.md).

## Thanks

The route language, the first route and the game data come from [exile-leveling](https://github.com/HeartofPhos/exile-leveling) by HeartofPhos (MIT). Tips are written in our own words from public guides, credited in the app under About. Third-party code and data: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

This product isn't affiliated with or endorsed by Grinding Gear Games in any way.

License: [MIT](LICENSE).
