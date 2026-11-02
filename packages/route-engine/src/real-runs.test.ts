import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compileGuide, INITIAL_PROGRESS, trackArea, type GameData, type GuideProgress } from "./index.js";

/**
 * Regression gate on real play: 13 anonymized campaign runs (zone ids only).
 * Measured 2026-11-02: 81% exact, 99.9% exact-or-waiting, 2 stalls.
 */
const bundle = JSON.parse(
  readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8"),
) as { routes: string[]; data: GameData.Bundle };
const { runs } = JSON.parse(readFileSync(new URL("../test-fixtures/real-runs.json", import.meta.url), "utf8")) as {
  runs: string[][];
};
const areas = bundle.data.Areas;
const ctx = { isTown: (id: string) => areas[id]?.is_town_area ?? false, actOf: (id: string) => areas[id]?.act };

describe.each([true, false])("real runs (leagueStart=%s)", (leagueStart) => {
  const guide = compileGuide(bundle.routes, bundle.data, { leagueStart, library: false, bandit: "None" });
  const onRoute = new Set(guide.edges);
  let checked = 0;
  let exact = 0;
  let okCount = 0;
  let stalls = 0;
  const finals: { last: string; at: string }[] = [];
  for (const run of runs) {
    let progress: GuideProgress = INITIAL_PROGRESS;
    for (const areaId of run) {
      const r = trackArea(guide, progress, areaId, ctx);
      progress = r.progress;
      if (r.outcome.kind === "ahead") stalls++;
      if (!ctx.isTown(areaId) && onRoute.has(areaId)) {
        checked++;
        const agreed = guide.edges[progress.activeEdge] === areaId;
        if (agreed) exact++;
        if (agreed || (r.outcome.kind === "detour" && r.outcome.reason === "visited")) okCount++;
      }
    }
    const lastOnRoute = [...run].reverse().find((a) => onRoute.has(a) && !ctx.isTown(a));
    finals.push({ last: lastOnRoute ?? "", at: guide.edges[progress.activeEdge] });
  }

  it("keeps the guide on the player's zone or the next task", () => {
    expect(okCount / checked).toBeGreaterThan(0.99);
    expect(exact / checked).toBeGreaterThan(0.78);
  });

  it("almost never stalls behind the player", () => {
    expect(stalls).toBeLessThanOrEqual(4);
  });

  it("ends each run in the same act as the player's last campaign zone (or later)", () => {
    for (const f of finals) {
      if (!f.last) continue;
      expect(areas[f.at].act).toBeGreaterThanOrEqual(areas[f.last].act);
    }
  });
});
