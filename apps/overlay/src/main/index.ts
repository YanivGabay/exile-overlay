import { BrowserWindow, app, clipboard, dialog, ipcMain, shell } from "electron";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { AppStateStore } from "./app-state.js";
import { GameLog } from "./game-log.js";
import { GuideService } from "./guide-service.js";
import { Hotkeys } from "./hotkeys.js";
import { OverlayWindow } from "./overlay-window.js";
import { SettingsStore } from "./settings-store.js";
import { PRELOAD, createTray, loadPage, lockNavigation, openSettingsWindow, resourcePath } from "./windows.js";
import { importPob } from "./pob.js";
import { startTour } from "./tour.js";
import { AppLog } from "./app-log.js";
import { installCrashHandlers, watchRenderer } from "./crash.js";
import { Updates } from "./updates.js";
import { buildReport } from "../shared/report.js";
import { IPC, type AppState, type Command } from "../shared/types.js";
import { DEFAULT_WIDGET_LAYOUT } from "../shared/defaults.js";

/** Guide bundles are published by the guides repo CI. While that repo is private the fetch 404s and the snapshot is used. */
const DEFAULT_GUIDE_URL: string | null =
  "https://raw.githubusercontent.com/YanivGabay/exile-overlay-guides/bundles/poe1.json";
const GUIDES_ISSUE_URL = "https://github.com/YanivGabay/exile-overlay-guides/issues/new";

// Test hooks: a separate settings folder and a fixed log file, so tests never touch real settings.
if (process.env.EXILE_OVERLAY_USERDATA) app.setPath("userData", process.env.EXILE_OVERLAY_USERDATA);

if (!app.requestSingleInstanceLock()) app.quit();

// The app's own log and friendly crash handling, before anything else can fail.
const testRun = !!(process.env.EXILE_OVERLAY_CAPTURE || process.env.EXILE_OVERLAY_TOUR);
const appLog = new AppLog(join(app.getPath("userData"), "logs"));
appLog.captureConsole();
let reportState: AppState | null = null;
const makeReport = (error: { message: string; stack?: string; where: string } | null = null) =>
  reportState
    ? buildReport({ state: reportState, platform: `${process.platform} ${process.getSystemVersion()}`, electron: process.versions.electron, logTail: appLog.tail(), error })
    : appLog.tail();
const crashDeps = { log: appLog, report: makeReport, quiet: testRun };
const crash = installCrashHandlers(crashDeps);
// Every page (overlay, settings, test windows) reloads itself after a crash.
app.on("web-contents-created", (_e, wc) => watchRenderer(wc, crashDeps, crash.friendly));
console.log(`[app] Exile Overlay ${app.getVersion()} starting (${process.platform} ${process.getSystemVersion()}, Electron ${process.versions.electron})`);
// Windows occlusion tracking can stop painting an always-on-top transparent window.
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

