# Release checklist (maintainers)

Every step that publishes something (a release, a push to the guides repo's `main`) needs Yaniv's OK first. Both repos are public since 2026-11-11.

## Before each league launch

- [ ] Check the route, tips and reminders against the patch notes (see [launch-day-checklist.md](launch-day-checklist.md)), then refresh `guides-snapshot/poe1.json` and its `gameVersion`.
- [ ] Re-run the accuracy gate: `scripts/validate-runs.ts` on a real Client.txt plus `packages/route-engine/test-fixtures/real-runs.json`.

## Build

1. Set the version in `apps/overlay/package.json` and add a matching entry at the top of `apps/overlay/src/shared/changelog.ts` (a test fails if they differ). Write player-facing sentences.
2. `npm test` and `npm run typecheck` (Node 24: `nvm use`).
3. On Windows: `cd apps/overlay && npm run dist`. Output in `apps/overlay/release/`:
   - `ExileOverlay-Setup-<version>.exe`, the installer;
   - `ExileOverlay-Setup-<version>.exe.blockmap`, for differential updates;
   - `latest.yml`, which the updater reads.
4. Smoke test the packaged app offscreen, with no window and no focus: `scripts/launch-check.sh 'C:\…\release\win-unpacked\Exile Overlay.exe'`. It checks:
   - the first run with no game log;
   - crash recovery and the app log;
   - What's new;
   - the update-ready screen.

   Look at the PNGs in `eo-test/launch`.
5. Install the setup .exe once on a clean Windows user or VM (it launches the app when done). Check:
   - the SmartScreen flow;
   - that the Setup window opens;
   - the tray icon;
   - that uninstalling works.

## Publish

1. Push a tag `v<version>` on main. The Release workflow runs the tests on Windows, builds the installer and uploads it to a **draft** release.
2. electron-builder can race and create **two** drafts for one tag (one with the blockmap, one with the installer and `latest.yml`). Check with `gh api repos/YanivGabay/exile-overlay/releases` and put all three files on one draft.
3. Paste the notes from `docs/release-notes/v<version>.md` (make image and doc links absolute) and publish it (not draft, not pre-release): the updater ignores drafts.
4. Check as a player would: `releases/latest/download/latest.yml` answers, and the installer's sha512 matches it.

## Updates: how they reach players

- **App:** electron-updater reads `latest.yml` from the newest published release of `YanivGabay/exile-overlay`. This needs the repo to stay **public**; a private repo would need a token inside the app, so never do that.
- Updates download in the background and install when the player quits. "Restart to update" in the tray or in About installs at once. The app never restarts on its own mid-run.
- **Guides:** the app fetches `bundles/poe1.json` from `exile-overlay-guides` and falls back to the built-in snapshot. A push to that repo's `main` reaches every player within 30 minutes, without an app release, so treat it like a release.

## Code signing (later)

Unsigned installers get the SmartScreen "Windows protected your PC" warning until enough people run them; `docs/install.md` tells players how to get past it. Options to evaluate after the beta, each needing Yaniv's decision since they cost money or need an application:
- SignPath Foundation (free for open-source projects, application required);
- Azure Trusted Signing (monthly fee; check eligibility for individuals in Israel);
- a standard OV certificate.

## When something breaks after release

Players send the Diagnostics report: the app version, game window and log state, and the last 60 lines of the app log, with the user name and character names removed. The full logs are in `<userData>/logs/exile-overlay.log` (plus `.old`).
