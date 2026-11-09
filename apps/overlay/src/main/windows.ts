import { BrowserWindow, Menu, Tray, app, nativeImage, shell } from "electron";
import { join } from "node:path";
import type { AppStateStore } from "./app-state.js";

export const PRELOAD = join(import.meta.dirname, "../preload/index.cjs");
const RESOURCES = app.isPackaged
  ? process.resourcesPath
  : join(import.meta.dirname, "../../resources");

export function resourcePath(...parts: string[]) {
  return join(RESOURCES, ...parts);
}

/** Load a renderer page in dev (Vite server) or production (built files). */
export function loadPage(win: BrowserWindow, page: "overlay" | "settings", hash = "") {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) void win.loadURL(`${devUrl}/${page}.html${hash ? `#${hash}` : ""}`);
  else void win.loadFile(join(import.meta.dirname, `../renderer/${page}.html`), { hash });
}

/** Open external links in the user's browser, never inside our windows. */
export function lockNavigation(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(process.env.ELECTRON_RENDERER_URL ?? "file://")) e.preventDefault();
  });
}

let settingsWindow: BrowserWindow | null = null;

export function openSettingsWindow(tab?: string) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (tab) settingsWindow.webContents.send("settings:tab", tab);
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    title: "Exile Overlay",
    backgroundColor: "#14110d",
    icon: resourcePath("icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { preload: PRELOAD, sandbox: true, contextIsolation: true },
  });
  lockNavigation(settingsWindow);
  loadPage(settingsWindow, "settings", tab ?? "");
  settingsWindow.once("ready-to-show", () => settingsWindow?.show());
  settingsWindow.on("closed", () => (settingsWindow = null));
  return settingsWindow;
}

export function createTray(
  state: AppStateStore,
  actions: {
    openSettings: (tab?: string) => void;
    toggleEdit: () => void;
    toggleHidden: () => void;
    installUpdate: () => void;
    quit: () => void;
  },
) {
  const tray = new Tray(nativeImage.createFromPath(resourcePath("tray.png")));
  let shownFor: string | null | undefined;
  const build = () => {
    const update = state.get().update;
    const ready = update?.kind === "ready" ? update.version : null;
    if (ready === shownFor) return;
    shownFor = ready;
    tray.setToolTip(ready ? `Exile Overlay: update ${ready} ready` : "Exile Overlay");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        ...(ready ? [{ label: `Restart to update to ${ready}`, click: () => actions.installUpdate() }, { type: "separator" as const }] : []),
        { label: "Settings", click: () => actions.openSettings() },
        { label: "Hide / show overlay", click: () => actions.toggleHidden() },
        { label: "Edit layout", click: () => actions.toggleEdit() },
        { label: "What's new", click: () => actions.openSettings("whatsnew") },
        { label: "Diagnostics", click: () => actions.openSettings("diagnostics") },
        { type: "separator" },
        { label: "Quit Exile Overlay", click: () => actions.quit() },
      ]),
    );
  };
  build();
  state.on("change", build);
  tray.on("click", () => actions.openSettings());
  return tray;
}
