import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  activeReminders,
  buildVendorSearch,
  campaignStatus,
  compileGuide,
  INITIAL_PROGRESS,
  recipeStatus,
  tipsFor,
  trackArea,
  trialStatus,
  zoneCard,
  type CampaignInfo,
  type GameData,
  type GuideProgress,
  type Reminder,
  type SearchData,
} from "./index.js";

/**
 * Whole-campaign simulation over the shipped guide bundle: walks the route
 * for every preset (a clean run, and the 13 real runs) and checks what the
 * overlay would show at every zone.
 */
const bundle = JSON.parse(readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8")) as {
  routes: string[];
  data: GameData.Bundle;
  campaign: CampaignInfo & { reminders: Reminder[]; presets: NonNullable<CampaignInfo["presets"]> };
  search: SearchData;
};
const { runs } = JSON.parse(readFileSync(new URL("../test-fixtures/real-runs.json", import.meta.url), "utf8")) as {
  runs: string[][];
};
const areas = bundle.data.Areas;
const info = bundle.campaign;
const actOf = (id: string) => areas[id]?.act;
const ctx = { isTown: (id: string) => areas[id]?.is_town_area ?? false, actOf };

function snapshot(guide: ReturnType<typeof compileGuide>, progress: GuideProgress, preset: string, level: number) {
  const card = zoneCard(guide, progress, 2);
  const status = campaignStatus(guide, progress, info, { actOf, questName: (id) => id, killAllBandits: true });
  const reminders = activeReminders(guide, progress, info.reminders, {
    level,
    actOf,
    upcoming: [card.areaId, ...card.path],
    dismissed: new Set(),
    preset,
  });
  return { card, status, reminders, recipes: recipeStatus(guide, progress, info), trials: trialStatus(guide, progress, actOf) };
}

const validSearch = (s: string, max: number) =>
  s.length <= max && /^"[^"]+"$/.test(s) && !s.slice(1, -1).split("|").some((t) => !t.trim());

describe.each(info.presets.map((p) => [p.id, p] as const))("preset %s", (presetId, preset) => {
  const guide = compileGuide(bundle.routes, bundle.data, preset.options);
  const seen = new Set<string>();

  it.each([0, -8])("clean run (player level = area level %i): every zone renders sane values", (offset) => {
    let progress: GuideProgress = INITIAL_PROGRESS;
    let total: number | null = null;
    let lastDone = 0;
    for (let edge = 0; edge < guide.edges.length; edge++) {
      const area = guide.edges[edge];
      progress = { ...progress, activeEdge: edge, visited: [...(progress.visited ?? []), edge] };
      const level = Math.max(1, (areas[area]?.level ?? 1) + offset);
      const s = snapshot(guide, progress, presetId, level);
      expect(s.card.areaId).toBe(area);
      total ??= s.status.pointsTotal;
      expect(s.status.pointsTotal).toBe(total);
      expect(s.status.pointsDone).toBeGreaterThanOrEqual(lastDone);
      expect(s.status.pointsDone).toBeLessThanOrEqual(total);
      expect(s.status.missed).toEqual([]);
      lastDone = s.status.pointsDone;
      expect(s.recipes.collected).toBeLessThanOrEqual(s.recipes.total);
      for (const t of s.trials) expect(t.done).toBeLessThanOrEqual(t.total);
      const groups = s.reminders.filter((r) => r.group).map((r) => r.group);
      expect(new Set(groups).size).toBe(groups.length);
      for (const r of s.reminders) {
        seen.add(r.id);
        expect(r.text.trim()).not.toBe("");
        if (r.search) expect(validSearch(r.search, bundle.search.maxLength), `${r.id}: ${r.search}`).toBe(true);
      }
      for (const t of tipsFor(info, area, preset)) expect(t.text.trim()).not.toBe("");
    }
    // A clean run collects every passive point on the route.
    const end = snapshot(guide, { ...progress, activeEdge: guide.edges.length - 1 }, presetId, 70);
    expect(end.status.quests.filter((q) => q.status !== "done" && q.status !== "here")).toEqual([]);
  });

  it("clean run: every reminder for this preset shows up at some point", () => {
    const quests = new Set(
      guide.steps.flatMap((s) => (s.step.type === "fragment_step" ? s.step.parts : [])).flatMap((p) => (typeof p !== "string" && p.type === "quest" ? [p.questId] : [])),
    );
    const dead = info.reminders
      .filter((r) => !r.presets || r.presets.includes(presetId))
      // Tied to a quest this preset skips (e.g. no Quicksilver quest in speedrun): off by design.
      .filter((r) => !r.when.questDone || quests.has(r.when.questDone))
      .filter((r) => !seen.has(r.id))
      .map((r) => r.id);
    expect(dead).toEqual([]);
  });

  it("real runs: tracking plus every computation never throws or goes out of range", () => {
    for (const run of runs) {
      let progress: GuideProgress = INITIAL_PROGRESS;
      for (const areaId of run) {
        progress = trackArea(guide, progress, areaId, ctx).progress;
        expect(progress.activeEdge).toBeGreaterThanOrEqual(0);
        expect(progress.activeEdge).toBeLessThan(guide.edges.length);
        const s = snapshot(guide, progress, presetId, areas[areaId]?.level ?? 1);
        expect(s.status.pointsDone).toBeLessThanOrEqual(s.status.pointsTotal);
        expect(s.reminders.length).toBeLessThan(8);
      }
    }
  });
});

describe("guide data", () => {
  it("vendor search strings fit the game's box at every item level", () => {
    const presets = Object.keys(bundle.search.presets);
    const links = Object.keys(bundle.search.links);
    for (let ilvl = 1; ilvl <= 70; ilvl++) {
      for (const s of buildVendorSearch(bundle.search, presets, links, ilvl, ["Frostblink", "Flame Dash"]))
        expect(validSearch(s, bundle.search.maxLength), s).toBe(true);
    }
  });

  it("every zone tip is for a real campaign zone", () => {
    const off = Object.keys(info.zoneTips ?? {}).filter((a) => !areas[a] || areas[a].is_town_area);
    expect(off).toEqual([]);
  });

  it("every important recipe is a recipe the route actually collects", () => {
    const names = new Set<string>();
    for (const p of info.presets) {
      const g = compileGuide(bundle.routes, bundle.data, p.options);
      for (const s of g.steps)
        if (s.step.type === "fragment_step")
          for (const part of s.step.parts) if (typeof part !== "string" && part.type === "crafting") part.crafting_recipes.forEach((n) => names.add(n));
    }
    const unknown = Object.keys(info.importantRecipes ?? {}).filter((n) => !names.has(n));
    expect(unknown).toEqual([]);
  });

  it("every preset gives the same passive-point total", () => {
    const totals = info.presets.map((p) => {
      const g = compileGuide(bundle.routes, bundle.data, p.options);
      return campaignStatus(g, INITIAL_PROGRESS, info, { actOf, questName: (id) => id, killAllBandits: p.options.bandit === "None" }).pointsTotal;
    });
    expect(new Set(totals).size).toBe(1);
  });
});
