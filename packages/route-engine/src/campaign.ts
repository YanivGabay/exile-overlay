import type { GuideShape, GuideProgress } from "./progress.js";
import { stepGroups, visitedSet } from "./progress.js";
import type { RouteData } from "./types.js";
import type { Reminder } from "./reminders.js";

/** Campaign knowledge shipped in the guide bundle (guides repo: <game>/campaign.json). */
export interface CampaignInfo {
  skillPointQuests: Record<string, { points: number; note: string }>;
  banditQuest?: { questId: string; killAllPoints: number };
  respecQuests?: string[];
  resistPenalties?: { fromAct: number; total: number; text: string }[];
  reminders?: Reminder[];
  labs?: Partial<Record<"normal" | "cruel" | "merciless", { areaLevel: number; text: string }>>;
  mapsChecklist?: { items: string[] };
  /** Per-zone tips; verified = checked in game by us; confidence = how many guides agree. */
  zoneTips?: Record<string, ZoneTip[]>;
  presets?: Preset[];
  credits?: { key: string; title: string; creator: string; url: string; license?: string }[];
  league?: { id: string; name: string; notes: { id: string; text: string; act?: number; area?: string; kind?: "loot" | "plan" | "info"; source?: string; verified?: boolean }[] };
}

export type QuestStatus = "done" | "here" | "ahead" | "skipped";

export interface PassiveQuest {
  questId: string;
  name: string;
  points: number;
  act: number;
  status: QuestStatus;
  stepId: string;
}

export interface CampaignStatus {
  /** Passive points from quests the player has passed (route-wise). */
  pointsDone: number;
  /** All quest passive points available on this route (incl. bandits if killing all). */
  pointsTotal: number;
  /** Passive-point quests per act, in route order. */
  quests: PassiveQuest[];
  /** Quests whose zone the player skipped: likely missed points. */
  missed: PassiveQuest[];
  /** Points still to collect in the player's current act. */
  actRemaining: PassiveQuest[];
  act: number;
  /** Total resistance penalty in effect, and whether it just started (first zones of that act). */
  resistPenalty: { total: number; text: string; fresh: boolean } | null;
}

const questIdOf = (step: RouteData.FragmentStep): string[] =>
  step.parts.flatMap((p) => (typeof p !== "string" && p.type === "quest" ? [p.questId] : []));

export function campaignStatus(
  guide: GuideShape,
  progress: GuideProgress,
  info: CampaignInfo,
  ctx: { actOf: (areaId: string) => number | undefined; questName: (id: string) => string; killAllBandits: boolean },
): CampaignStatus {
  const groups = stepGroups(guide);
  const visited = visitedSet(progress);
  const completed = new Set(progress.completed);
  const active = progress.activeEdge;
  const act = ctx.actOf(guide.edges[active]) ?? 1;

  const quests: PassiveQuest[] = [];
  const seen = new Set<string>();
  guide.steps.forEach((entry, i) => {
    if (entry.step.type !== "fragment_step") return;
    for (const questId of questIdOf(entry.step)) {
      const reward = info.skillPointQuests[questId];
      const isBandit = info.banditQuest?.questId === questId && ctx.killAllBandits;
      if ((!reward && !isBandit) || seen.has(questId)) continue;
      seen.add(questId);
      const group = groups[i];
      let status: QuestStatus;
      if (completed.has(entry.id)) status = "done";
      else if (group < active) status = visited.has(group) ? "done" : "skipped";
      else if (group === active) status = "here";
      else status = "ahead";
      quests.push({
        questId,
        name: reward?.note ?? ctx.questName(questId),
        points: reward?.points ?? info.banditQuest?.killAllPoints ?? 0,
        act: ctx.actOf(guide.edges[group]) ?? 0,
        status,
        stepId: entry.id,
      });
    }
  });

  const pointsTotal = quests.reduce((n, q) => n + q.points, 0);
  const pointsDone = quests.filter((q) => q.status === "done").reduce((n, q) => n + q.points, 0);

  let resistPenalty: CampaignStatus["resistPenalty"] = null;
  for (const pen of info.resistPenalties ?? []) {
    if (act >= pen.fromAct) {
      // "Fresh" while the route position is within the first 3 zones of that act.
      const firstOfAct = guide.edges.findIndex((e) => (ctx.actOf(e) ?? 0) >= pen.fromAct);
      resistPenalty = { total: pen.total, text: pen.text, fresh: firstOfAct >= 0 && active - firstOfAct < 3 };
    }
  }

  return {
    pointsDone,
    pointsTotal,
    quests,
    missed: quests.filter((q) => q.status === "skipped"),
    actRemaining: quests.filter((q) => q.act === act && q.status !== "done"),
    act,
    resistPenalty,
  };
}

/** "Recommended Level: 8" hints in the route, for boss/level checks. */
export function recommendedLevel(steps: RouteData.FragmentStep[]): number | null {
  for (const s of steps) {
    for (const sub of [s, ...s.subSteps]) {
      const text = sub.parts.map((p) => (typeof p === "string" ? p : "")).join("");
      const m = /Recommended Level:\s*(\d+)/i.exec(text);
      if (m) return Number(m[1]);
    }
  }
  return null;
}

export interface ZoneTip {
  text: string;
  /** "all", "race", "safe", "new", or combinations like "race/safe". */
  style: string;
  sources: string[];
  confidence: "high" | "med" | "low";
  verified: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  options: { leagueStart: boolean; library: boolean; bandit: "None" | "Oak" | "Kraityn" | "Alira" };
  /** Tip styles shown with this preset. */
  tipStyles: string[];
  view: "full" | "compact" | "gems" | "minimal";
}

/** Tips for a zone that fit the preset, most reliable first. */
export function tipsFor(info: CampaignInfo, areaId: string, preset: Preset | undefined): ZoneTip[] {
  const styles = new Set(preset?.tipStyles ?? ["all", "safe", "race", "new"]);
  const rank = { high: 0, med: 1, low: 2 } as const;
  return (info.zoneTips?.[areaId] ?? [])
    .filter((t) => t.style.split("/").some((s) => styles.has(s)))
    .sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}
