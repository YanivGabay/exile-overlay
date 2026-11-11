import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { parseLine, type LogEvent } from "@exile-overlay/log-watcher";
import { AppStateStore } from "../state/app-state.js";
import { GuideService } from "./guide-service.js";
import { SettingsStore } from "../state/settings-store.js";
import { DEFAULT_CHARACTER, DEFAULT_SETTINGS } from "../../shared/defaults.js";
import type { AppState } from "../../shared/types.js";

const SNAPSHOT = fileURLToPath(new URL("../../../../../guides-snapshot/poe1.json", import.meta.url));

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "eo-guide-"));
  const store = SettingsStore.inDir(dir);
  const initial: AppState = {
    appVersion: "test",
    settings: structuredClone(DEFAULT_SETTINGS),
    overlay: { attached: true, targetFocused: true, bounds: null, editing: false, hidden: false },
    game: { logStatus: { kind: "searching" }, inGame: true, area: null, character: null },
    guide: { state: "loading", source: null, version: null, gameVersion: null, title: null, message: null },
    tracking: null,
  };
  const state = new AppStateStore(initial, store);
  const guide = new GuideService(state, SNAPSHOT, join(dir, "guides"), null);
  guide.start();
  guide.stop();
  let n = 0;
  const line = (rest: string) => `2026/11/02 20:${String(10 + Math.floor(n / 60)).padStart(2, "0")}:${String(n++ % 60).padStart(2, "0")} 1 a [DEBUG Client 1] ${rest}`;
  const feed = (...raw: string[]) => {
    for (const r of raw) {
      const e = parseLine(r) as LogEvent;
      if (e.type === "areaGenerated") state.set("game", { ...state.get().game, area: { id: e.areaId, name: null, level: e.areaLevel } });
      guide.onLogEvent(e, false);
    }
  };
  const enter = (areaId: string) => line(`Generating level 1 area "${areaId}" with seed 1`);
  const raw = (rest: string) => line(rest).replace("[DEBUG", "[INFO");
  const levelUp = (name: string, cls: string, lvl: number) => line(`: ${name} (${cls}) is now level ${lvl}`).replace("[DEBUG", "[INFO");
  const logout = () => line("Async connecting to lon.login.pathofexile.com:20487");
  const active = () => {
    const s = state.get().settings;
    return s.characters[s.activeCharacter ?? DEFAULT_CHARACTER];
  };
  return { state, guide, feed, enter, levelUp, logout, active, raw };
}

