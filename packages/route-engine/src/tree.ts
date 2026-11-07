/**
 * Passive-tree guidance from a PoB build: which spec fits the player now,
 * and what the next spec adds, by name. Node names come from GGG's official
 * skill tree export (compacted by the guides repo: tools/build_tree.py).
 */
import type { RouteData } from "./types.js";

/** node id → [name, kind, stats?, ascendancy?]; kind: k keystone, n notable, a asc notable, s small, m mastery, j jewel, x asc small */
export interface TreeTable {
  version: string;
  nodes: Record<string, [string, string, string[]?, string?] | (string | string[])[]>;
}

/**
 * Pick the entry whose title fits where the player is:
 *  - ranges: "Act 1-3", "Level 12-28", "1-12", "lvl 80-92 Early 6 link";
 *  - open ends: "Act 4+", "lvl 38+";
 *  - milestones: "LvLing Tree lvl 24", "Lvl70 after 3rd lab" apply from that level on.
 * Level titles that apply beat act titles. Among them, a range in progress
 * wins; otherwise the entry that starts latest at or before the player (so the
 * last range keeps applying past its end). Ties go to the later entry.
 * Tags like "{3}" and notes like "(Respec 18 points)" are not levels.
 * Falls back to the first entry.
 */
export function pickByTitle(titles: string[], act: number, level: number | null): number {
  let best = -1;
  let bestRank = -Infinity;
  titles.forEach((title, i) => {
    const t = title
      .toLowerCase()
      .replace(/\{[^}]*\}/g, "")
      .replace(/\([^)]*\)/g, "");
    const nums = [...t.matchAll(/\d+/g)].map((m) => Number(m[0]));
    if (!nums.length) return;
    const isAct = /\bact/.test(t);
    const value = isAct ? act : level;
    if (value === null) return;
    const lo = nums[0];
    const hi = t.includes("+") ? Infinity : nums.length > 1 && nums[1] > lo ? nums[1] : isAct ? lo : Infinity;
    if (value < lo) return;
    // Level titles beat act titles (after the campaign the act stays 10);
    // an explicit range in progress beats one that only started earlier.
    const isRange = t.includes("+") || (nums.length > 1 && nums[1] > lo) || isAct;
    const rank = (isAct ? 0 : 2e6) + (isRange && value <= hi ? 1e6 : 0) + lo;
    if (rank >= bestRank) {
      best = i;
      bestRank = rank;
    }
  });
  return best === -1 ? 0 : best;
}

export interface NodeInfo {
  id: string;
  name: string;
  kind: string;
  stats: string[];
}

export interface TreeStep {
  /** Index of the spec that fits now, and the next one (null at the last spec). */
  current: number;
  next: number | null;
  currentName: string;
  nextName: string | null;
  /** Regular (non-ascendancy) points the current / next spec uses. */
  currentPoints: number;
  nextPoints: number | null;
  /** What the next spec adds, most important first. */
  add: { keystones: NodeInfo[]; notables: NodeInfo[]; ascendancy: NodeInfo[]; masteries: NodeInfo[]; small: number; jewels: number };
  /** Nodes the next spec drops (respec). */
  remove: NodeInfo[];
}

const info = (table: TreeTable, id: string): NodeInfo | null => {
  const n = table.nodes[id];
  if (!n) return null;
  return { id, name: n[0] as string, kind: n[1] as string, stats: (Array.isArray(n[2]) ? n[2] : []) as string[] };
};

const regularPoints = (table: TreeTable, nodes: string[]) =>
  nodes.filter((id) => {
    const k = table.nodes[id]?.[1];
    return k !== undefined && k !== "a" && k !== "x";
  }).length;

export function treeStep(
  trees: RouteData.BuildTree[],
  table: TreeTable,
  act: number,
  level: number | null,
  manual: number | null = null,
): TreeStep | null {
  const usable = trees.filter((t) => t.nodes && t.nodes.length);
  if (!usable.length) return null;
  const current = manual ?? pickByTitle(usable.map((t) => t.name), act, level);
  const next = current + 1 < usable.length ? current + 1 : null;
  const cur = new Set(usable[current].nodes);
  const nxt = next !== null ? new Set(usable[next].nodes) : null;
  const add: TreeStep["add"] = { keystones: [], notables: [], ascendancy: [], masteries: [], small: 0, jewels: 0 };
  const remove: NodeInfo[] = [];
  if (nxt) {
    for (const id of nxt) {
      if (cur.has(id)) continue;
      const n = info(table, id);
      if (!n) continue;
      if (n.kind === "k") add.keystones.push(n);
      else if (n.kind === "n") add.notables.push(n);
      else if (n.kind === "a") add.ascendancy.push(n);
      else if (n.kind === "m") add.masteries.push(n);
      else if (n.kind === "j") add.jewels++;
      else if (n.kind === "s") add.small++;
    }
    for (const id of cur) {
      if (nxt.has(id)) continue;
      const n = info(table, id);
      if (n && n.kind !== "x") remove.push(n);
    }
  }
  return {
    current,
    next,
    currentName: usable[current].name,
    nextName: next !== null ? usable[next].name : null,
    currentPoints: regularPoints(table, usable[current].nodes!),
    nextPoints: next !== null ? regularPoints(table, usable[next].nodes!) : null,
    add,
    remove,
  };
}

/** Passive points a character has: level - 1 plus quest points collected. */
export function availablePoints(level: number | null, questPoints: number): number | null {
  return level === null ? null : Math.max(0, level - 1) + questPoints;
}
