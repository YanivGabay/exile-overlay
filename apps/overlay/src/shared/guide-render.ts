import type { CampaignInfo, GuideStep, RouteData, SearchData, TreeTable } from "@exile-overlay/route-engine";

/** What the overlay needs to draw the guide; sent only when the guide is (re)compiled. */
export interface GuideRender {
  version: string;
  steps: GuideStep[];
  edges: string[];
  areas: Record<string, { name: string; act: number; isTown: boolean; level: number }>;
  quests: Record<string, { name: string }>;
  /** Gems referenced by the imported build. */
  gems: Record<string, { name: string; colour: string; isSupport: boolean; level: number }>;
  build: {
    className: string;
    ascendancy: string | null;
    gemLinks: RouteData.GemLinkGroup[];
    trees: RouteData.BuildTree[];
    /** Where each build gem is sold to this class: quest that unlocks it, vendor NPC. */
    vendorGems: { gemId: string; questId: string; npc: string }[];
  } | null;
  /** Passive tree node names (null if the bundle has none). */
  tree: TreeTable | null;
  /** Vendor search terms from game data (null if the bundle has none). */
  search: SearchData | null;
  /** Passive-point quests, resist penalties, league notes (null in old bundles). */
  campaign: CampaignInfo | null;
  /** Why the imported build could not be used, if it failed. */
  buildError: string | null;
}
