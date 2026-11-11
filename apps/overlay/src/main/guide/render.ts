import type { CompiledGuide, PobBuild } from "@exile-overlay/route-engine";
import type { GuideRender } from "../../shared/guide-render.js";
import type { GuideBundle } from "./bundle.js";

/** Everything the overlay and settings windows need to draw the guide, in one serialisable object. */
export function buildRender(bundle: GuideBundle, compiled: CompiledGuide, build: PobBuild | null, buildError: string | null): GuideRender {
  const data = bundle.data;
  return {
    version: bundle.version,
    steps: compiled.steps,
    edges: compiled.edges,
    areas: Object.fromEntries(
      Object.values(data.Areas).map((a) => [a.id, { name: a.name, act: a.act, isTown: a.is_town_area, level: a.level }]),
    ),
    quests: Object.fromEntries(Object.values(data.Quests).map((q) => [q.id, { name: q.name }])),
    gems: build ? gemNames(bundle, build) : {},
    build: build
      ? {
          className: build.className,
          ascendancy: build.ascendancy,
          gemLinks: build.gemLinks,
          trees: build.trees,
          vendorGems: vendorGems(bundle, build),
        }
      : null,
    buildError,
    campaign: bundle.campaign ?? null,
    tree: bundle.tree ?? null,
    search: bundle.search ?? null,
  };
}

/** Vendors that sell the build's gems to this class (from quest reward data). */
function vendorGems(bundle: GuideBundle, build: PobBuild): { gemId: string; questId: string; npc: string }[] {
  const cls = build.className;
  const out: { gemId: string; questId: string; npc: string }[] = [];
  for (const g of build.requiredGems) {
    for (const q of Object.values(bundle.data.Quests)) {
      for (const offer of Object.values(q.reward_offers)) {
        const v = offer?.vendor[g.id];
        if (v && (v.classes.length === 0 || v.classes.includes(cls))) out.push({ gemId: g.id, questId: q.id, npc: v.npc });
      }
    }
  }
  return out;
}

/** Names and colours of gems used by the build (keeps the payload small). */
function gemNames(bundle: GuideBundle, build: PobBuild): GuideRender["gems"] {
  const { Gems, GemColours } = bundle.data;
  const out: GuideRender["gems"] = {};
  for (const g of build.requiredGems) {
    const gem = Gems[g.id];
    if (gem) out[g.id] = { name: gem.name, colour: GemColours[gem.primary_attribute] ?? "#c8c8c8", isSupport: gem.is_support, level: gem.required_level };
  }
  return out;
}
