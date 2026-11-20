import type { GemPlan, GemPlanItem } from "@exile-overlay/route-engine";
import { describe, expect, it } from "vitest";
import { byQuest, groupLabel, upcomingGems } from "./gem-plan-view.js";

const item = (gemId: string, how: GemPlanItem["how"], npc: string | null, questId: string | null): GemPlanItem => ({ gemId, how, npc, questId, count: 1 });
const plan: GemPlan = {
  acts: [
    {
      act: 1,
      items: [
        item("fireball", "start", null, null),
        item("zombie", "quest", "Tarkleigh", "a1q1"),
        item("pulse", "vendor", "Nessa", "a1q1"),
        item("srs", "quest", "Tarkleigh", "a1q4"),
        item("bolt", "vendor", "Nessa", "a1q1"),
      ],
    },
    { act: 3, items: [item("cleave", "vendor", "Siosa", "a3q12")] },
  ],
  unavailable: [],
};

describe("gem plan view", () => {
  it("shows what is left in this act, then the next act with gems", () => {
    expect(upcomingGems(plan, 1, new Set())?.items.map((i) => i.gemId)).toEqual(["zombie", "pulse", "srs", "bolt"]);
    expect(upcomingGems(plan, 1, new Set(["a1q1"]))?.items.map((i) => i.gemId)).toEqual(["srs"]);
    expect(upcomingGems(plan, 1, new Set(["a1q1", "a1q4"]))?.act).toBe(3);
    expect(upcomingGems(plan, 2, new Set())?.act).toBe(3);
    expect(upcomingGems(plan, 4, new Set())).toBeNull();
  });

  it("groups by quest: one reward to take, the rest to buy and from whom", () => {
    const groups = byQuest(plan.acts[0].items);
    expect(groups.map((g) => [g.key, g.take.map((i) => i.gemId), g.takeFrom, g.buy.map((i) => i.gemId), g.buyFrom])).toEqual([
      ["start", ["fireball"], null, [], null],
      ["a1q1", ["zombie"], "Tarkleigh", ["pulse", "bolt"], "Nessa"],
      ["a1q4", ["srs"], "Tarkleigh", [], null],
    ]);
    const names: Record<string, string> = { a1q1: "Enemy at the Gate" };
    expect(groups.map((g) => groupLabel(g, (id) => names[id] ?? id))).toEqual(["Start", "Enemy at the Gate", "a1q4"]);
  });
});
