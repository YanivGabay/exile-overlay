import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CrashLog } from "./crash-log.js";
import { buildReport } from "../../shared/report.js";
import { DEFAULT_SETTINGS } from "../../shared/defaults.js";
import type { AppState } from "../../shared/types.js";

const dir = () => mkdtempSync(join(tmpdir(), "eo-crash-"));

describe("local crash log", () => {
  it("keeps crashes on disk, newest first, across restarts", () => {
    const d = dir();
    const log = new CrashLog(d, "0.1.4");
    log.record({ where: "main process", message: "first", at: "2026-11-25T10:00:00.000Z" });
    log.record({ where: "overlay page", message: "second", stack: "Error: second\n    at x", at: "2026-11-25T11:00:00.000Z" });
    const again = new CrashLog(d, "0.1.4").list();
    expect(again.map((e) => e.message)).toEqual(["second", "first"]);
    expect(again[0]).toMatchObject({ where: "overlay page", version: "0.1.4" });
  });

  it("never grows past the limit", () => {
    const log = new CrashLog(dir(), "0.1.4", 5);
    for (let i = 0; i < 12; i++) log.record({ where: "main process", message: `crash ${i}` });
    expect(log.list().map((e) => e.message)).toEqual(["crash 11", "crash 10", "crash 9", "crash 8", "crash 7"]);
  });

  it("starts over from a damaged file instead of failing", () => {
    const d = dir();
    writeFileSync(join(d, "crashes.json"), "{not json");
    const log = new CrashLog(d, "0.1.4");
    expect(log.list()).toEqual([]);
    log.record({ where: "main process", message: "after damage" });
    expect(log.list()).toHaveLength(1);
  });

  it("a crash's bug report leaves out your Windows user name and character names", () => {
    const state: AppState = {
      appVersion: "0.1.4",
      settings: { ...structuredClone(DEFAULT_SETTINGS), characters: {} },
      overlay: { attached: true, targetFocused: true, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, editing: false, hidden: false },
      game: { logStatus: { kind: "watching", path: "C:\\Users\\Jane\\Games\\Client.txt", sizeBytes: 1 }, inGame: true, area: null, character: { name: "Jane_Witch", className: "Witch", level: 12 } },
      guide: { state: "ready", source: "snapshot", version: "v", gameVersion: "3.30", title: "t", message: null },
      tracking: null,
    };
    const crash = new CrashLog(dir(), "0.1.4").record({ where: "overlay page", message: "Jane_Witch broke", stack: "at C:\\Users\\Jane\\AppData\\x.js:1" });
    const report = buildReport({ state, platform: "win32", electron: "45", logTail: "", error: crash });
    expect(report).toContain("Error in overlay page");
    expect(report).not.toMatch(/Jane/);
  });
});
