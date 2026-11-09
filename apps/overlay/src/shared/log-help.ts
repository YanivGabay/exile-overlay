import type { AppState } from "./types.js";

/**
 * What to tell the player about the game log, in the setup screen and the
 * overlay. A fresh install usually has no Client.txt yet (the game hasn't
 * run, or runs from an unusual folder): that is a wait, not an error, until
 * the game window is up and the log still can't be found.
 */
export interface LogHelp {
  ok: boolean | null;
  title: string;
  detail: string;
  /** Offer "Choose Client.txt…". */
  offerPicker: boolean;
}

/** How long the game window may be up before a missing log counts as a problem. */
export const LOG_GRACE_MS = 15_000;

export function logHelp(state: Pick<AppState, "game" | "overlay" | "settings">, gameUpForMs: number): LogHelp {
  const log = state.game.logStatus;
  const manual = state.settings.game.clientLogPath;
  if (log.kind === "watching") return { ok: true, title: "Game log found", detail: `Reading ${log.path}`, offerPicker: false };
  if (log.kind === "error")
    return {
      ok: false,
      title: "Can't read the game log",
      detail: `${log.message}. If the game runs as administrator, run Exile Overlay as administrator too, or choose Client.txt yourself.`,
      offerPicker: true,
    };
  if (manual)
    return {
      ok: false,
      title: "The chosen Client.txt doesn't exist",
      detail: `Nothing at ${manual}. Choose the file again, or clear it to detect it automatically.`,
      offerPicker: true,
    };
  if (!state.overlay.attached || gameUpForMs < LOG_GRACE_MS)
    return {
      ok: null,
      title: "Waiting for Path of Exile",
      detail: "Start the game: the log is found automatically once it runs. Nothing to do yet.",
      offerPicker: false,
    };
  return {
    ok: false,
    title: "Can't find the game log",
    detail: "The game is running but its log wasn't found. Choose Client.txt in the game folder's logs folder, e.g. …\\Path of Exile\\logs\\Client.txt.",
    offerPicker: true,
  };
}
