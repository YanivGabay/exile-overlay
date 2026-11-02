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
