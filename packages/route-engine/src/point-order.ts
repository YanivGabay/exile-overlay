/**
 * The order to take a PoB build's passive points in, and the next few points
 * for a player with a given number of points. PoB only stores which nodes each
 * tree has, not the order, so the order is built greedily: from what is
 * already allocated, walk the cheapest path to the nearest keystone, notable,
 * mastery or jewel socket of the current tree, then the next, and so on.
 * Between trees, nodes the next tree drops are refunds (a respec).
 */
import type { NodeInfo, TreeTable } from "./tree.js";
import type { RouteData } from "./types.js";

export interface PointEvent {
  type: "take" | "refund";
  node: NodeInfo;
  /** For a take: the keystone/notable/mastery/socket this path leads to (the node itself when it is one). */
  goal: NodeInfo | null;
  /** Index of the tree (among trees with nodes) this event belongs to. */
  tree: number;
}

export interface NextPoints {
  /** Points the plan has spent once the player's points are in. */
  spent: number;
  /** The next points to take, in order. */
  next: PointEvent[];
  /** Refunds due before (or among) the next points: the build respecs here. */
  refund: PointEvent[];
  /** Every tree is fully allocated. */
  done: boolean;
}

const GOAL_RANK: Record<string, number> = { k: 0, n: 1, m: 2, j: 3 };

const nodeInfo = (table: TreeTable, id: string): NodeInfo => {
  const n = table.nodes[id];
  return { id, name: (n?.[0] as string) ?? id, kind: (n?.[1] as string) ?? "s", stats: (Array.isArray(n?.[2]) ? n[2] : []) as string[] };
};

/** Nodes that cost a regular passive point (no class start, no ascendancy, known to the table). */
export const isRegularPoint = (table: TreeTable, id: string) => {
  const k = table.nodes[id]?.[1];
  return k !== undefined && k !== "a" && k !== "x" && k !== "c";
};

function adjacency(links: number[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  const add = (a: string, b: string) => adj.set(a, [...(adj.get(a) ?? []), b]);
  for (let i = 0; i + 1 < links.length; i += 2) {
    const a = String(links[i]);
    const b = String(links[i + 1]);
    add(a, b);
    add(b, a);
  }
  return adj;
}

/**
 * Every take and refund, in order, across the build's trees. Null when the
 * table has no links or start nodes (an older guide bundle) or the class has
 * no start node.
 */
export function pointOrder(table: TreeTable, className: string, trees: RouteData.BuildTree[]): PointEvent[] | null {
  const start = table.starts?.[className];
  if (!table.links?.length || !start) return null;
  const adj = adjacency(table.links);
  const kind = (id: string) => (table.nodes[id]?.[1] as string) ?? "s";
  const events: PointEvent[] = [];
  let allocated = new Set<string>([start]);

  trees
    .filter((t) => t.nodes?.length)
    .forEach((tree, treeIndex) => {
      const target = new Set(tree.nodes!.filter((id) => isRegularPoint(table, id)));
      for (const id of allocated) {
        if (id !== start && !target.has(id)) events.push({ type: "refund", node: nodeInfo(table, id), goal: null, tree: treeIndex });
      }
      allocated = new Set([start, ...[...allocated].filter((id) => target.has(id))]);

      for (;;) {
        // Multi-source BFS from everything allocated, through this tree's nodes only.
        // Masteries are dead ends: they hang off their notables and lead nowhere.
        const parent = new Map<string, string>();
        const dist = new Map<string, number>();
        const queue = [...allocated].filter((id) => kind(id) !== "m");
        for (const id of queue) dist.set(id, 0);
        for (let i = 0; i < queue.length; i++) {
          const u = queue[i];
          if (kind(u) === "m") continue;
          for (const v of adj.get(u) ?? []) {
            if (!target.has(v) || allocated.has(v) || dist.has(v)) continue;
            dist.set(v, dist.get(u)! + 1);
            parent.set(v, u);
            queue.push(v);
          }
        }
        const reachable = [...dist.keys()].filter((id) => !allocated.has(id));
        if (!reachable.length) break;
        const goals = reachable.filter((id) => kind(id) in GOAL_RANK);
        const pool = goals.length ? goals : reachable;
        pool.sort((a, b) => dist.get(a)! - dist.get(b)! || (GOAL_RANK[kind(a)] ?? 9) - (GOAL_RANK[kind(b)] ?? 9) || Number(a) - Number(b));
        const goalId = pool[0];
        const path: string[] = [];
        for (let id: string | undefined = goalId; id !== undefined && !allocated.has(id); id = parent.get(id)) path.unshift(id);
        const goal = goals.length ? nodeInfo(table, goalId) : null;
        for (const id of path) {
          allocated.add(id);
          events.push({ type: "take", node: nodeInfo(table, id), goal, tree: treeIndex });
        }
      }
    });
  return events;
}

/**
 * Where a player with `have` points is in the order, and what comes next.
 * The player is assumed to have followed the order so far; a respec is due
 * once every point before it is spent.
 */
export function nextPoints(order: PointEvent[], have: number, count = 3): NextPoints {
  let spent = 0;
  let i = 0;
  for (; i < order.length; i++) {
    if (spent >= have) break;
    spent += order[i].type === "take" ? 1 : -1;
  }
  const next: PointEvent[] = [];
  const refund: PointEvent[] = [];
  for (let j = i; j < order.length && next.length < count; j++) {
    (order[j].type === "take" ? next : refund).push(order[j]);
  }
  return { spent, next, refund, done: i >= order.length };
}
