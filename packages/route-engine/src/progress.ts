import type { RouteData } from "./types.js";
import type { CompiledGuide, GuideStep } from "./guide.js";

/** The parts of a compiled guide that progress tracking needs. */
export type GuideShape = Pick<CompiledGuide, "steps" | "edges">;

/**
 * Progress through a guide is a position on its edge list: `activeEdge` is
 * the index of the area the player is currently in, according to the route.
 * Steps are grouped by the edge they belong to: a step with edgeIndex N
 * starts group N, and every following step without an edge stays in it.
 */
export interface GuideProgress {
  activeEdge: number;
  /** Step ids the player ticked off by hand. */
  completed: string[];
  /**
   * Route positions the player has actually been at. Positions before
   * `activeEdge` that are missing were skipped (played out of order).
   * Absent in old saves: then everything up to activeEdge counts as visited.
   */
  visited?: number[];
  /** Consecutive zones seen far ahead in the same later act (stall recovery). */
  aheadStreak?: { act: number; count: number };
}

export function visitedSet(progress: GuideProgress): Set<number> {
  if (progress.visited) return new Set(progress.visited);
  return new Set(Array.from({ length: progress.activeEdge + 1 }, (_, i) => i));
}

/** Move to `edge` after playing it for real (keeps skipped edges skipped). */
function visit(progress: GuideProgress, edge: number): GuideProgress {
  const v = visitedSet(progress);
  v.add(edge);
  return { ...progress, activeEdge: edge, visited: [...v].sort((a, b) => a - b) };
}

export const INITIAL_PROGRESS: GuideProgress = { activeEdge: 0, completed: [] };

/** Outside the current act, jump forward automatically only this far; further away we ask. */
const AUTO_JUMP_WINDOW = 6;

/**
 * What the tracker decided for one zone change. The overlay shows this, so
 * the player always knows why the guide did (or didn't) move.
 */
export type TrackOutcome =
  /** Entered the next zone of the route. */
  | { kind: "advanced"; areaId: string; from: number; to: number }
  /** Re-entered the zone the route says you are in (portal, death, relog). */
  | { kind: "same"; areaId: string }
  /** A town, hideout, or a zone already done: the guide waits. */
  | { kind: "detour"; areaId: string; reason: "town" | "visited" }
  /** A zone further on that you have not done yet: you are playing out of order. */
  | { kind: "jumped"; areaId: string; from: number; to: number; skipped: number }
  /** Back to a zone you skipped earlier: the guide goes back to it. */
  | { kind: "backtracked"; areaId: string; from: number; to: number }
  /** A zone far ahead in a later act: not moved, the player can confirm with re-sync. */
  | { kind: "ahead"; areaId: string; edge: number }
  /** A zone the route never visits (maps, lab, side content). */
  | { kind: "offRoute"; areaId: string };

export interface TrackContext {
  isTown: (areaId: string) => boolean;
  /** Act number of an area; enables free reordering of zones within an act. */
  actOf?: (areaId: string) => number | undefined;
}

/**
 * Decide how a zone change moves the player along the route.
 *
 * The route is an ordered plan, but players reorder zones inside an act and
 * revisit zones (towns, waypoints, backtracking). Rules, in order:
 *  1. Same zone as the current position: stay.
 *  2. The next zone of the route: advance.
 *  3. A town or hideout: detour, wait.
 *  4. A zone the player already did (an earlier, visited position): detour.
 *  5. A zone the player skipped earlier: go back to it.
 *  6. A zone further on, not done yet: jump there if it is in the same act
 *     or close; otherwise only suggest it.
 *  7. Anything else is off-route: stay.
 */
