# Exile Overlay

A leveling overlay for Path of Exile 1 that sets up in a minute and stays out of your way. It reads the game's log file to know which zone you're in and moves the guide on when you change zones. It never touches game memory or files and never sends inputs.

Status: beta for the 3.30 league. Windows only.

![The guide over the game in a zone, with gem links and the passive tree on the left](docs/screenshots/zone-with-build.png)

## Quick start

1. **Install.** Download `ExileOverlay-Setup-<version>.exe` from [Releases](https://github.com/YanivGabay/exile-overlay/releases) and run it. The beta isn't code-signed: if Windows says "Windows protected your PC", click **More info** → **Run anyway**. ([Install notes](docs/install.md))
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

## What you get

- Each zone shows what to do and where to go next, and the guide moves on by itself as you change zones.
- Your build's gems and links for your level, what to take from quests and what to buy, and which passive tree fits now.
- In town, vendor search text to copy in one click: links, movement speed boots, +1 wands, weapon recipe bases.
- A campaign timer with act splits and live pace against your best run, plus a run summary to share at the end.
- Movable, resizable panels that fade while you play; layouts are saved per game resolution.

| In town with a build | Layout edit mode (F6) |
|---|---|
| ![Town: gem shopping list and vendor search](docs/screenshots/town-with-build.png) | ![Edit mode: drag, resize, fade](docs/screenshots/edit-mode.png) |

## Problems?

Settings → **Diagnostics** shows what the overlay sees and, in red, what's missing. **Copy report** gives you a report without your user or character names; paste it into an [issue](https://github.com/YanivGabay/exile-overlay/issues). More in [docs/install.md](docs/install.md).

## Development

Node 24 (`nvm use`), then:
- `npm install`
- `npm test`
- `npm run typecheck`
- `cd apps/overlay && npm run dev`

Installer: `npm run dist` on Windows. Release steps: [docs/release-checklist.md](docs/release-checklist.md). Research and plan: [docs/research.md](docs/research.md).

This product isn't affiliated with or endorsed by Grinding Gear Games in any way.

License: MIT. Third-party code and data are credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
