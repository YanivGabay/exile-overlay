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
