import { describe, expect, it } from "vitest";
import { connectionStatus } from "./connection.js";
import { DEFAULT_SETTINGS } from "./defaults.js";
import type { AppState } from "./types.js";

type S = Pick<AppState, "game" | "overlay" | "settings">;
const base = (over: { game?: Partial<AppState["game"]>; attached?: boolean } = {}): S => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  overlay: { attached: over.attached ?? false, targetFocused: false, bounds: null, editing: false, hidden: false },
  game: { logStatus: { kind: "searching" }, inGame: null, area: null, character: null, ...over.game },
});
const watching = { kind: "watching" as const, path: "C:\\Games\\Path of Exile\\logs\\Client.txt", sizeBytes: 1000 };
const LOOKED = ["No standalone client registered in Windows", "Steam libraries: C:\\Program Files (x86)\\Steam", "The usual game folders on C:, D:"];

describe("connection status for a new player", () => {
  it("before the game runs: waiting, nothing to do", () => {
    const s = connectionStatus(base(), 0);
    expect(s.tone).toBe("waiting");
    expect(s.title).toMatch(/Waiting for Path of Exile/);
    expect(s.offerPicker).toBe(false);
  });

  it("log found but the game isn't running yet", () => {
    expect(connectionStatus(base({ game: { logStatus: watching } }), 0)).toMatchObject({ tone: "waiting", title: "Found your game's log" });
  });

  it("connected at character select", () => {
    const s = connectionStatus(base({ attached: true, game: { logStatus: watching, inGame: false } }), 60_000);
    expect(s).toMatchObject({ tone: "connected", title: "Connected to your game" });
    expect(s.detail).toMatch(/character select/);
  });

  it("connected in a zone names it and your character", () => {
    const s = connectionStatus(
      base({ attached: true, game: { logStatus: watching, inGame: true, area: { id: "1_1_2", name: "The Coast", level: 2 }, character: { name: "X", className: "Witch", level: 3 } } }),
      60_000,
    );
    expect(s.detail).toBe("Your level 3 Witch is in The Coast. The guide follows you from zone to zone.");
  });

  it("game running but no log: a problem, with where we looked and a file picker", () => {
    const s = connectionStatus(base({ attached: true, game: { logStatus: { kind: "searching", looked: LOOKED } } }), 60_000);
    expect(s.tone).toBe("problem");
    expect(s.looked).toEqual(LOOKED);
    expect(s.offerPicker).toBe(true);
  });

  it("doesn't list where we looked while still in the grace period", () => {
    const s = connectionStatus(base({ attached: true, game: { logStatus: { kind: "searching", looked: LOOKED } } }), 3_000);
    expect(s.tone).toBe("waiting");
    expect(s.looked).toEqual([]);
  });
});
