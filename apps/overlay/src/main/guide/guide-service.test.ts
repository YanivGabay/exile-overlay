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
  // Log clock: one second per line; advance() skips ahead (time spent in a zone).
  let clock = new Date(2026, 10, 2, 20, 10, 0).getTime();
  const advance = (seconds: number) => (clock += seconds * 1000);
  const stamp = () => {
    const d = new Date((clock += 1000));
    const p2 = (v: number) => String(v).padStart(2, "0");
    return `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  };
  const line = (rest: string) => `${stamp()} 1 a [DEBUG Client 1] ${rest}`;
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
  const disconnect = () => raw("Abnormal disconnect: An unexpected disconnection occurred.");
  return { state, guide, feed, enter, levelUp, logout, disconnect, active, raw, advance };
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
    // Sin's line only counts in Act 10, with the guide in the second half (it may trail behind).
    t.feed(t.raw("Sin: May a new dawn arise!"));
    expect(t.active().timer!.finishedAt).toBeNull();
    const edges = (t.guide as unknown as { compiled: { edges: string[] } }).compiled.edges;
    t.guide.pick(edges.indexOf("2_8_town"));
    t.feed(t.enter("2_10_6"), t.raw("Sin: May a new dawn arise!"));
    expect(t.active().timer!.finishedAt).not.toBeNull();
    expect(t.state.get().settings.runs).toHaveLength(1);
    expect(t.state.get().settings.runs[0].character).toBe("Runner");
  });

  it("names the zone you're in from the guide data (for the connection status)", async () => {
    const t = setup();
    t.guide.start(); // the zone names come from the loaded guide
    t.feed(t.enter("1_1_2"));
    await new Promise((r) => setTimeout(r, 10));
    expect(t.state.get().game.area).toMatchObject({ id: "1_1_2", name: "The Coast" });
    t.guide.stop();
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

  it("gives a new character's Twilight Strand to the new character, not an untracked endgame one", () => {
    const t = setup();
    // An endgame character the overlay met in maps: still at the first step.
    t.feed(t.enter("HideoutMountain"), t.levelUp("Mapper", "Necromancer", 94), t.enter("MapWorldsLookout"), t.enter("HideoutMountain"));
    expect(t.active().name).toBe("Mapper");
    expect(t.active().progress.activeEdge).toBe(0);
    t.feed(t.logout(), t.enter("1_1_1"));
    expect(t.state.get().tracking).toMatchObject({ kind: "character", event: "new" });
    t.feed(t.levelUp("Leaguestart", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    expect(t.active().name).toBe("Leaguestart");
    expect(t.active().timer?.fullRun).toBe(true);
    expect(t.state.get().settings.characters.Mapper.level).toBe(94);
  });

  it("starts the run timer on a new character's first zone, so the run counts as full", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("First", "Witch", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    t.feed(t.logout(), t.enter("1_1_1"));
    expect(t.active().timer?.fullRun).toBe(true);
    t.feed(t.levelUp("Second", "Duelist", 2), t.enter("1_1_town"));
    expect(t.active().name).toBe("Second");
    expect(t.active().timer?.fullRun).toBe(true);
    expect(t.active().timer?.actSplits[1]).toBe(0);
  });

  it("restarts a partial timer from a hideout visit when the campaign really starts", () => {
    const t = setup();
    // Overlay installed while in the hideout: the fresh profile gets a partial timer.
    t.feed(t.enter("HideoutMountain"));
    expect(t.active().timer?.fullRun).toBe(false);
    t.advance(3600);
    t.feed(t.enter("1_1_1"), t.levelUp("Fresh", "Templar", 2), t.enter("1_1_town"));
    expect(t.active().timer?.fullRun).toBe(true);
    expect(t.active().timer!.elapsedMs).toBeLessThan(60_000);
  });

  it("walking into a friend's instance: their level-up switches, their joined/left line undoes it", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Me", "Ranger", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    // You enter a zone the friend is already in: no "joined" line for them. They level first.
    t.feed(t.logout(), t.enter("1_1_2"), t.levelUp("PartyFriend", "Witch", 3));
    expect(t.state.get().settings.activeCharacter).toBe("PartyFriend");
    t.feed(t.enter("1_1_3"));
    // They follow you into the next zone: now we know they're another player.
    t.feed(t.raw(": PartyFriend has joined the area."));
    expect(t.state.get().settings.activeCharacter).toBe("Me");
    expect(t.state.get().settings.characters.PartyFriend).toBeUndefined();
    // The zone you entered meanwhile counts for you.
    expect(t.active().progress.activeEdge).toBeGreaterThan(2);
    t.feed(t.levelUp("PartyFriend", "Witch", 4));
    expect(t.state.get().settings.activeCharacter).toBe("Me");
    // Your own level-up always names you.
    t.feed(t.levelUp("Me", "Ranger", 3));
    expect(t.active().level).toBe(3);
  });

  it("your own level-up corrects a friend's switch even without a joined line", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Me", "Ranger", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    t.feed(t.logout(), t.enter("1_1_2"), t.levelUp("PartyFriend", "Witch", 3), t.levelUp("Me", "Ranger", 3), t.levelUp("Me", "Ranger", 4));
    expect(t.state.get().settings.activeCharacter).toBe("Me");
    expect(t.active().level).toBe(4);
  });

  it("pauses the clock on a disconnect and picks the same character back up", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Me", "Ranger", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    const before = t.active().timer!.elapsedMs;
    t.feed(t.disconnect());
    expect(t.active().timer!.lastAt).toBeNull();
    t.advance(5 * 60); // realm down for five minutes
    t.feed(t.logout(), t.enter("1_1_2"));
    expect(t.active().name).toBe("Me");
    expect(t.active().timer!.elapsedMs).toBeLessThan(before + 10_000);
  });

  it("stays bounded over an eight-hour session: campaign, then mapping, with deaths and disconnects", () => {
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Marathon", "Marauder", 2));
    const route = (t.guide as unknown as { compiled: { edges: string[] } }).compiled.edges;
    expect(route.length).toBeGreaterThan(100);
    let deaths = 0;
    const die = () => {
      t.feed(t.raw(": Marathon has been slain."));
      deaths++;
    };
    // About four hours of campaign.
    for (let i = 1; i < route.length; i++) {
      t.advance(55);
      t.feed(t.enter(route[i]));
      if (i % 7 === 0) die();
      if (i % 13 === 0) t.feed(t.enter("HideoutMountain"), t.enter(route[i]));
      if (i % 31 === 0) t.feed(t.disconnect(), t.logout(), t.enter(route[i]));
    }
    t.feed(t.enter("2_10_6"), t.raw("Sin: May a new dawn arise!")); // Sin speaks in Act 10
    expect(t.state.get().settings.runs).toHaveLength(1);
    expect(t.state.get().settings.runs[0].totalMs).toBeGreaterThan(3 * 3600_000);
    const afterCampaign = JSON.stringify(t.state.get().settings).length;
    // About four hours of maps.
    for (let i = 0; i < 300; i++) {
      t.advance(45);
      t.feed(t.enter("HideoutMountain"), t.enter(i % 2 ? "MapWorldsLookout" : "MapWorldsCrimsonTemple"));
      if (i % 9 === 0) die();
      if (i % 50 === 0) t.feed(t.disconnect(), t.logout(), t.enter("HideoutMountain"));
      if (i % 25 === 0) t.feed(t.levelUp("Marathon", "Juggernaut", 70 + i / 25));
    }
    const s = t.state.get().settings;
    expect(Object.keys(s.characters)).toEqual(["Marathon"]);
    expect(s.runs).toHaveLength(1);
    expect(t.active().level).toBe(81);
    // Deaths count until the campaign ends; the finished run keeps its total.
    expect(t.active().timer!.deaths).toBe(Math.floor((route.length - 1) / 7));
    expect(deaths).toBeGreaterThan(60);
    // Saved settings don't grow with play time.
    expect(JSON.stringify(s).length).toBeLessThan(afterCampaign * 1.05);
  });

  it("ignores a party member who joined your map, even when they level up first (real 3.30 pattern)", () => {
    // From a real Client.txt (2026/11/18, names changed): a level 95 character mapping,
    // a friend joins the map and levels up before you do.
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Me_Mapper", "Witch", 2), t.levelUp("Me_Mapper", "Necromancer", 95));
    t.feed(t.logout(), t.enter("HideoutSlum"), t.enter("MapWorldsStrand"));
    t.feed(t.raw(": Friend_One has joined the area."), t.raw(": Friend_One (Hierophant) is now level 88"));
    expect(t.state.get().settings.activeCharacter).toBe("Me_Mapper");
    expect(t.state.get().settings.characters.Friend_One).toBeUndefined();
    t.feed(t.raw(": Friend_One has left the area."), t.enter("HideoutSlum"), t.levelUp("Me_Mapper", "Necromancer", 96));
    expect(t.active().level).toBe(96);
    // Even in a later session (after character select), the friend is still not you.
    t.feed(t.logout(), t.enter("HideoutSlum"), t.levelUp("Friend_One", "Hierophant", 89));
    expect(t.state.get().settings.characters.Friend_One).toBeUndefined();
  });

  it("doesn't finish a run when Sin speaks while you carry a friend on a guessed character (real 3.30 pattern)", () => {
    // From a real Client.txt (2026/03/12, names changed): logged in to Act 2 town, which
    // matched an Act 2 alt; walked a friend through Act 10 without levelling; Sin spoke.
    const t = setup();
    t.feed(t.enter("1_1_1"), t.levelUp("Act2_Alt", "Duelist", 2), t.enter("1_1_town"), t.enter("1_1_2"));
    const edges = (t.guide as unknown as { compiled: { edges: string[] } }).compiled.edges;
    t.guide.pick(edges.indexOf("1_2_town"));
    t.feed(t.logout(), t.enter("1_2_town"), t.enter("HideoutMountain"), t.enter("2_10_2"));
    t.feed(t.raw(": Friend_One has joined the area."), t.enter("2_10_6"), t.raw("Sin: May a new dawn arise!"));
    expect(t.active().name).toBe("Act2_Alt");
    expect(t.active().timer?.finishedAt ?? null).toBeNull();
    expect(t.state.get().settings.runs).toHaveLength(0);
  });

  it("keeps the character you were playing after a relog, over an old one parked on that town (real 3.30 pattern)", () => {
    // From a real Client.txt (2026/11/14, names changed): relogging in Act 10 town while the
    // guide trailed in Act 9; an old character's saved progress sat exactly on that town.
    const t = setup();
    const edges = (t.guide as unknown as { compiled: { edges: string[] } }).compiled.edges;
    t.feed(t.enter("1_1_1"), t.levelUp("Old_Alt", "Ranger", 2));
    t.guide.pick(edges.indexOf("2_10_town"));
    t.feed(t.enter("2_10_town"));
    t.advance(120 * 24 * 3600); // the old character was last played months ago
    t.feed(t.logout(), t.enter("1_1_1"), t.levelUp("Current", "Witch", 2));
    t.guide.pick(edges.indexOf("2_9_town"));
    t.feed(t.levelUp("Current", "Necromancer", 62));
    for (let i = 0; i < 3; i++) {
      t.feed(t.logout(), t.enter("2_10_town"));
      expect(t.state.get().settings.activeCharacter).toBe("Current");
    }
    t.feed(t.enter("2_10_6"), t.raw("Sin: May a new dawn arise!"));
    expect(t.state.get().settings.runs.map((r) => r.character)).toEqual(["Current"]);
  });

  it("a level-up replayed at startup doesn't lock the session to a party member", () => {
    const t = setup();
    // Overlay started mid-session: the last level-up in the log was a friend's
    // (they joined before the replayed part of the log).
    t.guide.onLogEvent(parseLine(t.levelUp("Friend_One", "Hierophant", 40)) as LogEvent, true);
    t.feed(t.enter("1_2_town"), t.levelUp("Me_Now", "Witch", 20));
    expect(t.state.get().settings.activeCharacter).toBe("Me_Now");
  });

  it("switching between two characters played the same day goes to the one that fits the zone", () => {
    // Review finding: Main_A in Act 3, Alt_B parked exactly on the Act 4 town, both played today.
    const t = setup();
    const edges = (t.guide as unknown as { compiled: { edges: string[] } }).compiled.edges;
    t.feed(t.enter("1_1_1"), t.levelUp("Alt_B", "Ranger", 2));
    t.guide.pick(edges.indexOf("1_4_town"));
    t.feed(t.enter("1_4_town"));
    t.feed(t.logout(), t.enter("1_1_1"), t.levelUp("Main_A", "Witch", 2));
    t.guide.pick(edges.indexOf("1_3_town"));
    t.feed(t.enter("1_3_town"), t.levelUp("Main_A", "Witch", 30));
    t.feed(t.logout(), t.enter("1_4_town"));
    expect(t.state.get().settings.activeCharacter).toBe("Alt_B");
  });
});

