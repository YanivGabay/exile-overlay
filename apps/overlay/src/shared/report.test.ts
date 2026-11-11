import { describe, expect, it } from "vitest";
import { buildReport, friendlyUpdateError, nextUpdateStatus, redact, type UpdateEvent, type UpdateStatus } from "./report.js";
import { DEFAULT_SETTINGS } from "./defaults.js";
import type { AppState } from "./types.js";

function state(): AppState {
  return {
    appVersion: "0.1.0",
    settings: { ...structuredClone(DEFAULT_SETTINGS), characters: { Zed_Witch: {} as never } },
    overlay: { attached: true, targetFocused: true, bounds: { x: 0, y: 0, width: 2560, height: 1440 }, editing: false, hidden: false },
    game: {
      logStatus: { kind: "watching", path: "C:\\Users\\Yaniv G\\Games\\Path of Exile\\logs\\Client.txt", sizeBytes: 2_500_000 },
      inGame: true,
      area: { id: "1_2_town", name: "The Forest Encampment", level: 13 },
      character: { name: "Zed_Witch", className: "Necromancer", level: 14 },
    },
    guide: { state: "ready", source: "snapshot", version: "2026.11.1", gameVersion: "3.30", title: "Campaign", message: null },
    tracking: null,
    update: { kind: "none", checkedAt: "2026-11-10T00:00:00Z" },
  };
}

describe("redact", () => {
  it("hides the user name in Windows and Unix paths, even with spaces", () => {
    expect(redact("C:\\Users\\Yaniv\\AppData\\Roaming")).toBe("C:\\Users\\<you>\\AppData\\Roaming");
    expect(redact("c:/users/bob/x.txt and /home/alice/.config")).toBe("c:/users/<you>/x.txt and /home/<you>/.config");
    expect(redact("at file:///C:/Users/Ann/app.asar/out/main/index.js:12")).toContain("C:/Users/<you>/app.asar");
  });
  it("hides character names", () => {
    expect(redact("Zed_Witch is now level 3", ["Zed_Witch"])).toBe("<character> is now level 3");
  });
});

describe("buildReport", () => {
  it("has what support needs and nothing personal", () => {
    const s = state();
    s.game.logStatus = { kind: "watching", path: "C:\\Users\\Yaniv\\PoE\\logs\\Client.txt", sizeBytes: 2_500_000 };
    const r = buildReport({
      state: s,
      platform: "win32 10.0.22631",
      electron: "45.2.1",
      logTail: "2026-11-10 INFO [app] Zed_Witch entered 1_2_town\n",
      error: { where: "main process", message: "boom", stack: "Error: boom\n    at C:\\Users\\Yaniv\\x.js:1" },
    });
    expect(r).toContain("Exile Overlay 0.1.0 on win32 10.0.22631 (Electron 45.2.1)");
    expect(r).toContain("attached, 2560x1440");
    expect(r).toContain("level 14 Necromancer");
    expect(r).toContain("Error in main process: boom");
    expect(r).toContain("Recent log:");
    expect(r).toContain("Update: up to date");
    expect(r).not.toContain("Yaniv");
    expect(r).not.toContain("Zed_Witch");
  });
});

describe("update status", () => {
  const run = (events: UpdateEvent[], from: UpdateStatus = { kind: "idle" }) => events.reduce(nextUpdateStatus, from);

  it("goes checking → downloading → ready", () => {
    expect(run([{ type: "checking" }, { type: "available", version: "0.1.1" }, { type: "progress", percent: 42.4 }])).toEqual({
      kind: "downloading",
      version: "0.1.1",
      percent: 42,
    });
    expect(run([{ type: "checking" }, { type: "available", version: "0.1.1" }, { type: "downloaded", version: "0.1.1" }])).toEqual({ kind: "ready", version: "0.1.1" });
  });

  it("keeps 'ready' through later checks and errors, so 'restart to update' never disappears", () => {
    const ready: UpdateStatus = { kind: "ready", version: "0.1.1" };
    expect(run([{ type: "checking" }, { type: "error", message: "ENOTFOUND" }, { type: "none", at: "x" }], ready)).toEqual(ready);
    expect(run([{ type: "downloaded", version: "0.1.2" }], ready)).toEqual({ kind: "ready", version: "0.1.2" });
  });

  it("doesn't drop a running download when the 6-hourly check fires", () => {
    const dl: UpdateStatus = { kind: "downloading", version: "0.1.1", percent: 70 };
    expect(run([{ type: "checking" }], dl)).toEqual(dl);
  });

  it("ignores progress without a download and clamps percent", () => {
    expect(run([{ type: "progress", percent: 50 }])).toEqual({ kind: "idle" });
    expect(run([{ type: "available", version: "1.0.0" }, { type: "progress", percent: 140 }])).toMatchObject({ percent: 100 });
  });

  it("turns raw updater errors into one plain line", () => {
    expect(friendlyUpdateError("getaddrinfo ENOTFOUND api.github.com")).toBe("No internet connection.");
    expect(friendlyUpdateError("HttpError: 404 \nheaders: {...}")).toBe("No published release to update from yet.");
    expect(friendlyUpdateError("sha512 checksum mismatch, expected abc")).toMatch(/damaged/);
    expect(friendlyUpdateError("weird\nsecond line")).toBe("weird");
    expect(nextUpdateStatus({ kind: "checking" }, { type: "error", message: "net::ERR_INTERNET_DISCONNECTED" })).toEqual({ kind: "error", message: "No internet connection." });
  });
});
