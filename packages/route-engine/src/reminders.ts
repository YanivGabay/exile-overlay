import type { GuideShape, GuideProgress } from "./progress.js";
import { stepGroups, visitedSet } from "./progress.js";

/**
 * Data-driven reminders ("you can make 15% movement speed boots now").
 * They live in the guide bundle (campaign.json → reminders) so new ones ship
 * without an app update.
 */
export interface Reminder {
  id: string;
  /** Reminders in the same group replace each other; the latest active one wins. */
  group?: string;
  kind: "gear" | "vendor" | "lab" | "danger" | "level" | "info";
  text: string;
  /** Vendor search text to copy (Ctrl+F in shops). */
  search?: string;
  when: {
    minLevel?: number;
    maxLevel?: number;
    minAct?: number;
    maxAct?: number;
    /** A quest hand-in on the route has been passed. */
    questDone?: string;
    /** The route has visited this area. */
    reachedArea?: string;
    /** This area is the current zone or on the way to the next task. */
    upcomingArea?: string;
    /** Only while the player's level is below this (e.g. "be level 32 before …"). */
    belowLevel?: number;
  };
}

export interface ReminderContext {
  level: number | null;
  actOf: (areaId: string) => number | undefined;
  /** Areas on the way: current zone first, then the look-ahead path. */
  upcoming: string[];
  dismissed: Set<string>;
}

/** Route positions where each quest is handed in (first occurrence). */
function questEdges(guide: GuideShape): Map<string, number> {
  const groups = stepGroups(guide);
  const out = new Map<string, number>();
  guide.steps.forEach((s, i) => {
    if (s.step.type !== "fragment_step") return;
    for (const p of s.step.parts)
      if (typeof p !== "string" && p.type === "quest" && !out.has(p.questId)) out.set(p.questId, groups[i]);
  });
  return out;
}

export function activeReminders(
  guide: GuideShape,
  progress: GuideProgress,
  reminders: Reminder[],
  ctx: ReminderContext,
): Reminder[] {
  const active = progress.activeEdge;
  const visited = visitedSet(progress);
  const act = ctx.actOf(guide.edges[active]) ?? 1;
  const quests = questEdges(guide);
  const reached = (area: string) => guide.edges.some((e, i) => e === area && (i <= active || visited.has(i)));

  const ok = (r: Reminder) => {
    const w = r.when;
    if (ctx.dismissed.has(r.id)) return false;
    if (w.minLevel !== undefined && (ctx.level ?? 0) < w.minLevel) return false;
    if (w.maxLevel !== undefined && ctx.level !== null && ctx.level > w.maxLevel) return false;
    if (w.belowLevel !== undefined && ctx.level !== null && ctx.level >= w.belowLevel) return false;
    if (w.minAct !== undefined && act < w.minAct) return false;
    if (w.maxAct !== undefined && act > w.maxAct) return false;
    if (w.questDone !== undefined) {
      const e = quests.get(w.questDone);
      if (e === undefined || e >= active) return false;
    }
    if (w.reachedArea !== undefined && !reached(w.reachedArea)) return false;
    if (w.upcomingArea !== undefined && !ctx.upcoming.includes(w.upcomingArea)) return false;
    return true;
  };

  // Latest active reminder per group (data order = progression order).
  const byGroup = new Map<string, Reminder>();
  const loose: Reminder[] = [];
  for (const r of reminders) {
    if (!ok(r)) continue;
    if (r.group) byGroup.set(r.group, r);
    else loose.push(r);
  }
  const order = new Map(reminders.map((r, i) => [r.id, i]));
  return [...byGroup.values(), ...loose].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export interface TrialStatus {
  lab: "normal" | "cruel" | "merciless";
  done: number;
  total: number;
  /** True when the route is at or past this lab's ascend step. */
  labReached: boolean;
}

const LAB_OF_ACT = (act: number): TrialStatus["lab"] | null =>
  act <= 3 ? "normal" : act <= 5 ? null : act <= 7 ? "cruel" : "merciless";

/** Trials of Ascendancy per labyrinth, from the route's {trial} and {ascend} steps. */
export function trialStatus(
  guide: GuideShape,
  progress: GuideProgress,
  actOf: (areaId: string) => number | undefined,
): TrialStatus[] {
  const groups = stepGroups(guide);
  const visited = visitedSet(progress);
  const done = new Set(progress.completed);
  const labs = new Map<TrialStatus["lab"], TrialStatus>();
  guide.steps.forEach((s, i) => {
    if (s.step.type !== "fragment_step") return;
    const g = groups[i];
    const passed = done.has(s.id) || (g < progress.activeEdge && visited.has(g));
    for (const p of s.step.parts) {
      if (typeof p === "string") continue;
      if (p.type === "trial") {
        const lab = LAB_OF_ACT(actOf(guide.edges[g]) ?? 0);
        if (!lab) continue;
        const t = labs.get(lab) ?? { lab, done: 0, total: 0, labReached: false };
        t.total++;
        if (passed) t.done++;
        labs.set(lab, t);
      } else if (p.type === "ascend" && p.version !== "eternal") {
        const t = labs.get(p.version) ?? { lab: p.version, done: 0, total: 0, labReached: false };
        t.labReached = g <= progress.activeEdge;
        labs.set(p.version, t);
      }
    }
  });
  return ["normal", "cruel", "merciless"].flatMap((l) => labs.get(l as TrialStatus["lab"]) ?? []);
}
