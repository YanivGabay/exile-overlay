/**
 * The build's gem plan, act by act: which gems you start with, which to take
 * as quest rewards and which to buy, from whom, in route order.
 */
import type { PobBuild } from "./build.js";
import type { CompiledGuide } from "./guide.js";
import type { GameData } from "./types.js";

export interface GemPlanItem {
  gemId: string;
  /** start: your class starts with it; chest: in the first chest in The Twilight Strand. */
  how: "start" | "chest" | "quest" | "vendor";
  /** Who gives or sells it (null for start and chest gems). */
  npc: string | null;
  /** The quest that rewards or unlocks it (null for start and chest gems). */
  questId: string | null;
  /** How many to buy (a build can use the same gem twice). */
  count: number;
}

export interface GemPlanAct {
  act: number;
  items: GemPlanItem[];
}

export interface GemPlan {
  acts: GemPlanAct[];
  /** Build gems the campaign never gives or sells to this class on this route (drops, Lilly in Act 6 without the quest, etc.). */
  unavailable: string[];
}

const classAllowed = (classes: string[], cls: string) => classes.length === 0 || classes.includes(cls);

/**
 * Read the plan from a guide that `applyBuild` has already filled with gem
 * steps, so the plan and the guide always agree (same route options, same
 * first-chance-to-get-it choices).
 */
export function gemPlan(guide: CompiledGuide, build: PobBuild, data: GameData.Bundle): GemPlan {
  const cls = build.className;
  const byAct = new Map<number, GemPlanItem[]>();
  const add = (act: number, item: GemPlanItem) => byAct.set(act, [...(byAct.get(act) ?? []), item]);
  const covered = new Set<string>();

  const character = data.Characters[cls];
  for (const g of build.requiredGems) {
    const how = character?.start_gem_id === g.id ? "start" : character?.chest_gem_id === g.id ? "chest" : null;
    if (!how || covered.has(g.id)) continue;
    covered.add(g.id);
    add(1, { gemId: g.id, how, npc: null, questId: null, count: 1 });
  }

  const questsOfStep = new Map<string, { questId: string; rewardOffers: string[] }[]>();
  for (const entry of guide.steps) {
    if (entry.step.type === "fragment_step") {
      const quests = entry.step.parts.flatMap((p) => (typeof p !== "string" && p.type === "quest" ? [p] : []));
      if (quests.length) questsOfStep.set(entry.id, quests);
      continue;
    }
    const step = entry.step;
    const gemId = step.requiredGem.id;
    const owner = questsOfStep.get(entry.id.split("~")[0]) ?? [];
    const found = findSource(owner, gemId, step.rewardType, cls, data);
    if (!found) continue;
    covered.add(gemId);
    add(Number(data.Quests[found.questId]?.act) || entry.sectionIndex + 1, {
      gemId,
      how: step.rewardType,
      npc: found.npc,
      questId: found.questId,
      count: step.count,
    });
  }

  const unavailable = [...new Set(build.requiredGems.map((g) => g.id))].filter((id) => data.Gems[id] && !covered.has(id));
  const acts = [...byAct].sort(([a], [b]) => a - b).map(([act, items]) => ({ act, items }));
  return { acts, unavailable };
}

function findSource(
  quests: { questId: string; rewardOffers: string[] }[],
  gemId: string,
  type: "quest" | "vendor",
  cls: string,
  data: GameData.Bundle,
): { questId: string; npc: string } | null {
  for (const q of quests) {
    const quest = data.Quests[q.questId];
    for (const offerId of q.rewardOffers) {
      const offer = quest?.reward_offers[offerId];
      if (!offer) continue;
      if (type === "quest") {
        const r = offer.quest[gemId];
        if (r && classAllowed(r.classes, cls)) return { questId: q.questId, npc: offer.quest_npc };
      } else {
        const r = offer.vendor[gemId];
        if (r && classAllowed(r.classes, cls)) return { questId: q.questId, npc: r.npc };
      }
    }
  }
  return null;
}