export function trackArea(
  guide: GuideShape,
  progress: GuideProgress,
  areaId: string,
  ctx: TrackContext,
): { progress: GuideProgress; outcome: TrackOutcome } {
  const { edges } = guide;
  const p = Math.min(progress.activeEdge, edges.length - 1);
  const stay = (outcome: TrackOutcome) => ({ progress, outcome });
  const visited = visitedSet(progress);
  // Any decision other than "ahead" or a town visit breaks a streak of far-ahead zones.
  const clearStreak = (r: { progress: GuideProgress; outcome: TrackOutcome }) =>
    r.progress.aheadStreak && r.outcome.kind !== "ahead" && !(r.outcome.kind === "detour" && r.outcome.reason === "town")
      ? { ...r, progress: { ...r.progress, aheadStreak: undefined } }
      : r;
  return clearStreak(decide());

  function decide(): { progress: GuideProgress; outcome: TrackOutcome } {
  if (edges[p] === areaId) return stay({ kind: "same", areaId });
  if (edges[p + 1] === areaId) {
    return { progress: visit(progress, p + 1), outcome: { kind: "advanced", areaId, from: p, to: p + 1 } };
  }
  if (ctx.isTown(areaId) || isHideoutLikeArea(areaId)) return stay({ kind: "detour", areaId, reason: "town" });

  const before: number[] = [];
  for (let i = 0; i < p; i++) if (edges[i] === areaId) before.push(i);
  if (before.some((i) => visited.has(i))) return stay({ kind: "detour", areaId, reason: "visited" });
  // Going back for a skipped zone only within the current act; an older act's
  // zone is a side trip (e.g. a quest you skipped long ago), not a reset.
  const curAct = ctx.actOf?.(edges[p]);
  const skipped = before.filter((i) => !visited.has(i) && (curAct === undefined || ctx.actOf?.(edges[i]) === curAct));
  if (before.length && !skipped.length) return stay({ kind: "detour", areaId, reason: "visited" });
  if (skipped.length) {
    const to = skipped[skipped.length - 1];
    return { progress: visit(progress, to), outcome: { kind: "backtracked", areaId, from: p, to } };
  }

  // Further on: the first visit not done yet; otherwise a later position the
  // player already reached (they went back for a skipped zone and now resume).
  let ahead = -1;
  let resume = -1;
  for (let i = p + 2; i < edges.length; i++) {
    if (edges[i] !== areaId) continue;
    if (!visited.has(i)) {
      ahead = i;
      break;
    }
    if (resume === -1) resume = i;
  }
  if (ahead === -1 && resume !== -1) {
    return { progress: visit(progress, resume), outcome: { kind: "jumped", areaId, from: p, to: resume, skipped: 0 } };
  }
  if (ahead === -1) return stay({ kind: "offRoute", areaId });

  const jump = (): { progress: GuideProgress; outcome: TrackOutcome } => {
    let skippedCount = 0;
    for (let i = p + 1; i < ahead; i++) if (!visited.has(i)) skippedCount++;
    return {
      progress: { ...visit(progress, ahead), aheadStreak: undefined },
      outcome: { kind: "jumped", areaId, from: p, to: ahead, skipped: skippedCount },
    };
  };
  const act = ctx.actOf?.(areaId);
  const sameAct = act !== undefined && act === ctx.actOf?.(edges[p]);
  if (sameAct || ahead - p <= AUTO_JUMP_WINDOW) return jump();

  // Far ahead in another act: one zone could be a different character or a
  // mistake, but two in a row in the same act means the player is there.
  const streak = progress.aheadStreak;
  const count = act !== undefined && streak?.act === act ? streak.count + 1 : 1;
  if (count >= 2) return jump();
  return {
    progress: { ...progress, aheadStreak: act !== undefined ? { act, count } : undefined },
    outcome: { kind: "ahead", areaId, edge: ahead },
  };
  }
}

/** Hideouts, the Menagerie, Kingsmarch and similar personal areas. */
export function isHideoutLikeArea(areaId: string): boolean {
  return /hideout/i.test(areaId) || /^Menagerie/.test(areaId) || /Settlers/i.test(areaId);
}

/** Backwards-compatible wrapper: towns are recognised by the common "_town" id suffix. */
export function onAreaEntered(guide: GuideShape, progress: GuideProgress, areaId: string): GuideProgress {
  return trackArea(guide, progress, areaId, { isTown: (id) => /_town$/.test(id) }).progress;
}

/** Jump to the nearest edge for `areaId`: forward first, then backward. */
export function resyncTo(
  guide: GuideShape,
  progress: GuideProgress,
  areaId: string,
): GuideProgress {
  const { edges } = guide;
  const current = progress.activeEdge;
  if (edges[current] === areaId) return progress;
  for (let i = current + 1; i < edges.length; i++)
    if (edges[i] === areaId) return { ...progress, activeEdge: i };
  for (let i = current - 1; i >= 0; i--)
    if (edges[i] === areaId) return { ...progress, activeEdge: i };
  return progress;
}

