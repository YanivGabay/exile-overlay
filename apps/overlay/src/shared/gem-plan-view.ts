import type { GemPlan, GemPlanAct, GemPlanItem } from "@exile-overlay/route-engine";

/** The next act (from `act` on) with gems still to take or unlock, skipping start and chest gems. */
export function upcomingGems(plan: GemPlan, act: number, questsDone: Set<string>): GemPlanAct | null {
  for (const a of plan.acts) {
    if (a.act < act) continue;
    const items = a.items.filter((i) => i.questId !== null && !questsDone.has(i.questId));
    if (items.length) return { act: a.act, items };
  }
  return null;
}

export interface QuestGroup {
  /** The quest id, or "start" / "chest" for gems you don't get from a quest. */
  key: string;
  questId: string | null;
  /** At most one: a quest gives one reward. Start and chest gems are listed here too. */
  take: GemPlanItem[];
  takeFrom: string | null;
  buy: GemPlanItem[];
  buyFrom: string | null;
}

/** Group an act's items by the quest that gives or unlocks them, in route order. */
export function byQuest(items: GemPlanItem[]): QuestGroup[] {
  const groups = new Map<string, QuestGroup>();
  for (const i of items) {
    const key = i.questId ?? i.how;
    const g = groups.get(key) ?? { key, questId: i.questId, take: [], takeFrom: null, buy: [], buyFrom: null };
    if (i.how === "vendor") {
      g.buy.push(i);
      g.buyFrom = joinNpc(g.buyFrom, i.npc);
    } else {
      g.take.push(i);
      g.takeFrom = joinNpc(g.takeFrom, i.npc);
    }
    groups.set(key, g);
  }
  return [...groups.values()];
}

const joinNpc = (a: string | null, b: string | null) => (!a ? b : !b || a.split(" or ").includes(b) ? a : `${a} or ${b}`);

/** "Start", "First chest" or the quest's name. */
export function groupLabel(g: QuestGroup, questName: (id: string) => string): string {
  return g.key === "start" ? "Start" : g.key === "chest" ? "First chest" : questName(g.questId ?? g.key);
}
