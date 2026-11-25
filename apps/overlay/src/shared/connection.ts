import { logHelp } from "./log-help.js";
import type { AppState } from "./types.js";

/**
 * One answer to "is the overlay connected to my game?", shown at the top of
 * the setup screen and Diagnostics. Connected means: the game window is found
 * and its log is being read. Everything else says what's missing and what to do.
 */
export interface ConnectionStatus {
  tone: "connected" | "waiting" | "problem";
  title: string;
  detail: string;
  /** Where the log search looked (only when the log wasn't found). */
  looked: string[];
  /** Offer "Choose Client.txt…". */
  offerPicker: boolean;
}

export function connectionStatus(state: Pick<AppState, "game" | "overlay" | "settings">, gameUpForMs: number): ConnectionStatus {
  const { game, overlay } = state;
  const log = game.logStatus;
  if (log.kind === "watching" && overlay.attached) {
    const who = game.character ? `level ${game.character.level} ${game.character.className}` : null;
    const where = game.area ? game.area.name ?? game.area.id : null;
    const detail =
      game.inGame === false || !where
        ? "At character select: log in, and the guide appears when you enter a zone."
        : `${who ? `Your ${who} is in` : "You're in"} ${where}. The guide follows you from zone to zone.`;
    return { tone: "connected", title: "Connected to your game", detail, looked: [], offerPicker: false };
  }
  if (log.kind === "watching")
    return {
      tone: "waiting",
      title: "Found your game's log",
      detail: "Start Path of Exile in Windowed or Windowed Fullscreen mode and the overlay connects by itself.",
      looked: [],
      offerPicker: false,
    };
  const help = logHelp(state, gameUpForMs);
  const looked = log.kind === "searching" && help.ok === false ? log.looked ?? [] : [];
  return {
    tone: help.ok === false ? "problem" : "waiting",
    title: help.title,
    detail: help.detail,
    looked,
    offerPicker: help.offerPicker,
  };
}
