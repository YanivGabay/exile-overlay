import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compileGuide, INITIAL_PROGRESS, trackArea, type GameData, type GuideProgress } from "./index.js";

const bundle = JSON.parse(
  readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8"),
) as { routes: string[]; data: GameData.Bundle };
const guide = compileGuide(bundle.routes, bundle.data);
const ctx = { isTown: (id: string) => bundle.data.Areas[id]?.is_town_area ?? false };

/** Feed a sequence of zone entries; return the final progress and every outcome kind. */
function play(areas: string[], start: GuideProgress = INITIAL_PROGRESS) {
  let progress = start;
  const kinds: string[] = [];
  for (const a of areas) {
    const r = trackArea(guide, progress, a, ctx);
    progress = r.progress;
    kinds.push(r.outcome.kind);
  }
  return { progress, kinds, at: guide.edges[progress.activeEdge] };
}

describe("trackArea", () => {
  it("follows the route zone by zone", () => {
    const r = play(guide.edges.slice(1, 15));
    expect(r.progress.activeEdge).toBe(14);
    expect(new Set(r.kinds)).toEqual(new Set(["advanced"]));
  });

  it("treats a trip back to town as a detour (the Coast -> town -> Coast bug)", () => {
    const coast = guide.edges.indexOf("1_1_2");
    const r = play(["1_1_town", "1_1_2"], { activeEdge: coast, completed: [] });
    expect(r.kinds).toEqual(["detour", "same"]);
    expect(r.progress.activeEdge).toBe(coast);
  });

  it("does not jump when walking back into a zone already passed", () => {
    const mud = guide.edges.indexOf("1_1_3");
    const r = play(["1_1_2", "1_1_3"], { activeEdge: mud, completed: [] });
    expect(r.kinds).toEqual(["detour", "same"]);
    expect(r.at).toBe("1_1_3");
  });

  it("jumps a short distance when the player skipped a zone", () => {
    const coast = guide.edges.indexOf("1_1_2");
    const skipTo = guide.edges[coast + 2];
    const r = play([skipTo], { activeEdge: coast, completed: [] });
    expect(r.kinds).toEqual(["jumped"]);
    expect(r.at).toBe(skipTo);
  });

  it("only suggests far jumps", () => {
    const act3Town = guide.edges.indexOf("1_3_town");
    const firstAct3 = guide.edges.findIndex((e, i) => i > 0 && e.startsWith("1_3_") && e !== "1_3_town");
    expect(firstAct3).toBeGreaterThan(10);
    const r = trackArea(guide, INITIAL_PROGRESS, guide.edges[firstAct3], ctx);
    expect(r.outcome.kind).toBe("ahead");
    expect(r.progress.activeEdge).toBe(0);
    expect(act3Town).toBeGreaterThan(0);
  });

  it("ignores hideouts and unknown zones", () => {
    expect(trackArea(guide, INITIAL_PROGRESS, "HideoutGraveyard", ctx).outcome.kind).toBe("detour");
    expect(trackArea(guide, INITIAL_PROGRESS, "MapWorldsBeach", ctx).outcome.kind).toBe("offRoute");
  });

  it("survives a realistic messy Act 1 session", () => {
    // Town visits between every zone, a death (re-enter), a portal back.
    const e = guide.edges;
    const messy: string[] = [];
    for (let i = 1; i <= 12; i++) {
      messy.push(e[i]);
      if (i % 3 === 0) messy.push("1_1_town", e[i]);
    }
    const r = play(messy);
    expect(r.progress.activeEdge).toBe(12);
  });
});
