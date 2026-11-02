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
