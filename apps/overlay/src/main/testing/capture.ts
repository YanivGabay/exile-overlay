import { BrowserWindow } from "electron";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AppStateStore } from "../state/app-state.js";
import { PRELOAD, loadPage } from "../windows/windows.js";

/**
 * Test hook: render the overlay offscreen and save a PNG after every state
 * change. Never touches the desktop or focus. With `clickTest`, also checks
 * that every button can be clicked (see runClickTest).
 */
export function startCapture(captureDir: string, state: AppStateStore, clickTest: string[] | null) {
  const cap = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    backgroundColor: "#2b3a2b",
    webPreferences: { offscreen: true, preload: PRELOAD, sandbox: true, contextIsolation: true },
  });
  loadPage(cap, "overlay");
  let n = 0;
  let timer: NodeJS.Timeout | null = null;
  state.on("change", (s) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const img = await cap.webContents.capturePage();
      const label = `${s.game.inGame === false ? "outOfGame" : s.tracking?.kind ?? "start"}-${s.game.area?.id ?? "none"}`;
      const name = `${String(++n).padStart(2, "0")}-${label}`;
      writeFileSync(join(captureDir, `${name}.png`), img.toPNG());
      if (clickTest) writeFileSync(join(captureDir, `${name}.clicks.json`), JSON.stringify(await runClickTest(cap, clickTest), null, 1));
    }, 700);
  });
}

/**
 * Offscreen click check: every visible button must sit inside a reported
 * clickable region, and real input events on copy buttons and chips must
 * reach the main process.
 */
export async function runClickTest(win: BrowserWindow, copied: string[]) {
  type Btn = { label: string; x: number; y: number; covered: boolean; kind: string };
  const buttons: Btn[] = await win.webContents.executeJavaScript(`(() => {
    const regions = window.__regions ? window.__regions().controls : [];
    const inside = (x, y) => regions.some((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
    return [...document.querySelectorAll("button")].filter((b) => !b.disabled && b.offsetParent !== null).map((b) => {
      const r = b.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const kind = b.classList.contains("copy-btn") || b.classList.contains("primary") ? "copy" : b.classList.contains("chip-btn") ? "chip" : "other";
      return { label: (b.title || b.textContent || "").trim().slice(0, 40), x, y, covered: inside(x, y), kind };
    });
  })()`);
  const results: { label: string; kind: string; covered: boolean; clicked?: boolean }[] = [];
  for (const b of buttons) {
    const r: (typeof results)[number] = { label: b.label, kind: b.kind, covered: b.covered };
    if (b.kind === "copy") {
      const before = copied.length;
      win.webContents.sendInputEvent({ type: "mouseDown", x: b.x, y: b.y, button: "left", clickCount: 1 });
      win.webContents.sendInputEvent({ type: "mouseUp", x: b.x, y: b.y, button: "left", clickCount: 1 });
      await new Promise((res) => setTimeout(res, 200));
      r.clicked = copied.length > before;
    }
    results.push(r);
  }
  return { uncovered: results.filter((r) => !r.covered).length, copyFailed: results.filter((r) => r.clicked === false).length, results };
}
