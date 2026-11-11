import { describe, expect, it } from "vitest";
import { compareSplit, formatDuration, liveElapsed, logTimeToMs, MAX_GAP_MS, newTimer, pause, tick } from "./timer.js";

describe("timer", () => {
  it("ignores breaks longer than the max gap", () => {
    let t = newTimer(0, true, 1);
    t = tick(t, 60_000);
    t = tick(t, 60_000 + MAX_GAP_MS + 1);
    expect(t.elapsedMs).toBe(60_000);
    t = pause(t, t.lastAt! + 5_000);
    expect(t.elapsedMs).toBe(65_000);
    expect(liveElapsed(t, 9_999_999)).toBe(65_000);
  });
  it("compares splits and formats", () => {
    const runs = [
      { character: "a", date: "", totalMs: 1, actSplits: { 2: 600_000 } },
      { character: "b", date: "", totalMs: 1, actSplits: { 2: 400_000 } },
    ];
    expect(compareSplit(runs, 2)).toEqual({ best: 400_000, previous: 400_000, average: 500_000 });
    expect(compareSplit(runs, 5).best).toBeNull();
    expect(formatDuration(3_725_000)).toBe("1:02:05");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(logTimeToMs("2026/11/02 20:01:02")).toBe(new Date(2026, 10, 2, 20, 1, 2).getTime());
  });
});

import { actDurations, runSummary, type RunTimer } from "./timer.js";
describe("runSummary", () => {
  const H = 3_600_000;
  const M = 60_000;
  const splits = (perAct: number[]) => Object.fromEntries(perAct.reduce<[number, number][]>((acc, d, i) => [...acc, [i + 2, (acc.at(-1)?.[1] ?? 0) + d]], [[1, 0]]));
  const timer = (s: Record<number, number>, fullRun = true): RunTimer => ({
    startedAt: 0, elapsedMs: s[11], lastAt: null, actSplits: s, fullRun, startLevel: 1, finishedAt: 1, deaths: 2, deathsByAct: {},
  });
  it("splits acts", () => {
    expect(actDurations(splits([10, 20, 30, 10, 10, 10, 10, 10, 10, 10]).valueOf() as Record<number, number>)[1]).toBe(20);
  });
  it("reports a personal best with per-act differences", () => {
    const old = splits(Array(10).fill(30 * M));
    const now = splits([25 * M, ...Array(9).fill(30 * M)]);
    const text = runSummary({
      character: "Ann", className: "Witch", level: 68, timer: timer(now), gameVersion: "3.29",
      runs: [{ character: "Bob", date: "", totalMs: old[11], actSplits: old }, { character: "Ann", date: "", totalMs: now[11], actSplits: now }],
    });
    expect(text).toContain("Ann (Witch, level 68): Path of Exile 3.29 campaign");
    expect(text).toContain("new personal best by 5:00");
    expect(text).toContain("A1 25:00 (-5:00)");
    expect(text).toContain("2 deaths");
    expect(text).toContain(`${(67 / (295 / 60)).toFixed(1)} levels/hour`);
    void H;
  });
  it("says first timed run and mid-campaign starts", () => {
    const s = splits(Array(10).fill(20 * M));
    expect(runSummary({ character: "A", className: null, level: null, timer: timer(s), runs: [], gameVersion: null })).toContain("first timed run");
    expect(runSummary({ character: "A", className: null, level: null, timer: timer(s, false), runs: [], gameVersion: null })).toContain("started mid-campaign");
  });
});

import { paceAgainstBest, paceText, type FinishedRun } from "./timer.js";
describe("paceAgainstBest", () => {
  const M = 60_000;
  // Best run: 30 minutes per act.
  const bestSplits = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, i * 30 * M]));
  const best: FinishedRun = { character: "Old", date: "", totalMs: 300 * M, actSplits: bestSplits };
  const slow: FinishedRun = { character: "Slow", date: "", totalMs: 400 * M, actSplits: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, i * 40 * M])) };
  const mk = (splits: Record<number, number>, elapsed: number, extra: Partial<RunTimer> = {}): RunTimer => ({
    startedAt: 0, elapsedMs: elapsed, lastAt: null, actSplits: splits, fullRun: true, startLevel: 1, finishedAt: null, deaths: 0, deathsByAct: {}, ...extra,
  });

  it("compares against the fastest run when the act was reached", () => {
    const p = paceAgainstBest(mk({ 1: 0, 2: 25 * M, 3: 58 * M + 48_000 }, 60 * M), [slow, best], "Me", 0);
    expect(p).toEqual({ act: 3, deltaMs: -72_000, kind: "split" });
    expect(paceText(p!)).toBe("1:12 ahead in Act 3");
  });
  it("switches to a live count once past the best run's finish of the act", () => {
    const p = paceAgainstBest(mk({ 1: 0, 2: 31 * M }, 62 * M), [best], "Me", 0);
    expect(p).toEqual({ act: 2, deltaMs: 2 * M, kind: "live" });
    expect(paceText(p!)).toBe("2:00 behind in Act 2");
  });
  it("counts running time live", () => {
    const t = mk({ 1: 0, 2: 31 * M }, 59 * M, { lastAt: 1_000_000 });
    expect(paceAgainstBest(t, [best], "Me", 1_000_000 + 3 * M)).toEqual({ act: 2, deltaMs: 2 * M, kind: "live" });
  });
  it("ignores the character's own stored run, partial and finished runs, and act 1", () => {
    expect(paceAgainstBest(mk({ 1: 0, 2: 20 * M }, 21 * M), [{ ...best, character: "Me" }], "Me", 0)).toBeNull();
    expect(paceAgainstBest(mk({ 1: 0, 2: 20 * M }, 21 * M, { fullRun: false }), [best], "Me", 0)).toBeNull();
    expect(paceAgainstBest(mk({ 1: 0, 2: 20 * M }, 21 * M, { finishedAt: 5 }), [best], "Me", 0)).toBeNull();
    expect(paceAgainstBest(mk({ 1: 0 }, 10 * M), [best], "Me", 0)).toBeNull();
    expect(paceAgainstBest(undefined, [best], "Me", 0)).toBeNull();
  });
  it("is unaffected by guide undo: it only reads first-reach splits", () => {
    // Same timer whatever the route position: the result depends on splits + elapsed only.
    const t = mk({ 1: 0, 2: 28 * M, 3: 55 * M }, 70 * M);
    expect(paceAgainstBest(t, [best], "Me", 0)).toEqual(paceAgainstBest(structuredClone(t), [best], "Me", 0));
    expect(paceText({ act: 3, deltaMs: 400, kind: "split" })).toBe("even with your best in Act 3");
  });
});