app.whenReady().then(() => {
  const userData = app.getPath("userData");
  const store = SettingsStore.inDir(userData);
  const initial: AppState = {
    appVersion: app.getVersion(),
    settings: store.load(),
    overlay: { attached: false, targetFocused: false, bounds: null, editing: false, hidden: false },
    game: { logStatus: { kind: "searching" }, inGame: null, area: null, character: null },
    guide: { state: "loading", source: null, version: null, gameVersion: null, title: null, message: null },
    tracking: null,
  };
  // For testing without the game: attach to any window by its exact title.
  if (process.env.EXILE_OVERLAY_TARGET) initial.settings.game.targetTitle = process.env.EXILE_OVERLAY_TARGET;
  if (process.env.EXILE_OVERLAY_LOG) initial.settings.game.clientLogPath = process.env.EXILE_OVERLAY_LOG;
  const state = new AppStateStore(initial, store);
  reportState = state.get();
  state.on("change", (s) => (reportState = s));
  // A fresh install has nothing new to announce: start "what's new" from this version.
  if (!state.settings.firstRunDone && !state.settings.lastSeenVersion) state.updateSettings({ lastSeenVersion: app.getVersion() });
  const updates = new Updates(state, app.isPackaged && !testRun);

  const snapshot = app.isPackaged
    ? resourcePath("guides", "poe1.json")
    : join(import.meta.dirname, "../../../../guides-snapshot/poe1.json");
  const guide = new GuideService(state, snapshot, join(userData, "guides"), DEFAULT_GUIDE_URL);
  const log = new GameLog(state);
  log.on("event", (e, replay) => guide.onLogEvent(e, replay));

  const overlay = new OverlayWindow(state, PRELOAD, loadPage);
  lockNavigation(overlay.window);

  const hotkeys = new Hotkeys(state, {
    nextStep: () => guide.step(1),
    prevStep: () => guide.step(-1),
    resync: () => guide.resync(),
    toggleEdit: () => overlay.setEditing(!state.get().overlay.editing),
    toggleOverlay: () => overlay.setHidden(!state.get().overlay.hidden),
  });

  // ----- IPC ---------------------------------------------------------------
  const broadcast = (channel: string, payload: unknown) => {
    for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send(channel, payload);
  };
  state.on("change", (s) => broadcast(IPC.state, s));
  guide.on("guide", (g) => broadcast(IPC.guide, g));

  ipcMain.handle(IPC.getState, () => state.get());
  ipcMain.handle(IPC.getGuide, () => guide.getRender());
  const clickTest = process.env.EXILE_OVERLAY_CLICKTEST ? new Array<string>() : null;
  ipcMain.handle(IPC.command, async (e, cmd: Command) => {
    if (cmd.type !== "setRegions") console.log(`[cmd] ${cmd.type}`);
    switch (cmd.type) {
      case "updateSettings":
        state.updateSettings(cmd.patch);
        return { ok: true };
      case "setWidgetLayout": {
        const layouts = state.settings.layouts;
        const forRes = { ...layouts[cmd.resolution], [cmd.widget]: cmd.layout };
        state.replaceSettings({ ...state.settings, layouts: { ...layouts, [cmd.resolution]: forRes } });
        return { ok: true };
      }
      case "resetLayout": {
        const layouts = { ...state.settings.layouts };
        delete layouts[cmd.resolution];
        state.replaceSettings({ ...state.settings, layouts });
        return { ok: true };
      }
      case "setHidden":
        overlay.setHidden(cmd.hidden);
        return { ok: true };
      case "setEditing":
        overlay.setEditing(cmd.editing);
        return { ok: true };
      case "guideStep":
        guide.step(cmd.delta);
        return { ok: true };
      case "guideResync":
        guide.resync();
        return { ok: true };
      case "guideSetEdge":
        guide.pick(cmd.edge);
        return { ok: true };
      case "guideUndo":
        guide.undo();
        return { ok: true };
      case "copyText":
        // Click test: record instead of overwriting the user's clipboard.
        if (clickTest) clickTest.push(cmd.text);
        else clipboard.writeText(cmd.text);
        return { ok: true };
      case "dismissReminder":
        guide.dismissReminder(cmd.id);
        return { ok: true };
      case "setRegions":
        // Only the real overlay window's layout drives click-through.
        if (e.sender === overlay.window.webContents) overlay.setRegions(cmd.controls, cmd.widgets);
        return { ok: true };
      case "toggleStepDone":
        guide.toggleStep(cmd.stepId);
        return { ok: true };
      case "selectCharacter":
        guide.selectCharacter(cmd.name);
        return { ok: true };
      case "importPob": {
        const result = await importPob(cmd.input);
        if (result.ok) guide.setPob(result.code);
        return result;
      }
      case "reportStep": {
        const s = state.get();
        const title = `Wrong step: ${cmd.stepId}`;
        const body = [
          `Step id: \`${cmd.stepId}\``,
          `Guide version: ${s.guide.version} (game ${s.guide.gameVersion})`,
          `Current area: ${s.game.area?.id ?? "unknown"}`,
          `Route options: ${JSON.stringify(s.settings.guide.options)}`,
          "",
          "What went wrong in game:",
          cmd.note,
        ].join("\n");
        void shell.openExternal(`${GUIDES_ISSUE_URL}?${new URLSearchParams({ title, body, labels: "route-fix" })}`);
        return { ok: true };
      }
      case "openSettings":
        openSettingsWindow(cmd.tab);
        return { ok: true };
      case "openExternal":
        if (/^https:\/\//.test(cmd.url)) void shell.openExternal(cmd.url);
        return { ok: true };
      case "logError":
        appLog.write("error", `${cmd.where}: ${cmd.stack ?? cmd.message}`);
        return { ok: true };
      case "copyReport":
        if (clickTest) clickTest.push("report");
        else clipboard.writeText(makeReport());
        return { ok: true };
      case "openLogFolder":
        void shell.openPath(appLog.dir);
        return { ok: true };
      case "pickClientLog": {
        const parent = BrowserWindow.fromWebContents(e.sender) ?? undefined;
        const opts = {
          title: "Choose the game's Client.txt",
          properties: ["openFile" as const],
          filters: [{ name: "Path of Exile log", extensions: ["txt"] }],
        };
        const res = parent ? await dialog.showOpenDialog(parent, opts) : await dialog.showOpenDialog(opts);
        if (res.canceled || !res.filePaths[0]) return { ok: false };
        state.updateSettings({ game: { clientLogPath: res.filePaths[0] } });
        return { ok: true, path: res.filePaths[0] };
      }
      case "checkUpdates":
        updates.check();
        return { ok: true };
      case "installUpdate":
        updates.install();
        return { ok: true };
      case "quit":
        app.quit();
        return { ok: true };
    }
  });
  ipcMain.handle("diagnostics:get", () => ({
    logDetail: log.lastDetail,
    hotkeyFailures: hotkeys.failed,
    displayScale: overlay.displayScale(),
    userData,
    defaultLayout: DEFAULT_WIDGET_LAYOUT,
    logDir: appLog.dir,
    platform: `${process.platform} ${process.getSystemVersion()}`,
    electron: process.versions.electron,
  }));

  // Test hook: render the overlay offscreen and save a PNG after every change.
  // Never touches the desktop or focus.
  const captureDir = process.env.EXILE_OVERLAY_CAPTURE;
  if (captureDir) {
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

  const tourDir = process.env.EXILE_OVERLAY_TOUR;
  if (tourDir) startTour(tourDir, state, { crashMain: () => setTimeout(() => { throw new Error("tour: test crash in main"); }, 0) });

  if (!captureDir && !tourDir) createTray(state, {
    openSettings: (tab) => openSettingsWindow(tab),
    toggleEdit: () => overlay.setEditing(!state.get().overlay.editing),
    toggleHidden: () => overlay.setHidden(!state.get().overlay.hidden),
    installUpdate: () => updates.install(),
    quit: () => app.quit(),
  });

  // App updates from GitHub Releases (installed builds only): download in the
  // background, install on quit or from "Restart to update".
  updates.start();

  guide.start();
  void log.start();
  if (!state.settings.firstRunDone && !captureDir && !tourDir) openSettingsWindow("setup");

  app.on("second-instance", () => openSettingsWindow());
  app.on("before-quit", () => {
    store.flush();
    hotkeys.dispose();
    log.stop();
    guide.stop();
  });
});

// Keep running in the tray when the settings window closes.
app.on("window-all-closed", () => {
  /* tray app: do nothing */
});

/**
 * Offscreen click check: every visible button must sit inside a reported
 * clickable region, and real input events on copy buttons and chips must
 * reach the main process.
 */
async function runClickTest(win: BrowserWindow, copied: string[]) {
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
