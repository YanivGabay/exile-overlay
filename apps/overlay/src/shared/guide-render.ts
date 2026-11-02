import type { GuideStep, RouteData } from "@exile-overlay/route-engine";

/** What the overlay needs to draw the guide; sent only when the guide is (re)compiled. */
export interface GuideRender {
  version: string;
  steps: GuideStep[];
  edges: string[];
  areas: Record<string, { name: string; act: number; isTown: boolean }>;
  quests: Record<string, { name: string }>;
  /** Gems referenced by the imported build. */
  gems: Record<string, { name: string; colour: string; isSupport: boolean }>;
  build: { className: string; ascendancy: string | null; gemLinks: RouteData.GemLinkGroup[] } | null;
  /** Why the imported build could not be used, if it failed. */
  buildError: string | null;
}
