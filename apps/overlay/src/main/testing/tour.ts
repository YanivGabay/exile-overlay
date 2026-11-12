import { BrowserWindow, app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PRELOAD, loadPage } from "../windows/windows.js";
import type { AppStateStore } from "../state/app-state.js";

/**
 * UI review hook (EXILE_OVERLAY_TOUR=<dir>): offscreen screenshots driven by
 * commands appended to <dir>/tour.txt. Never shows a window or touches focus.
 *   shot <label>             overlay at 1920x1080 and 2560x1440 over a busy, game-like background
 *   edit on|off              layout edit mode
 *   settings <tab> <label>   the settings window on a tab
 *   attach <seconds-ago>     pretend the game window was found that long ago (off: detach)
 *   set <json>               merge into settings (e.g. {"lastSeenVersion":"0.0.9"})
 *   update <json>            show an update status
 *   crash main|overlay       throw in main / kill the overlay page, to check logging and recovery
 *   quit
 */
const SIZES = [
  { name: "1080", width: 1920, height: 1080 },
  { name: "1440", width: 2560, height: 1440 },
];

// Bright spell effects, fire and dark ground: a stand-in for busy game art.
const GAME_ART = `html { background:
  radial-gradient(circle at 18% 30%, rgba(255,170,60,.85) 0, rgba(255,120,20,.4) 6%, transparent 14%),
  radial-gradient(circle at 70% 22%, rgba(120,190,255,.8) 0, transparent 10%),
  radial-gradient(circle at 82% 60%, rgba(255,240,200,.9) 0, rgba(255,200,120,.35) 5%, transparent 12%),
  radial-gradient(circle at 40% 75%, rgba(170,255,140,.6) 0, transparent 9%),
  radial-gradient(circle at 90% 85%, rgba(255,90,60,.7) 0, transparent 8%),
  repeating-linear-gradient(35deg, #2a2a1e 0 14px, #3b3826 14px 22px, #1d211a 22px 40px),
  #24261c !important; }`;

export function startTour(dir: string, state: AppStateStore, hooks: { crashMain: () => void }) {
  const windows = SIZES.map((s) => {
    const win = new BrowserWindow({
      show: false,
      width: s.width,
      height: s.height,
      useContentSize: true,
      // Windows clamps windows to the screen's work area (1920x1032 on a 1080p screen)
      // even offscreen; without this every size renders as the screen size.
      enableLargerThanScreen: true,
      webPreferences: { offscreen: true, preload: PRELOAD, sandbox: true, contextIsolation: true },
    });
    win.setContentSize(s.width, s.height);
    loadPage(win, "overlay");
    win.webContents.on("did-finish-load", () => void win.webContents.insertCSS(GAME_ART));
    return { ...s, win };
  });
  let settings: BrowserWindow | null = null;
  const file = join(dir, "tour.txt");
  let done = 0;
  let busy = false;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function run(cmd: string[]) {
    switch (cmd[0]) {
      case "shot":
        await wait(600);
        for (const w of windows) {
          const img = await w.win.webContents.capturePage();
          const { width, height } = img.getSize();
          if (width !== w.width || height !== w.height) console.warn(`[tour] ${w.name} rendered at ${width}x${height}, not ${w.width}x${w.height}`);
          writeFileSync(join(dir, `${cmd[1]}-${w.name}.png`), img.toPNG());
        }
        break;
      case "edit":
        state.patch({ overlay: { editing: cmd[1] === "on" } });
        break;
      case "settings": {
        if (settings && !settings.isDestroyed()) settings.destroy();
        {
          settings = new BrowserWindow({
            show: false,
            width: 900,
            height: 680,
            backgroundColor: "#14110d",
            webPreferences: { offscreen: true, preload: PRELOAD, sandbox: true, contextIsolation: true },
          });
        }
        loadPage(settings, "settings", cmd[1]);
        await wait(1500);
        console.log(`[tour] settings url ${await settings.webContents.executeJavaScript("location.href")}`);
        writeFileSync(join(dir, `${cmd[2]}.png`), (await settings.webContents.capturePage()).toPNG());
        break;
      }
      case "click": {
        // Real mouse events on the settings window's button with this text (needs EXILE_OVERLAY_CLICKTEST,
        // so report buttons log the URL instead of opening a browser or touching the clipboard).
        const label = cmd.slice(1).join(" ");
        const at: { x: number; y: number } | null = settings && !settings.isDestroyed()
          ? await settings.webContents.executeJavaScript(`(() => {
              const b = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === ${JSON.stringify(label)} && b.offsetParent);
              if (!b) return null;
              b.scrollIntoView({ block: "center" });
              const r = b.getBoundingClientRect();
              return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
            })()`)
          : null;
        if (!at || !settings) {
          console.warn(`[tour] click: no button "${label}"`);
          break;
        }
        settings.webContents.sendInputEvent({ type: "mouseDown", x: at.x, y: at.y, button: "left", clickCount: 1 });
        settings.webContents.sendInputEvent({ type: "mouseUp", x: at.x, y: at.y, button: "left", clickCount: 1 });
        await wait(800);
        writeFileSync(join(dir, `click-${label.replace(/\W+/g, "-").toLowerCase()}.png`), (await settings.webContents.capturePage()).toPNG());
        break;
      }
      case "attach":
        state.patch({ overlay: cmd[1] === "off" ? { attached: false, attachedAt: null } : { attached: true, attachedAt: Date.now() - Number(cmd[1]) * 1000, bounds: { x: 0, y: 0, width: 1920, height: 1080 } } });
        break;
      case "set":
        state.updateSettings(JSON.parse(cmd.slice(1).join(" ")));
        break;
      case "update":
        state.set("update", JSON.parse(cmd.slice(1).join(" ")));
        break;
      case "crash":
        if (cmd[1] === "main") hooks.crashMain();
        else windows[0].win.webContents.forcefullyCrashRenderer();
        await wait(2500);
        break;
      case "quit":
        app.quit();
        break;
    }
    console.log(`[tour] ${cmd.join(" ")}`);
  }

  setInterval(async () => {
    if (busy || !existsSync(file)) return;
    const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
    if (lines.length <= done) return;
    busy = true;
    while (done < lines.length) await run(lines[done++].trim().split(/\s+/));
    busy = false;
  }, 300);
}
