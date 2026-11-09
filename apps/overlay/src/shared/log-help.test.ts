import { describe, expect, it } from "vitest";
import { LOG_GRACE_MS, logHelp } from "./log-help.js";
import { DEFAULT_SETTINGS } from "./defaults.js";
import type { AppState, LogStatus } from "./types.js";

function s(logStatus: LogStatus, attached: boolean, clientLogPath: string | null = null) {
  return {
    settings: { ...DEFAULT_SETTINGS, game: { ...DEFAULT_SETTINGS.game, clientLogPath } },
    overlay: { attached, targetFocused: false, bounds: null, editing: false, hidden: false },
    game: { logStatus, inGame: null, area: null, character: null },
  } as Pick<AppState, "game" | "overlay" | "settings">;
}

describe("logHelp: first run with no Client.txt yet", () => {
  it("is a calm wait before the game runs, with no picker", () => {
    const h = logHelp(s({ kind: "searching" }, false), 0);
    expect(h.ok).toBeNull();
    expect(h.title).toBe("Waiting for Path of Exile");
    expect(h.offerPicker).toBe(false);
  });

  it("still waits while the game is starting up", () => {
    expect(logHelp(s({ kind: "searching" }, true), LOG_GRACE_MS - 1).ok).toBeNull();
  });

  it("offers the picker once the game has run a while and no log was found", () => {
    const h = logHelp(s({ kind: "searching" }, true), LOG_GRACE_MS);
    expect(h.ok).toBe(false);
    expect(h.offerPicker).toBe(true);
    expect(h.detail).toMatch(/logs\\Client\.txt/);
  });

  it("explains a chosen path that doesn't exist", () => {
    const h = logHelp(s({ kind: "searching" }, false, "D:\\nope\\Client.txt"), 0);
    expect(h.ok).toBe(false);
    expect(h.detail).toContain("D:\\nope\\Client.txt");
    expect(h.offerPicker).toBe(true);
  });

  it("mentions administrator mode on read errors", () => {
    const h = logHelp(s({ kind: "error", message: "EACCES: permission denied" }, true), 0);
    expect(h.ok).toBe(false);
    expect(h.detail).toMatch(/administrator/);
  });

  it("is green when the log is being read", () => {
    expect(logHelp(s({ kind: "watching", path: "C:\\PoE\\logs\\Client.txt", sizeBytes: 1 }, true), 0)).toMatchObject({ ok: true, offerPicker: false });
  });
});
