# Installing Exile Overlay

Windows 10 or 11, 64-bit. Path of Exile 1 (Steam, standalone or Epic).

## 1. Download and run the installer

Download `ExileOverlay-Setup-<version>.exe` from the [Releases page](https://github.com/YanivGabay/exile-overlay/releases) and run it. It installs for your Windows user only: no administrator rights, no install questions. It starts by itself when it's done.

### "Windows protected your PC"

The beta installer isn't code-signed yet (a certificate costs money, and it comes later). Windows SmartScreen therefore warns about any new unsigned program until enough people have run it:

1. Click **More info**.
2. Click **Run anyway**.

Your browser may also say the file "isn't commonly downloaded". Choose **Keep** (in Chrome: the download's menu → **Keep**). If your antivirus quarantines it, that's a false positive common to new unsigned Electron apps: restore it or add an exception. The source code is public, and every release is built from a tagged commit.

## 2. First run

The Setup screen opens with three live checks:

- **Game window**: start Path of Exile in **Windowed** or **Windowed Fullscreen**. Exclusive fullscreen hides every overlay.
- **Game log**: found automatically once the game runs. Before you start the game it says "Waiting for Path of Exile". That's normal; nothing to do.
  If the game runs and the log still isn't found (an unusual install folder), click **Choose Client.txt…** and pick `logs\Client.txt` inside the game folder:
  - Steam: `…\steamapps\common\Path of Exile\logs\Client.txt`
  - standalone: `C:\Program Files (x86)\Grinding Gear Games\Path of Exile\logs\Client.txt`
- **Guide**: ready immediately; updates download in the background.

Pick how you play this league (league start, speedrun, SSF/hardcore-safe, first time), optionally paste your Path of Building link, and click **Done**. Log in to a character: the guide appears on the right of the game once you enter a zone.

If the game runs as administrator, run Exile Overlay as administrator too. Otherwise Windows won't let it read the log or draw over the game.

## 3. Keys

| Key | Does |
|---|---|
| F4 / F3 | next / previous zone, if the guide is off |
| Shift+F4 | jump to the zone you are in |
| F6 | move and resize the overlay (press again, or Done, to save) |
| F7 | hide or show it |

Change them under Settings → Hotkeys. The tray icon (bottom right, near the clock) opens Settings, What's new and Diagnostics.

## Updates

Updates download in the background and install the next time you quit Exile Overlay, so it never restarts in the middle of a run. To update right away, use **Restart to update** in the tray menu or under Settings → About. Settings → What's new lists what changed.

## Something went wrong?

Settings → Diagnostics shows what the overlay sees: a red line says what's missing. **Copy report** puts a report on your clipboard: what the overlay sees, plus its recent log, with your Windows user name and character names removed. Paste it into a [GitHub issue](https://github.com/YanivGabay/exile-overlay/issues) or a Discord message. **Open log folder** opens the folder with the full log files.

If a panel hits an error it shows one line and retries by itself; your progress and settings are always saved.

## Uninstall

Windows Settings → Apps → Exile Overlay → Uninstall. Your settings stay in the folder shown under Diagnostics → Settings folder; delete it for a clean slate.
