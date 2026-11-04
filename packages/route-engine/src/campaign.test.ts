import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { campaignStatus, compileGuide, recommendedLevel, trackArea, INITIAL_PROGRESS, type CampaignInfo, type GameData, type GuideProgress } from "./index.js";

const bundle = JSON.parse(readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8")) as {
  routes: string[];
  data: GameData.Bundle;
  campaign: CampaignInfo;
};
const guide = compileGuide(bundle.routes, bundle.data);
const areas = bundle.data.Areas;
const ctx = {
  actOf: (id: string) => areas[id]?.act,
  questName: (id: string) => bundle.data.Quests[id]?.name ?? id,
  killAllBandits: true,
};
const trackCtx = { isTown: (id: string) => areas[id]?.is_town_area ?? false, actOf: (id: string) => areas[id]?.act };

describe("campaignStatus", () => {
  it("counts every passive point on the route (22 quests + bandits)", () => {
    const s = campaignStatus(guide, INITIAL_PROGRESS, bundle.campaign, ctx);
    expect(s.pointsTotal).toBe(23);
    expect(s.pointsDone).toBe(0);
    expect(s.actRemaining.map((q) => q.name)).toContain("The Dweller of the Deep");
  });

  it("flags a passive quest whose zone the player skipped", () => {
    // Play Act 1 but skip the Tidal Island / Ship Graveyard detours by jumping ahead.
    let p: GuideProgress = INITIAL_PROGRESS;
    for (const a of ["1_1_town", "1_1_2", "1_1_3", "1_1_4_1", "1_1_5", "1_1_6", "1_1_7_1", "1_1_7_2", "1_1_8", "1_1_9"])
      p = trackArea(guide, p, a, trackCtx).progress;
    const s = campaignStatus(guide, p, bundle.campaign, ctx);
    expect(s.missed.length).toBeGreaterThan(0);
    expect(s.missed.every((q) => q.act === 1)).toBe(true);
  });

  it("reports the resistance penalty when Act 6 starts", () => {
    const act6 = guide.edges.findIndex((e) => areas[e]?.act === 6);
    const s = campaignStatus(guide, { activeEdge: act6, completed: [] }, bundle.campaign, ctx);
    expect(s.resistPenalty).toMatchObject({ total: -30, fresh: true });
    const before = campaignStatus(guide, { activeEdge: act6 - 1, completed: [] }, bundle.campaign, ctx);
    expect(before.resistPenalty).toBeNull();
  });

  it("finds recommended levels in hints", () => {
    const steps = guide.steps.map((s) => s.step).filter((s) => s.type === "fragment_step");
    const levels = steps.map((s) => recommendedLevel([s])).filter((n) => n !== null);
    expect(levels.length).toBeGreaterThan(5);
  });
});

describe("league notes", () => {
  it("has the two 5-link zones as area notes with existing area ids", () => {
    const notes = bundle.campaign.league?.notes ?? [];
    const five = notes.filter((n) => n.id.startsWith("5l-"));
    expect(five.map((n) => n.area).sort()).toEqual(["1_5_1", "2_6_1"]);
    for (const n of five) expect(bundle.data.Areas[n.area!]).toBeDefined();
    expect(guide.edges).toContain("1_5_1");
  });
});

import { activeReminders, trialStatus } from "./reminders.js";

describe("reminders", () => {
  const rctx = (level: number | null, upcoming: string[] = []) => ({
    level,
    actOf: (id: string) => areas[id]?.act,
    upcoming,
    dismissed: new Set<string>(),
  });
  const at = (area: string) => ({ activeEdge: guide.edges.indexOf(area), completed: [] });
  const ids = (p: { activeEdge: number; completed: string[] }, level: number | null, upcoming: string[] = []) =>
    activeReminders(guide, p, bundle.campaign.reminders ?? [], rctx(level, upcoming)).map((r) => r.id);

  it("shows the boots recipe after Mercy Mission and upgrades the tier with level", () => {
    expect(ids(INITIAL_PROGRESS, 2)).not.toContain("ms-10");
    const after = at("1_1_4_0"); // Flooded Depths: after Mercy Mission (Tidal Island)
    expect(ids(after, 8)).toContain("ms-10");
    const act2 = at("1_2_town");
    const r = ids(act2, 13);
    expect(r).toContain("ms-15");
    expect(r).not.toContain("ms-10");
  });

  it("warns about Kaom's Stronghold only when it is coming and you are under level", () => {
    const p = at("1_4_town");
    expect(ids(p, 28, ["1_4_town", "1_4_4_3"])).toContain("level-kaom");
    expect(ids(p, 33, ["1_4_town", "1_4_4_3"])).not.toContain("level-kaom");
    expect(ids(p, 28, ["1_4_town"])).not.toContain("level-kaom");
  });

  it("respects dismissals", () => {
    const p = at("1_2_town");
    const r = activeReminders(guide, p, bundle.campaign.reminders ?? [], { ...rctx(13), dismissed: new Set(["ms-15"]) });
    expect(r.map((x) => x.id)).not.toContain("ms-15");
  });
});

