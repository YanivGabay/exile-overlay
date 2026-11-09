/**
 * Campaign timer driven by Client.txt timestamps (exact, no polling drift).
 * Counts time in zones; stops on the login screen / character select; a gap
 * longer than MAX_GAP between two log events counts as a break.
 */
export const MAX_GAP_MS = 10 * 60 * 1000;

export interface RunTimer {
  /** Log time (ms) of the first counted event. */
  startedAt: number;
  /** Counted play time so far. */
  elapsedMs: number;
  /** Log time of the last counted event; null while out of game. */
  lastAt: number | null;
  /** Elapsed time when each act was first reached (act number → ms). */
  actSplits: Record<number, number>;
  /** True if this run started in The Twilight Strand (counts toward bests). */
  fullRun: boolean;
  /** Character level when the timer started (for levels/hour). */
  startLevel: number;
  finishedAt: number | null;
  deaths: number;
  deathsByAct: Record<number, number>;
}

export interface FinishedRun {
  character: string;
  date: string;
  totalMs: number;
  actSplits: Record<number, number>;
}

/** "2026/11/02 20:01:02" (local time, as the game writes it) → epoch ms. */
export function logTimeToMs(time: string): number {
  const m = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(time);
  if (!m) return Date.now();
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
}

export function newTimer(at: number, fullRun: boolean, level: number): RunTimer {
  return { startedAt: at, elapsedMs: 0, lastAt: at, actSplits: {}, fullRun, startLevel: level, finishedAt: null, deaths: 0, deathsByAct: {} };
}

/** Count time up to `at` (an in-game event), then keep running. */
export function tick(t: RunTimer, at: number): RunTimer {
  if (t.finishedAt !== null) return t;
  const gap = t.lastAt === null ? 0 : at - t.lastAt;
  const add = gap > 0 && gap <= MAX_GAP_MS ? gap : 0;
  return { ...t, elapsedMs: t.elapsedMs + add, lastAt: at };
}

/** Out of game: count up to `at`, then stop until the next zone. */
export function pause(t: RunTimer, at: number): RunTimer {
  return { ...tick(t, at), lastAt: null };
}

export function markAct(t: RunTimer, act: number): RunTimer {
  if (t.actSplits[act] !== undefined || t.finishedAt !== null) return t;
  return { ...t, actSplits: { ...t.actSplits, [act]: t.elapsedMs } };
}

export function addDeath(t: RunTimer, act: number): RunTimer {
  return { ...t, deaths: t.deaths + 1, deathsByAct: { ...t.deathsByAct, [act]: (t.deathsByAct[act] ?? 0) + 1 } };
}

export function finish(t: RunTimer, at: number): RunTimer {
  if (t.finishedAt !== null) return t;
  const done = tick(t, at);
  return { ...done, finishedAt: at, lastAt: null, actSplits: { ...done.actSplits, 11: done.elapsedMs } };
}

/** Live elapsed time for display: counted time plus the running stretch. */
export function liveElapsed(t: RunTimer, now: number): number {
  if (t.finishedAt !== null || t.lastAt === null) return t.elapsedMs;
  const gap = now - t.lastAt;
  return t.elapsedMs + (gap > 0 && gap <= MAX_GAP_MS ? gap : 0);
}

export interface SplitCompare {
  best: number | null;
  previous: number | null;
  average: number | null;
}

/** Time to reach `act` in past full runs. */
export function compareSplit(runs: FinishedRun[], act: number): SplitCompare {
  const values = runs.map((r) => r.actSplits[act]).filter((v): v is number => typeof v === "number");
  if (!values.length) return { best: null, previous: null, average: null };
  return {
    best: Math.min(...values),
    previous: values[values.length - 1],
    average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  };
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return h ? `${h}:${mm}:${String(sec).padStart(2, "0")}` : `${mm}:${String(sec).padStart(2, "0")}`;
}

export interface RunSummaryInput {
  character: string;
  className: string | null;
  level: number | null;
  timer: RunTimer;
  /** All stored full runs (this one included, if it was a full run). */
  runs: FinishedRun[];
  gameVersion: string | null;
}

/** Time spent in each act (1-10) from the act splits; null where a split is missing. */
export function actDurations(splits: Record<number, number>): (number | null)[] {
  return Array.from({ length: 10 }, (_, i) => {
    const a = splits[i + 1];
    const b = splits[i + 2];
    return typeof a === "number" && typeof b === "number" ? b - a : null;
  });
}

