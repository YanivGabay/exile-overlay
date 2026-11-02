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
}

export const INITIAL_PROGRESS: GuideProgress = { activeEdge: 0, completed: [] };

/** Jump forward automatically only this far; further away we ask the player. */
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
  /** A town, hideout, or a zone the route already passed: the guide waits. */
  | { kind: "detour"; areaId: string; reason: "town" | "visited" }
  /** A zone a few steps ahead that you have not been to: you skipped something. */
  | { kind: "jumped"; areaId: string; from: number; to: number }
  /** A zone far ahead on the route: not moved, the player can confirm with re-sync. */
  | { kind: "ahead"; areaId: string; edge: number }
  /** A zone the route never visits (maps, lab, side content). */
  | { kind: "offRoute"; areaId: string };

export interface TrackContext {
  isTown: (areaId: string) => boolean;
}

/**
 * Decide how a zone change moves the player along the route.
 *
 * The route visits some zones several times (towns, the Coast via waypoint,
 * ...). A naive "find this zone ahead" jumps to the wrong visit when you
 * just pop back to town. Rules, in order:
 *  1. Same zone as the current route position: stay.
 *  2. The next zone of the route: advance by one.
 *  3. A town/hideout, or a zone the route has already been through: a
 *     detour; stay and wait for the player to come back.
 *  4. A zone ahead that the route has not visited yet: if it is close, the
 *     player skipped steps, so jump; if it is far, only suggest it.
 *  5. Anything else is off-route: stay.
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

  if (edges[p] === areaId) return stay({ kind: "same", areaId });
  if (edges[p + 1] === areaId) {
    return { progress: { ...progress, activeEdge: p + 1 }, outcome: { kind: "advanced", areaId, from: p, to: p + 1 } };
  }
  if (ctx.isTown(areaId) || isHideoutLikeArea(areaId)) return stay({ kind: "detour", areaId, reason: "town" });
  if (edges.slice(0, p).includes(areaId)) return stay({ kind: "detour", areaId, reason: "visited" });

  const ahead = edges.indexOf(areaId, p + 2);
  if (ahead === -1) return stay({ kind: "offRoute", areaId });
  if (ahead - p <= AUTO_JUMP_WINDOW) {
    return { progress: { ...progress, activeEdge: ahead }, outcome: { kind: "jumped", areaId, from: p, to: ahead } };
  }
  return stay({ kind: "ahead", areaId, edge: ahead });
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
  return { ...progress, activeEdge: next };
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

export function setEdge(guide: GuideShape, progress: GuideProgress, edge: number): GuideProgress {
  return { ...progress, activeEdge: Math.max(0, Math.min(guide.edges.length - 1, edge)) };
}
