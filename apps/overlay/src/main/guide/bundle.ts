import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { CampaignInfo, GameData, SearchData, TreeTable } from "@exile-overlay/route-engine";

/** A compiled guide as published by the guides repo (and shipped as guides-snapshot/poe1.json). */
export interface GuideBundle {
  schema: 1;
  game: "poe1" | "poe2";
  title: string;
  gameVersion: string;
  version: string;
  builtAt: string;
  routes: string[];
  data: GameData.Bundle;
  campaign?: CampaignInfo;
  tree?: TreeTable;
  search?: SearchData;
}

export function isGuideBundle(v: unknown): v is GuideBundle {
  const b = v as GuideBundle;
  return (
    !!b &&
    b.schema === 1 &&
    (b.game === "poe1" || b.game === "poe2") &&
    Array.isArray(b.routes) &&
    typeof b.version === "string" &&
    typeof b.builtAt === "string" &&
    !!b.data?.Areas
  );
}

/** Reads a bundle file; null if it's missing, unreadable or not a bundle. */
export function readBundle(path: string): GuideBundle | null {
  try {
    if (!existsSync(path)) return null;
    const b = JSON.parse(readFileSync(path, "utf8"));
    return isGuideBundle(b) ? b : null;
  } catch {
    return null;
  }
}

/** Writes a bundle atomically (temp file, then rename). */
export function writeBundle(path: string, dir: string, bundle: GuideBundle) {
  mkdirSync(dir, { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(bundle));
  renameSync(tmp, path);
}

/** Downloads the bundle at `url`; returns it only if it's newer than `current` and for the same game. Never throws. */
export async function fetchNewerBundle(url: string, current: GuideBundle): Promise<GuideBundle | null> {
  try {
    const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) return null;
    const remote = (await res.json()) as unknown;
    if (!isGuideBundle(remote) || remote.game !== current.game) return null;
    if (remote.version === current.version || remote.builtAt <= current.builtAt) return null;
    return remote;
  } catch {
    return null; // offline or bad response: keep the current bundle
  }
}
