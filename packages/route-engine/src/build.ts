/**
 * Path of Building import and build-aware gem steps.
 * Logic derived from exile-leveling (web/src/state/pob/process.ts and
 * web/src/state/route.ts), MIT, Copyright (c) 2025 HeartofPhos.
 */
import { XMLParser } from "fast-xml-parser";
import type { CompiledGuide, GuideStep } from "./guide.js";
import { buildGemSteps, findCharacterGems } from "./route-processing/gems.js";
import type { GameData, RouteData } from "./types.js";

/** PoB exports some gems under ids that differ from the game's. */
const GEM_ID_REMAP: Record<string, string> = {
  "Metadata/Items/Gems/Smite": "Metadata/Items/Gems/SkillGemSmite",
  "Metadata/Items/Gems/ConsecratedPath": "Metadata/Items/Gems/SkillGemConsecratedPath",
  "Metadata/Items/Gems/VaalAncestralWarchief": "Metadata/Items/Gems/SkillGemVaalAncestralWarchief",
  "Metadata/Items/Gems/HeraldOfAgony": "Metadata/Items/Gems/SkillGemHeraldOfAgony",
  "Metadata/Items/Gems/HeraldOfPurity": "Metadata/Items/Gems/SkillGemHeraldOfPurity",
  "Metadata/Items/Gems/ScourgeArrow": "Metadata/Items/Gems/SkillGemScourgeArrow",
  "Metadata/Items/Gems/RainOfSpores": "Metadata/Items/Gems/SkillGemToxicRain",
  "Metadata/Items/Gems/SummonRelic": "Metadata/Items/Gems/SkillGemSummonRelic",
  "Metadata/Items/Gems/SkillGemNewPhaseRun": "Metadata/Items/Gems/SkillGemPhaseRun",
  "Metadata/Items/Gems/SkillGemNewArcticArmour": "Metadata/Items/Gems/SkillGemArcticArmour",
};

const POB_COLOUR = /\^(x[a-zA-Z0-9]{6}|[0-9])/g;
const clean = (s: string) => s.replace(POB_COLOUR, "").trim();

export interface PobBuild {
  className: string;
  ascendancy: string | null;
  bandit: "None" | "Oak" | "Kraityn" | "Alira";
  requiredGems: RouteData.RequiredGem[];
  gemLinks: RouteData.GemLinkGroup[];
  trees: RouteData.BuildTree[];
}

function mapGemId(gemId: string, data: GameData.Bundle): string {
  let id = GEM_ID_REMAP[gemId] ?? gemId;
  id = data.VaalGemLookup[id] ?? id;
  id = data.AwakenedGemLookup[id] ?? id;
  return id;
}

type XmlNode = Record<string, unknown>;
const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const attr = (node: XmlNode, name: string): string | undefined => {
  const v = node[`@_${name}`];
  return v === undefined ? undefined : String(v);
};

