import { BrowserWindow, Menu, Tray, app, nativeImage, shell } from "electron";
import { join } from "node:path";

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

export function createTray(actions: {
  openSettings: (tab?: string) => void;
  toggleEdit: () => void;
  quit: () => void;
}) {
  const tray = new Tray(nativeImage.createFromPath(resourcePath("tray.png")));
  tray.setToolTip("Exile Overlay");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Settings", click: () => actions.openSettings() },
      { label: "Edit layout", click: () => actions.toggleEdit() },
      { label: "Diagnostics", click: () => actions.openSettings("diagnostics") },
      { type: "separator" },
      { label: "Quit Exile Overlay", click: () => actions.quit() },
    ]),
  );
  tray.on("click", () => actions.openSettings());
  return tray;
}
