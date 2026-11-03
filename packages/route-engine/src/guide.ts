import type { Log } from "./route-processing/scoped-logger.js";
import {
  getRouteFiles,
  initializeRouteState,
  parseRoute,
} from "./route-processing/index.js";
import type { Fragments, GameData, RouteData } from "./types.js";

export type Bandit = "None" | "Oak" | "Kraityn" | "Alira";

/** Player-facing route options. Each maps to a preprocessor definition. */
export interface GuideOptions {
  /** First character this league (waypoints and route structure). */
  leagueStart: boolean;
  library: boolean;
  bandit: Bandit;
  /** Labyrinth trials (plus crafting recipes in the same zones). */
  trials?: boolean;
  /** Tidal Island (Mercy Mission) and The Den (Great White Beast): the two Quicksilver flasks. */
  quicksilver?: boolean;
  /** League encounters in The Slave Pens and Act 6 Twilight Strand (5-link chance). */
  fiveLink?: boolean;
  /** Nice-to-have side content: Chemist's Strongbox, Karui tattoo, Silver Locket. */
  extras?: boolean;
}

export const DEFAULT_GUIDE_OPTIONS: GuideOptions = {
  leagueStart: true,
  library: false,
  bandit: "None",
  trials: true,
  quicksilver: true,
  fiveLink: true,
  extras: false,
};

export function optionsToDefinitions(options: GuideOptions): Set<string> {
  const defs = new Set<string>();
  if (options.leagueStart) defs.add("LEAGUE_START");
  if (options.library) defs.add("LIBRARY");
  // Older saves have no fine-grained switches: follow leagueStart like before.
  if (options.trials ?? options.leagueStart) defs.add("TRIALS");
  if (options.quicksilver ?? options.leagueStart) defs.add("QUICKSILVER");
  if (options.fiveLink ?? true) defs.add("FIVE_LINK");
  if (options.extras ?? options.leagueStart) defs.add("EXTRAS");
  switch (options.bandit) {
    case "None":
      defs.add("BANDIT_KILL");
      break;
    case "Oak":
      defs.add("BANDIT_OAK");
      break;
    case "Kraityn":
      defs.add("BANDIT_KRAITYN");
      break;
    case "Alira":
      defs.add("BANDIT_ALIRA");
      break;
  }
  return defs;
}

/** A top-level step with a stable id and its position in the route. */
export interface GuideStep {
  /** Stable across guide updates as long as the step's content is unchanged. */
  id: string;
  sectionIndex: number;
  sectionName: string;
  /** A route step, or a gem step inserted from an imported build. */
  step: RouteData.FragmentStep | RouteData.GemStep;
  /**
   * Index into `edges` of the area this step moves you to, or null when the
   * step does not change area. The first step of the route has edge 0.
   */
  edgeIndex: number | null;
}

export interface CompiledGuide {
  route: RouteData.Route;
  steps: GuideStep[];
  /** Ordered list of area ids the route visits. `edges[0]` is the start area. */
  edges: string[];
  logs: Log[];
}

/**
 * Parse route sources (one string per file, each starting with `#section`)
 * into a route with stable step ids.
 */
export function compileGuide(
  routeSources: string[],
  data: GameData.Bundle,
  options: GuideOptions = DEFAULT_GUIDE_OPTIONS,
): CompiledGuide {
  const state = initializeRouteState(data);
  for (const def of optionsToDefinitions(options))
    state.preprocessorDefinitions.add(def);

  const { route, logs } = parseRoute(getRouteFiles(routeSources), state);

  const steps: GuideStep[] = [];
  const seen = new Map<string, number>();
  route.sections.forEach((section, sectionIndex) => {
    const sectionSlug = slug(section.name);
    for (const step of section.steps) {
      if (step.type !== "fragment_step") continue;
      const base = `${sectionSlug}-${fnv1a(stepFingerprint(step))}`;
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      steps.push({
        id: n === 0 ? base : `${base}-${n}`,
        sectionIndex,
        sectionName: section.name,
        step,
        edgeIndex: step.edgeIndex,
      });
    }
  });

  return { route, steps, edges: route.edges, logs };
}

function stepFingerprint(step: RouteData.FragmentStep): string {
  return JSON.stringify([step.parts, step.subSteps.map((s) => s.parts)]);
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 32-bit FNV-1a, rendered as 8 hex chars. */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Plain-text rendering of a fragment list, for search, tests and logs. */
export function fragmentsToText(
  parts: Fragments.AnyFragment[],
  data: GameData.Bundle,
): string {
  return parts
    .map((part) => {
      if (typeof part === "string") return part;
      switch (part.type) {
        case "kill":
        case "arena":
        case "quest_text":
        case "generic":
          return part.value;
        case "area":
        case "enter":
          return data.Areas[part.areaId]?.name ?? part.areaId;
        case "logout":
          return `Logout to ${data.Areas[part.areaId]?.name ?? part.areaId}`;
        case "waypoint":
          return "Waypoint";
        case "waypoint_use":
          return `Waypoint to ${data.Areas[part.dstAreaId]?.name ?? part.dstAreaId}`;
        case "waypoint_get":
          return "Get the waypoint";
        case "portal_set":
          return "Set a portal";
        case "portal_use":
          return `Portal to ${data.Areas[part.dstAreaId]?.name ?? part.dstAreaId}`;
        case "quest":
          return data.Quests[part.questId]?.name ?? part.questId;
        case "reward_quest":
        case "reward_vendor":
          return part.item;
        case "trial":
          return "Trial of Ascendancy";
        case "ascend":
          return `Ascend (${part.version} Labyrinth)`;
        case "crafting":
          return `Crafting recipe: ${part.crafting_recipes.join(", ")}`;
        case "dir":
          return DIRECTION_WORDS[part.dirIndex] ?? "";
        case "copy":
          return part.text;
      }
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** dirIndex 0 = north, clockwise in 45° steps. */
export const DIRECTION_WORDS = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];

export const DIRECTION_ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