/**
 * Plain-text campaign summary to paste into Discord or Reddit: total time
 * against the personal best, time per act with the difference to the best
 * run's act, deaths and leveling speed.
 */
export function runSummary(r: RunSummaryInput): string {
  const t = r.timer;
  const total = t.elapsedMs;
  const others = r.runs.filter((x) => !(x.character === r.character && x.totalMs === total));
  const best = others.length ? others.reduce((a, b) => (b.totalMs < a.totalMs ? b : a)) : null;
  const sign = (ms: number) => `${ms <= 0 ? "-" : "+"}${formatDuration(Math.abs(ms))}`;
  const who = [r.className, r.level !== null ? `level ${r.level}` : null].filter(Boolean).join(", ");
  const lines = [`${r.character}${who ? ` (${who})` : ""}: Path of Exile${r.gameVersion ? ` ${r.gameVersion}` : ""} campaign`];
  if (!t.fullRun) lines.push(`Campaign time ${formatDuration(total)} (started mid-campaign)`);
  else if (!best) lines.push(`Campaign time ${formatDuration(total)}: first timed run`);
  else if (total < best.totalMs) lines.push(`Campaign time ${formatDuration(total)}: new personal best by ${formatDuration(best.totalMs - total)}`);
  else lines.push(`Campaign time ${formatDuration(total)} (${sign(total - best.totalMs)} vs best ${formatDuration(best.totalMs)})`);
  const mine = actDurations(t.actSplits);
  const theirs = best ? actDurations(best.actSplits) : [];
  const acts = mine
    .map((d, i) => {
      if (d === null) return null;
      const b = theirs[i];
      return `A${i + 1} ${formatDuration(d)}${b != null ? ` (${sign(d - b)})` : ""}`;
    })
    .filter(Boolean);
  if (acts.length) lines.push(acts.join(" | "));
  const hours = total / 3_600_000;
  const extra = [`${t.deaths} ${t.deaths === 1 ? "death" : "deaths"}`];
  if (r.level !== null && hours > 0.25) extra.push(`${((r.level - t.startLevel) / hours).toFixed(1)} levels/hour`);
  lines.push(extra.join(", "));
  lines.push("Tracked with Exile Overlay");
  return lines.join("\n");
}

export interface Pace {
  /** The act being compared (the latest act this character has reached). */
  act: number;
  /** Negative = ahead of the personal best, positive = behind (ms). */
  deltaMs: number;
  /**
   * "split": difference when this act was reached.
   * "live": past the best run's finish of this act, so behind by at least this much and growing.
   */
  kind: "split" | "live";
}

/**
 * Live pace against the personal best (fastest stored full run of another
 * character). Uses only this character's timer splits, which record the first
 * time each act was reached, so guide undo/jumps and character switches do not
 * change it. Null when there is nothing fair to compare.
 */
export function paceAgainstBest(t: RunTimer | undefined, runs: FinishedRun[], character: string, now: number): Pace | null {
  if (!t || !t.fullRun || t.finishedAt !== null) return null;
  const others = runs.filter((r) => r.character !== character);
  if (!others.length) return null;
  const best = others.reduce((a, b) => (b.totalMs < a.totalMs ? b : a));
  const reached = Object.keys(t.actSplits).map(Number).filter((a) => a >= 1 && a <= 10);
  if (!reached.length) return null;
  const act = Math.max(...reached);
  const elapsed = liveElapsed(t, now);
  const bestEnd = best.actSplits[act + 1];
  if (typeof bestEnd === "number" && elapsed > bestEnd) return { act, deltaMs: elapsed - bestEnd, kind: "live" };
  const mine = t.actSplits[act];
  const theirs = best.actSplits[act];
  if (act < 2 || typeof theirs !== "number") return null;
  return { act, deltaMs: mine - theirs, kind: "split" };
}

/** "1:12 ahead in Act 3" / "0:40 behind in Act 3" / "even in Act 3". */
export function paceText(p: Pace): string {
  const s = Math.round(Math.abs(p.deltaMs) / 1000);
  if (s === 0) return `even with your best in Act ${p.act}`;
  return `${formatDuration(s * 1000)} ${p.deltaMs < 0 ? "ahead" : "behind"} in Act ${p.act}`;
}
