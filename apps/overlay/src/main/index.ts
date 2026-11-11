/**
 * Main process entry: creates the services and windows and wires them together.
 *
 *   game/game-log        finds and tails Client.txt, emits log events
 *   guide/guide-service  compiles the route and tracks progress from those events
 *   state/app-state      the single AppState, saved to settings.json, broadcast to every window
 *   windows/*            the overlay window over the game, the settings window, tray, hotkeys
 *   commands             what renderers can ask main to do (IPC)
 *   support/*            app log, crash handling, updates
 *   testing/*            offscreen capture and scripted tours (env-var test hooks only)
 */
import { BrowserWindow, app, ipcMain } from "electron";
import { join } from "node:path";
import { DEFAULT_WIDGET_LAYOUT } from "../shared/defaults.js";
import { buildReport } from "../shared/report.js";
import { IPC, type AppState } from "../shared/types.js";
import { createCommandHandler } from "./commands.js";
import { DEFAULT_GUIDE_URL, testEnv, testRun } from "./config.js";
import { GameLog } from "./game/game-log.js";
import { GuideService } from "./guide/guide-service.js";
import { AppStateStore } from "./state/app-state.js";
import { SettingsStore } from "./state/settings-store.js";
import { AppLog } from "./support/app-log.js";
import { installCrashHandlers, watchRenderer } from "./support/crash.js";
import { Updates } from "./support/updates.js";
import { startCapture } from "./testing/capture.js";
import { startTour } from "./testing/tour.js";
import { Hotkeys } from "./windows/hotkeys.js";
import { OverlayWindow } from "./windows/overlay-window.js";
import { PRELOAD, createTray, loadPage, lockNavigation, openSettingsWindow, resourcePath } from "./windows/windows.js";

// Test hook: a separate settings folder, so tests never touch real settings.
if (testEnv.userData) app.setPath("userData", testEnv.userData);

if (!app.requestSingleInstanceLock()) app.quit();

// The app's own log and friendly crash handling, before anything else can fail.
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
  // For testing without the game: attach to any window by its exact title, read a fixed log file.
  if (testEnv.target) initial.settings.game.targetTitle = testEnv.target;
  if (testEnv.log) initial.settings.game.clientLogPath = testEnv.log;
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
  const toggleEdit = () => overlay.setEditing(!state.get().overlay.editing);
  const toggleHidden = () => overlay.setHidden(!state.get().overlay.hidden);

  const hotkeys = new Hotkeys(state, {
    nextStep: () => guide.step(1),
    prevStep: () => guide.step(-1),
    resync: () => guide.resync(),
    toggleEdit,
    toggleOverlay: toggleHidden,
  });

  // ----- IPC: state and guide go out to every window; commands come back -----
  const broadcast = (channel: string, payload: unknown) => {
    for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send(channel, payload);
  };
  state.on("change", (s) => broadcast(IPC.state, s));
  guide.on("guide", (g) => broadcast(IPC.guide, g));

  const clickTest = testEnv.clickTest ? new Array<string>() : null;
  ipcMain.handle(IPC.getState, () => state.get());
  ipcMain.handle(IPC.getGuide, () => guide.getRender());
  ipcMain.handle(IPC.command, createCommandHandler({ state, guide, overlay, updates, appLog, makeReport: () => makeReport(), clickTest }));
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

  // ----- Test hooks (never active in a normal run) -----
  if (testEnv.captureDir) startCapture(testEnv.captureDir, state, clickTest);
  if (testEnv.tourDir) startTour(testEnv.tourDir, state, { crashMain: () => setTimeout(() => { throw new Error("tour: test crash in main"); }, 0) });

  if (!testRun)
    createTray(state, {
      openSettings: (tab) => openSettingsWindow(tab),
      toggleEdit,
      toggleHidden,
      installUpdate: () => updates.install(),
      quit: () => app.quit(),
    });

  // App updates from GitHub Releases (installed builds only): download in the
  // background, install on quit or from "Restart to update".
  updates.start();

  guide.start();
  void log.start();
  if (!state.settings.firstRunDone && !testRun) openSettingsWindow("setup");

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