export function stepEdge(
  guide: GuideShape,
  progress: GuideProgress,
  delta: 1 | -1,
): GuideProgress {
  const next = Math.max(
    0,
    Math.min(guide.edges.length - 1, progress.activeEdge + delta),
  );
  return { ...progress, activeEdge: next, visited: Array.from({ length: next + 1 }, (_, i) => i) };
}

export function toggleCompleted(
  progress: GuideProgress,
  stepId: string,
): GuideProgress {
  const done = new Set(progress.completed);
  if (done.has(stepId)) done.delete(stepId);
  else done.add(stepId);
  return { ...progress, completed: [...done] };
}

/** The edge group each step belongs to (same length as guide.steps). */
export function stepGroups(guide: GuideShape): number[] {
  const groups: number[] = [];
  let group = 0;
  for (const step of guide.steps) {
    if (step.edgeIndex !== null) group = step.edgeIndex;
    groups.push(group);
  }
  return groups;
}

export interface GuideView {
  /** Steps to do in the current area (the active edge group). */
  current: GuideStep[];
  /** The step that takes the player to the next area, if any. */
  next: GuideStep | null;
  /** Upcoming steps after `next`, up to the requested count. */
  upcoming: GuideStep[];
  sectionName: string;
  /** 0..1 through the whole route. */
  fraction: number;
}

export function viewAt(
  guide: GuideShape,
  progress: GuideProgress,
  upcomingCount = 3,
): GuideView {
  const groups = stepGroups(guide);
  const active = progress.activeEdge;
  const current: GuideStep[] = [];
  let nextIndex = -1;
  for (let i = 0; i < guide.steps.length; i++) {
    if (groups[i] === active) current.push(guide.steps[i]);
    else if (groups[i] > active) {
      nextIndex = i;
      break;
    }
  }
  const next = nextIndex >= 0 ? guide.steps[nextIndex] : null;
  const upcoming =
    nextIndex >= 0
      ? guide.steps.slice(nextIndex + 1, nextIndex + 1 + upcomingCount)
      : [];
  const sectionName =
    current[0]?.sectionName ?? next?.sectionName ?? guide.steps.at(-1)?.sectionName ?? "";
  const fraction =
    guide.edges.length > 1 ? active / (guide.edges.length - 1) : 1;
  return { current, next, upcoming, sectionName, fraction };
}

/**
 * All route positions for `areaId`, nearest to `from` first. On a tie the
 * earlier visit wins: after a tracking mistake the player is usually behind
 * where the guide thinks they are.
 */
export function visitsOf(guide: GuideShape, areaId: string, from: number): number[] {
  const out: number[] = [];
  guide.edges.forEach((e, i) => {
    if (e === areaId) out.push(i);
  });
  return out.sort((a, b) => Math.abs(a - from) - Math.abs(b - from) || a - b);
}

/**
 * Manual move ("I am here"): the player vouches for their position, so
 * everything before it counts as done and nothing after it does.
 */
export function setEdge(guide: GuideShape, progress: GuideProgress, edge: number): GuideProgress {
  const to = Math.max(0, Math.min(guide.edges.length - 1, edge));
  return { ...progress, activeEdge: to, visited: Array.from({ length: to + 1 }, (_, i) => i) };
}

const MOVEMENT_TYPES = new Set(["enter", "waypoint_use", "logout", "portal_use", "area"]);

/** A step whose only job is to move to another zone ("➞ The Coast", "Waypoint to X"). */
export function isMovementStep(step: GuideStep["step"]): boolean {
  if (step.type !== "fragment_step") return false;
  let moves = false;
  for (const part of step.parts) {
    if (typeof part === "string") {
      if (part.replace(/[\s➞→>-]/g, "") !== "") return false;
    } else if (MOVEMENT_TYPES.has(part.type)) moves = true;
    else return false;
  }
  return moves;
}