/** Parse the XML inside a PoB export code. Throws on malformed input. */
export function parsePobXml(xml: string, data: GameData.Bundle): PobBuild {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseAttributeValue: false });
  const doc = parser.parse(xml) as XmlNode;
  const root = doc.PathOfBuilding as XmlNode | undefined;
  if (!root) throw new Error("Not a Path of Building export.");
  const build = root.Build as XmlNode | undefined;
  const className = build ? attr(build, "className") : undefined;
  if (!build || !className) throw new Error("The build has no class.");
  const ascendancy = attr(build, "ascendClassName") ?? null;
  const banditRaw = attr(build, "bandit") ?? "None";
  const bandit = (["None", "Oak", "Kraityn", "Alira"].includes(banditRaw) ? banditRaw : "None") as PobBuild["bandit"];

  const requiredGems: RouteData.RequiredGem[] = [];
  const gemLinks: RouteData.GemLinkGroup[] = [];
  const skills = (root.Skills ?? {}) as XmlNode;
  const sets = asArray(skills.SkillSet as XmlNode | XmlNode[] | undefined);
  if (sets.length) for (const set of sets) collectSkills(set, attr(set, "title"));
  else collectSkills(skills, undefined);

  function collectSkills(parent: XmlNode, parentTitle: string | undefined) {
    let lastEmptyLabel: string | undefined;
    for (const skill of asArray(parent.Skill as XmlNode | XmlNode[] | undefined)) {
      if (attr(skill, "enabled") === "false") continue;
      const label = attr(skill, "label");
      const gems = asArray(skill.Gem as XmlNode | XmlNode[] | undefined);
      if (gems.length === 0) lastEmptyLabel = label;
      const primary: string[] = [];
      const secondary: string[] = [];
      for (const gemNode of gems) {
        const raw = attr(gemNode, "gemId");
        if (!raw) continue;
        const id = mapGemId(raw, data);
        if (!requiredGems.some((g) => g.id === id)) {
          requiredGems.push({ id, note: clean(lastEmptyLabel || parentTitle || label || ""), count: 1 });
        }
        const gem = data.Gems[id];
        if (gem) (gem.is_support ? secondary : primary).push(id);
      }
      const title = clean(parentTitle || lastEmptyLabel || "Default");
      const link = (ids: string[]) => ids.map((id) => gemLink(id, className!, data));
      if (primary.length) gemLinks.push({ title, primaryGems: link(primary), secondaryGems: link(secondary) });
      else if (secondary.length) gemLinks.push({ title, primaryGems: link(secondary), secondaryGems: [] });
    }
  }

  const trees: RouteData.BuildTree[] = [];
  for (const spec of asArray((root.Tree as XmlNode | undefined)?.Spec as XmlNode | XmlNode[] | undefined)) {
    const url = spec.URL;
    trees.push({
      name: clean(attr(spec, "title") ?? "Default"),
      version: attr(spec, "treeVersion") ?? "",
      url: typeof url === "string" ? url.trim() : "",
      nodes: (attr(spec, "nodes") ?? "").split(",").map((n) => n.trim()).filter(Boolean),
    });
  }

  return { className, ascendancy, bandit, requiredGems, gemLinks, trees };
}

function gemLink(gemId: string, characterClass: string, data: GameData.Bundle): RouteData.GemLink {
  const quests: RouteData.GemLink["quests"] = [];
  for (const quest of Object.values(data.Quests)) {
    for (const [rewardOfferId, offer] of Object.entries(quest.reward_offers)) {
      const vendor = offer?.vendor[gemId];
      if (vendor && (vendor.classes.length === 0 || vendor.classes.includes(characterClass))) {
        quests.push({ questId: quest.id, rewardOfferId });
      }
    }
  }
  return { id: gemId, quests };
}

/**
 * Insert "take gem" / "buy gem" steps after each quest hand-in, and append a
 * vendor search string to that quest step. With `gemsOnly`, steps without
 * gem rewards are dropped (but area-changing steps are kept so tracking
 * still works).
 */
export function applyBuild(
  guide: CompiledGuide,
  build: PobBuild,
  data: GameData.Bundle,
  options: { gemsOnly?: boolean; leagueStart: boolean; library: boolean } = { leagueStart: true, library: false },
): CompiledGuide {
  const buildData: RouteData.BuildData = {
    characterClass: build.className,
    bandit: build.bandit,
    leagueStart: options.leagueStart,
    library: options.library,
  };
  const questGems = new Set<number>();
  const vendorGems = new Set<number>();
  findCharacterGems(data, buildData, build.requiredGems, questGems);

  const steps: GuideStep[] = [];
  for (const entry of guide.steps) {
    if (entry.step.type !== "fragment_step") {
      steps.push(entry);
      continue;
    }
    const gemSteps: RouteData.GemStep[] = [];
    for (const part of entry.step.parts) {
      if (typeof part !== "string" && part.type === "quest") {
        gemSteps.push(...buildGemSteps(data, part, buildData, build.requiredGems, questGems, vendorGems));
      }
    }
    if (options.gemsOnly && gemSteps.length === 0 && entry.edgeIndex === null) continue;

    if (gemSteps.length) {
      const search = gemSteps.map((g) => data.Gems[g.requiredGem.id]?.name ?? g.requiredGem.id).join("|");
      const withCopy: RouteData.FragmentStep = JSON.parse(JSON.stringify(entry.step));
      withCopy.parts.push({ type: "copy", text: `"${search}"`, side: "tail" });
      steps.push({ ...entry, step: withCopy });
    } else {
      steps.push(entry);
    }
    for (const g of gemSteps) {
      steps.push({
        id: `${entry.id}~${g.rewardType}~${g.requiredGem.id.split("/").at(-1)}`,
        sectionIndex: entry.sectionIndex,
        sectionName: entry.sectionName,
        step: g,
        edgeIndex: null,
      });
    }
  }
  return { ...guide, steps };
}
