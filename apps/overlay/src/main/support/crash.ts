import { app, clipboard, dialog, shell, type WebContents } from "electron";
import { describeError, type AppLog } from "./app-log.js";

/**
 * Errors never show Electron's raw stack dialog. Main-process errors are
 * logged and get one friendly dialog per session (copy a report, open the log
 * folder, restart); renderer crashes reload the page quietly, and only a page
 * that keeps crashing gets the dialog.
 */
export interface CrashDeps {
  log: AppLog;
  report: (error: { message: string; stack?: string; where: string }) => string;
  /** Test runs (offscreen tours) log only: no dialog on the desktop. */
  quiet: boolean;
}

export function installCrashHandlers(deps: CrashDeps) {
  let dialogOpen = false;
  let shown = 0;

  async function friendly(where: string, err: unknown) {
    const { message, stack } = describeError(err);
    deps.log.write("error", `${where}: ${stack ?? message}`);
    if (deps.quiet || dialogOpen || shown >= 2 || !app.isReady()) return;
    dialogOpen = true;
    shown++;
    try {
      const { response } = await dialog.showMessageBox({
        type: "warning",
        title: "Exile Overlay",
        message: "Exile Overlay hit a problem",
        detail:
          `${message}\n\nYour guide progress and settings are saved. You can keep playing; if the overlay misbehaves, restart it.\n\n` +
          "To report it, copy the report and paste it into a GitHub issue or Discord message. It contains no account or character names.",
        buttons: ["Keep running", "Copy report", "Open log folder", "Restart"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      if (response === 1) clipboard.writeText(deps.report({ message, stack, where }));
      if (response === 2) void shell.openPath(deps.log.dir);
      if (response === 3) {
        app.relaunch();
        app.exit(0);
      }
    } finally {
      dialogOpen = false;
    }
  }

  process.on("uncaughtException", (err) => void friendly("main process", err));
  process.on("unhandledRejection", (reason) => {
    // Rejections are usually a failed download or file read already handled
    // in the UI: log them, don't interrupt the player.
    const { message, stack } = describeError(reason);
    deps.log.write("warn", `unhandled rejection: ${stack ?? message}`);
  });
  app.on("child-process-gone", (_e, details) => {
    if (details.reason !== "clean-exit") deps.log.write("warn", `${details.type} process gone: ${details.reason} (${details.exitCode})`);
  });

  return { friendly };
}

/** Reload a crashed page; three crashes within a minute get the friendly dialog instead. */
export function watchRenderer(contents: WebContents, deps: CrashDeps, friendly: (where: string, err: unknown) => void) {
  const crashes: number[] = [];
  const pageName = () => /settings\.html/.test(contents.getURL()) ? "settings" : "overlay";
  contents.on("render-process-gone", (_e, details) => {
    const name = pageName();
    if (details.reason === "clean-exit") return;
    const now = Date.now();
    crashes.push(now);
    while (crashes.length && now - crashes[0] > 60_000) crashes.shift();
    deps.log.write("error", `${name} page crashed: ${details.reason} (exit ${details.exitCode}); crash ${crashes.length} this minute`);
    if (contents.isDestroyed()) return;
    if (crashes.length >= 3) friendly(`${name} page`, new Error(`The ${name} page keeps crashing (${details.reason}).`));
    else contents.reload();
  });
  contents.on("unresponsive", () => deps.log.write("warn", `${pageName()} page is not responding`));
  contents.on("preload-error", (_e, path, err) => deps.log.write("error", `${pageName()} preload failed (${path}): ${err.stack ?? err.message}`));
}