export interface ZoneCard {
  /** Route position and the zone the route says you are in. */
  edge: number;
  areaId: string;
  sectionName: string;
  /** Hints attached to how you arrived (e.g. "Go right of the bridge"). */
  arrivalHints: RouteData.FragmentStep[];
  /** What to do in this zone, in order. */
  todo: GuideStep[];
  /** The step that leaves for the next zone. */
  leave: GuideStep | null;
  nextAreaId: string | null;
  /** The first things to do in the next zone with tasks. */
  nextTodo: GuideStep[];
  /**
   * Zones to pass through, in order, up to and including the zone where
   * `nextTodo` happens (skips pass-through zones with nothing to do).
   */
  path: string[];
  /** How the player leaves this zone: on foot, by waypoint, portal or logout. */
  travel: "walk" | "waypoint" | "portal" | "logout";
  fraction: number;
}

function groupSteps(guide: GuideShape, edge: number): GuideStep[] {
  const groups = stepGroups(guide);
  return guide.steps.filter((_, i) => groups[i] === edge);
}

export function zoneCard(guide: GuideShape, progress: GuideProgress, previewCount = 2): ZoneCard {
  const edge = Math.min(progress.activeEdge, guide.edges.length - 1);
  const here = groupSteps(guide, edge);
  const arrival = here[0] && here[0].edgeIndex === edge ? here[0] : null;
  const arrivalIsMove = arrival ? isMovementStep(arrival.step) : false;
  const todo = arrivalIsMove ? here.slice(1) : here;
  const arrivalHints =
    arrivalIsMove && arrival && arrival.step.type === "fragment_step" ? arrival.step.subSteps : [];

  const nextGroup = edge + 1 < guide.edges.length ? groupSteps(guide, edge + 1) : [];
  const leave = nextGroup[0] ?? null;
  // Look ahead through pass-through zones (nothing to do there) to the next real task.
  const path: string[] = [];
  let nextTodo: GuideStep[] = [];
  for (let e = edge + 1; e < guide.edges.length && path.length < 4; e++) {
    path.push(guide.edges[e]);
    const g = groupSteps(guide, e);
    const tasks = g[0] && isMovementStep(g[0].step) ? g.slice(1) : g.slice(1);
    if (tasks.length) {
      nextTodo = tasks.slice(0, previewCount);
      break;
    }
  }
  let travel: ZoneCard["travel"] = "walk";
  if (leave && leave.step.type === "fragment_step") {
    for (const part of leave.step.parts) {
      if (typeof part === "string") continue;
      if (part.type === "waypoint_use") travel = "waypoint";
      else if (part.type === "portal_use") travel = "portal";
      else if (part.type === "logout") travel = "logout";
    }
  }
  return {
    edge,
    areaId: guide.edges[edge],
    sectionName: (here[0] ?? leave)?.sectionName ?? "",
    arrivalHints,
    todo,
    leave,
    nextAreaId: guide.edges[edge + 1] ?? null,
    nextTodo,
    path,
    travel,
    fraction: guide.edges.length > 1 ? edge / (guide.edges.length - 1) : 1,
  };
}

export interface CharacterCandidate {
  name: string;
  progress: GuideProgress;
  /** ISO time, used to break ties (most recently played wins). */
  lastSeen: string;
}

/**
 * After a login, the log doesn't say which character was picked. Guess it
 * from the first zone: whose saved route position explains this zone?
 * Returns the character name, "new" for a fresh character in The Twilight
 * Strand, or null when nobody fits (unknown character: pause tracking).
 */
export function matchCharacter(
  guide: GuideShape,
  candidates: CharacterCandidate[],
  areaId: string,
  ctx: TrackContext,
): string | "new" | null {
  const act = ctx.actOf?.(areaId);
  let best: { name: string; score: number; lastSeen: string } | null = null;
  for (const c of candidates) {
    const p = Math.min(c.progress.activeEdge, guide.edges.length - 1);
    let score = 0;
    if (guide.edges[p] === areaId) score = 4;
    else if (guide.edges[p + 1] === areaId) score = 3;
    else if (act !== undefined && act === ctx.actOf?.(guide.edges[p])) score = 2;
    else if (act !== undefined && act === (ctx.actOf?.(guide.edges[p]) ?? -9) + 1) score = 1;
    if (score === 0) continue;
    if (!best || score > best.score || (score === best.score && c.lastSeen > best.lastSeen)) {
      best = { name: c.name, score, lastSeen: c.lastSeen };
    }
  }
  if (areaId === guide.edges[0] && (!best || best.score < 4)) return "new";
  return best?.name ?? null;
}