describe("trialStatus", () => {
  it("counts 6 normal, 3 cruel, 3 merciless trials on the league-start route", () => {
    const t = trialStatus(guide, INITIAL_PROGRESS, (id) => areas[id]?.act);
    expect(t.map((x) => [x.lab, x.total])).toEqual([
      ["normal", 6],
      ["cruel", 3],
      ["merciless", 3],
    ]);
    expect(t.every((x) => x.done === 0 && !x.labReached)).toBe(true);
    const end = trialStatus(guide, { activeEdge: guide.edges.length - 1, completed: [] }, (id) => areas[id]?.act);
    expect(end.every((x) => x.done === x.total && x.labReached)).toBe(true);
  });
});

import { tipsFor } from "./campaign.js";

describe("zone tips and presets", () => {
  const presets = bundle.campaign.presets ?? [];
  it("ships four presets", () => {
    expect(presets.map((p) => p.id)).toEqual(["league-start", "speedrun", "safe", "new"]);
  });
  it("filters tips by preset style", () => {
    const speed = presets.find((p) => p.id === "speedrun")!;
    const safe = presets.find((p) => p.id === "safe")!;
    // The Den (Great White Beast) is a league-start detour: safe yes, speedrun no.
    expect(tipsFor(bundle.campaign, "1_2_2a", safe).length).toBeGreaterThan(0);
    expect(tipsFor(bundle.campaign, "1_2_2a", speed).length).toBe(0);
    expect(tipsFor(bundle.campaign, "1_3_14_2", speed)[0].text).toMatch(/one wagon/);
  });
  it("only safe presets get the extra resistance checks", () => {
    const at = { activeEdge: guide.edges.indexOf("1_4_town"), completed: [] };
    const base = { level: 30, actOf: (id: string) => areas[id]?.act, upcoming: ["1_4_town", "1_4_4_3"], dismissed: new Set<string>() };
    const ids = (preset: string) => activeReminders(guide, at, bundle.campaign.reminders ?? [], { ...base, preset }).map((r) => r.id);
    expect(ids("safe")).toContain("safe-res-kaom");
    expect(ids("speedrun")).not.toContain("safe-res-kaom");
  });
});

describe("preset contents", () => {
  const presets = bundle.campaign.presets ?? [];
  const text = (id: string) => {
    const g = compileGuide(bundle.routes, bundle.data, presets.find((p) => p.id === id)!.options);
    return JSON.stringify(g.steps.map((s) => s.step));
  };
  it("league start: passive quests, trials, quicksilvers and 5-links, no side extras", () => {
    const t = text("league-start");
    expect(t).toContain("5-link body armour");
    expect(t).toContain('"trial"');
    expect(t).toContain("Hailrake");
    expect(t).not.toContain("Chemist");
    expect(t).not.toContain("Silver Locket");
  });
  it("speedrun: 5-links yes, trials and flask detours no", () => {
    const t = text("speedrun");
    expect(t).toContain("5-link body armour");
    expect(t).not.toContain('"trial"');
    expect(t).not.toContain("Hailrake");
  });
  it("every preset keeps every passive-point quest", () => {
    for (const p of presets) {
      const g = compileGuide(bundle.routes, bundle.data, p.options);
      const s = campaignStatus(g, INITIAL_PROGRESS, bundle.campaign, ctx);
      expect(s.quests.filter((q) => q.points > 0 && q.questId !== "a2q7").length).toBe(22);
    }
  });
});

import { recipeStatus } from "./campaign.js";

describe("crafting recipes", () => {
  it("counts recipes and flags the important ones where they are", () => {
    const start = recipeStatus(guide, INITIAL_PROGRESS, bundle.campaign);
    expect(start.total).toBeGreaterThan(40);
    expect(start.collected).toBe(0);
    const kaom = guide.edges.indexOf("1_4_4_3");
    const at = recipeStatus(guide, { activeEdge: kaom, completed: [] }, bundle.campaign);
    expect(at.here.find((r) => r.name.startsWith("Socket Links"))?.why).toMatch(/4-link/);
    expect(at.collected).toBeGreaterThan(10);
  });
  it("speedrun preset still collects the on-path recipes moved out of trial blocks", () => {
    const speed = (bundle.campaign.presets ?? []).find((p) => p.id === "speedrun")!;
    const g = compileGuide(bundle.routes, bundle.data, speed.options);
    const names = JSON.stringify(g.steps.map((s) => s.step));
    for (const r of ["Flask Duration - Rank 1", "Damage over Time - Rank 1", "All Attributes - Rank 1"]) expect(names).toContain(r);
  });
});

import { questsDone, searchStrings } from "./reminders.js";
describe("shopping helpers", () => {
  it("splits search text at 250 characters", () => {
    const terms = Array.from({ length: 40 }, (_, i) => `Some Long Gem Name ${i}`);
    const out = searchStrings(terms);
    expect(out.length).toBeGreaterThan(1);
    for (const s of out) expect(s.length).toBeLessThanOrEqual(250);
    expect(searchStrings(["Sunder", "Leap Slam"])).toEqual(['"Sunder|Leap Slam"']);
  });
  it("knows which quests are done", () => {
    const done = questsDone(guide, { activeEdge: guide.edges.indexOf("1_2_town"), completed: [] });
    expect(done.has("a1q1")).toBe(true);
    expect(done.has("a3q11")).toBe(false);
  });
});
