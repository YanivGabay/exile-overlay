import updater from "electron-updater";
import { nextUpdateStatus, type UpdateEvent } from "../shared/report.js";
import type { AppStateStore } from "./app-state.js";

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

/**
 * App updates from GitHub Releases, installed builds only. Downloads in the
 * background and installs when the player quits: never restarts the overlay
 * mid-run. Settings and the tray offer "Restart to update" once it's ready.
 */
export class Updates {
  private readonly au = updater.autoUpdater;
  private started = false;

  constructor(
    private readonly state: AppStateStore,
    private readonly enabled: boolean,
  ) {
    state.patch({ update: enabled ? { kind: "idle" } : { kind: "dev" } });
  }

  start() {
    if (!this.enabled || this.started) return;
    this.started = true;
    this.au.autoDownload = true;
    this.au.autoInstallOnAppQuit = true;
    this.au.logger = { info: (m) => console.log(`[update] ${m}`), warn: (m) => console.warn(`[update] ${m}`), error: (m) => console.warn(`[update] ${m}`), debug: () => undefined };
    this.au.on("checking-for-update", () => this.apply({ type: "checking" }));
    this.au.on("update-available", (i) => this.apply({ type: "available", version: i.version }));
    this.au.on("update-not-available", () => this.apply({ type: "none", at: new Date().toISOString() }));
    this.au.on("download-progress", (p) => this.apply({ type: "progress", percent: p.percent }));
    this.au.on("update-downloaded", (i) => this.apply({ type: "downloaded", version: i.version }));
    this.au.on("error", (err) => this.apply({ type: "error", message: err?.message ?? String(err) }));
    this.check();
    setInterval(() => this.check(), CHECK_EVERY_MS);
  }

  check() {
    if (!this.enabled) return;
    void this.au.checkForUpdates().catch(() => undefined); // reported through the "error" event
  }

  /** Quit and run the downloaded installer, then start again. */
  install() {
    if (this.state.get().update?.kind !== "ready") return;
    this.au.quitAndInstall(true, true);
  }

  private apply(ev: UpdateEvent) {
    const prev = this.state.get().update ?? { kind: "idle" };
    this.state.set("update", nextUpdateStatus(prev, ev));
  }
}
