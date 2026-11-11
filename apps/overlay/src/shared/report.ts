import type { AppState } from "./types.js";

/**
 * A support report the player can paste into a bug report.
 * Personal bits are taken out: the Windows/Linux user name in paths and
 * character names (only class and level stay).
 */
export function redact(text: string, names: string[] = []): string {
  let out = text
    .replace(/([A-Za-z]:[\\/]+Users[\\/]+)[^\\/\s"']+/gi, "$1<you>")
    .replace(/(\/(?:home|Users)\/)[^/\s"']+/g, "$1<you>");
  for (const n of names) if (n.length >= 3) out = out.split(n).join("<character>");
  return out;
}

export interface ReportInput {
  state: AppState;
  platform: string;
  electron: string;
  /** Recent lines of the app's own log file. */
  logTail: string;
  /** The error that triggered the report, if any. */
  error?: { message: string; stack?: string; where: string } | null;
}

export function buildReport({ state, platform, electron, logTail, error }: ReportInput): string {
  const { overlay, game, guide, settings } = state;
  const log = game.logStatus;
  const lines = [
    `Exile Overlay ${state.appVersion} on ${platform} (Electron ${electron})`,
    `Game window: ${overlay.attached ? `attached, ${overlay.bounds?.width}x${overlay.bounds?.height}` : `not found ("${settings.game.targetTitle}")`}`,
    `Game log: ${log.kind === "watching" ? `${log.path} (${(log.sizeBytes / 1e6).toFixed(1)} MB)` : log.kind === "error" ? `error: ${log.message}` : "searching"}`,
    `Area: ${game.area ? `${game.area.id} (level ${game.area.level})` : "-"}; character: ${game.character ? `level ${game.character.level} ${game.character.className}` : "-"}`,
    `Guide: ${guide.state === "ready" ? `${guide.version} from ${guide.source}` : `${guide.state} ${guide.message ?? ""}`}; preset ${settings.guide.preset}`,
    `Update: ${state.update ? describeUpdate(state.update) : "-"}`,
  ];
  if (error) lines.push("", `Error in ${error.where}: ${error.message}`, ...(error.stack ? [error.stack] : []));
  if (logTail.trim()) lines.push("", "Recent log:", logTail.trimEnd());
  const names = [game.character?.name, ...Object.keys(settings.characters)].filter((n): n is string => !!n);
  return redact(lines.join("\n"), names);
}

// ----- Updates ----------------------------------------------------------------

export type UpdateStatus =
  | { kind: "dev" }
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "none"; checkedAt: string }
  | { kind: "downloading"; version: string; percent: number }
  | { kind: "ready"; version: string }
  | { kind: "error"; message: string };

export type UpdateEvent =
  | { type: "checking" }
  | { type: "available"; version: string }
  | { type: "none"; at: string }
  | { type: "progress"; percent: number }
  | { type: "downloaded"; version: string }
  | { type: "error"; message: string };

/** Folds electron-updater events into what Settings and the tray show. */
export function nextUpdateStatus(prev: UpdateStatus, ev: UpdateEvent): UpdateStatus {
  // A downloaded update stays ready: later checks or errors don't hide "restart to update".
  if (prev.kind === "ready" && ev.type !== "downloaded") return prev;
  switch (ev.type) {
    case "checking":
      return prev.kind === "downloading" ? prev : { kind: "checking" };
    case "available":
      return { kind: "downloading", version: ev.version, percent: 0 };
    case "none":
      return { kind: "none", checkedAt: ev.at };
    case "progress":
      return prev.kind === "downloading" ? { ...prev, percent: Math.max(0, Math.min(100, Math.round(ev.percent))) } : prev;
    case "downloaded":
      return { kind: "ready", version: ev.version };
    case "error":
      return { kind: "error", message: friendlyUpdateError(ev.message) };
  }
}

/** Raw updater errors are long HTTP dumps; players need one line. */
export function friendlyUpdateError(raw: string): string {
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|net::ERR_INTERNET|net::ERR_NAME/i.test(raw)) return "No internet connection.";
  if (/\b(404|401|403)\b|no published versions|Unable to find latest version/i.test(raw)) return "No published release to update from yet.";
  if (/sha512 checksum mismatch|signature/i.test(raw)) return "The download was damaged; it will retry later.";
  return raw.split("\n")[0].slice(0, 160);
}

export function describeUpdate(u: UpdateStatus): string {
  switch (u.kind) {
    case "dev":
      return "updates are off in development builds";
    case "idle":
      return "not checked yet";
    case "checking":
      return "checking…";
    case "none":
      return "up to date";
    case "downloading":
      return `downloading ${u.version} (${u.percent}%)`;
    case "ready":
      return `${u.version} is ready: it installs when you quit, or restart now`;
    case "error":
      return `couldn't check: ${u.message}`;
  }
}
