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

/** How far ahead to look when re-syncing to a zone the player entered. */
const RESYNC_LOOKAHEAD = 12;

/**
 * Called on every "area entered" event from Client.txt.
 * - Entering the next area of the route advances by one.
 * - Entering an area a few edges ahead (the player skipped a step, or the
 *   tracker missed a zone) jumps forward to it.
 * - Anything else (towns, hideouts, backtracking, side areas) keeps the
 *   position, so a detour never throws the player off the route.
 */
export function onAreaEntered(
  guide: GuideShape,
  progress: GuideProgress,
  areaId: string,
): GuideProgress {
  const { edges } = guide;
  const current = progress.activeEdge;
  const limit = Math.min(edges.length - 1, current + RESYNC_LOOKAHEAD);
  for (let i = current + 1; i <= limit; i++) {
    if (edges[i] === areaId) return { ...progress, activeEdge: i };
  }
  return progress;
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