describe("GuideService with log events", () => {
  it("times a full run, splits by act, counts deaths, stores the finished run", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Runner", "Duelist", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    let timer = t.active().timer!;
    expect(timer.fullRun).toBe(true);
    expect(timer.elapsedMs).toBeGreaterThan(0);
    expect(timer.actSplits[1]).toBe(0);
    t.feed(t.raw(": Runner has been slain."));
    expect(t.active().timer!.deaths).toBe(1);
    // Character select stops the clock; the next zone resumes it without counting the gap.
    const before = t.active().timer!.elapsedMs;
    t.feed(t.logout());
    timer = t.active().timer!;
    expect(timer.lastAt).toBeNull();
    t.feed(t.enter("1_1_2"));
    expect(t.active().timer!.elapsedMs).toBeLessThanOrEqual(before + 2000);
    t.feed(t.raw(": You have been permanently weakened by Kitava's cruel affliction. You now have -30% to all Resistances."));
    expect(t.active().resistPenalty).toBe(-30);
    expect(t.state.get().tracking).toMatchObject({ kind: "resist", total: -30 });
    t.feed(t.raw("Sin: May a new dawn arise!"));
    expect(t.active().timer!.finishedAt).not.toBeNull();
    expect(t.state.get().settings.runs).toHaveLength(1);
    expect(t.state.get().settings.runs[0].character).toBe("Runner");
  });

  it("keeps timer and dismissals when a fresh character gets its name", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"));
    expect(t.active().timer).toBeDefined();
    t.guide.dismissReminder("ms-10");
    t.feed(t.levelUp("Named", "Witch", 2));
    expect(t.active().name).toBe("Named");
    expect(t.active().timer).toBeDefined();
    expect(t.active().dismissed).toContain("ms-10");
  });

  it("follows a fresh character and survives town trips (the reported bug)", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Fresh_Witch", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    expect(t.active().name).toBe("Fresh_Witch");
    const coast = t.active().progress.activeEdge;
    t.feed(t.enter("1_1_town"), t.enter("1_1_2"));
    expect(t.active().progress.activeEdge).toBe(coast);
    expect(t.state.get().tracking?.kind).toBe("same");
  });

  it("switches between characters after logging out", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Alt", "Ranger", 2), t.enter("1_1_town"), t.enter("1_1_2"), t.enter("1_1_3"));
    const altEdge = t.active().progress.activeEdge;
    // Another character, already in Act 6 when first seen.
    t.feed(t.logout(), t.enter("2_6_town"));
    expect(t.state.get().tracking).toMatchObject({ kind: "character", event: "paused" });
    t.feed(t.levelUp("Main", "Juggernaut", 51));
    expect(t.state.get().settings.activeCharacter).toBe("Main");
    expect(t.active().progress.activeEdge).toBeGreaterThan(altEdge);
    // Back to the alt: recognised from its zone, progress untouched.
    t.feed(t.logout(), t.enter("1_1_3"));
    expect(t.state.get().settings.activeCharacter).toBe("Alt");
    expect(t.active().progress.activeEdge).toBe(altEdge);
    expect(t.state.get().tracking).toMatchObject({ kind: "character", event: "switched", name: "Alt" });
  });

  it("clears the pause when the same character comes back", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Solo", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    t.feed(t.logout(), t.enter("2_6_town"));
    expect(t.state.get().tracking).toMatchObject({ event: "paused" });
    t.feed(t.logout(), t.enter("1_1_2"));
    expect(t.state.get().tracking).toMatchObject({ kind: "character", event: "switched", name: "Solo" });
  });

  it("starts a new character at the beginning", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("First", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    t.feed(t.logout(), t.enter("1_1_1"));
    expect(t.state.get().tracking).toMatchObject({ kind: "character", event: "new" });
    expect(t.state.get().settings.activeCharacter).toBeNull();
    expect(t.active().progress.activeEdge).toBe(0);
    t.feed(t.levelUp("Second", "Duelist", 2));
    expect(t.state.get().settings.activeCharacter).toBe("Second");
    expect(t.state.get().settings.characters.First.progress.activeEdge).toBeGreaterThan(0);
  });

  it("undo and resync cycling", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("P", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    const coast = t.active().progress.activeEdge;
    t.guide.step(1);
    t.guide.step(1);
    expect(t.active().progress.activeEdge).toBe(coast + 2);
    t.guide.undo();
    expect(t.active().progress.activeEdge).toBe(coast + 1);
    // In The Coast: "I'm here" picks the nearest Coast visit, pressing again cycles.
    t.guide.resync();
    const first = t.active().progress.activeEdge;
    t.guide.resync();
    const second = t.active().progress.activeEdge;
    expect(first).not.toBe(second);
    expect(t.state.get().tracking).toMatchObject({ kind: "manual", how: "resync" });
  });

  it("applies an imported build", () => {
    const t = setup();
    const xml = `<PathOfBuilding><Build className="Marauder" bandit="None"/><Skills><Skill enabled="true"><Gem gemId="Metadata/Items/Gems/SkillGemSunder"/></Skill></Skills></PathOfBuilding>`;
    const code = deflateSync(Buffer.from(xml)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
    let render = t.guide.getRender();
    const before = render!.steps.length;
    t.guide.setPob(code);
    render = t.guide.getRender();
    expect(render!.buildError).toBeNull();
    expect(render!.steps.length).toBeGreaterThan(before);
    expect(Object.values(render!.gems).map((g) => g.name)).toContain("Sunder");
  });
});
