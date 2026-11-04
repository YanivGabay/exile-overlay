import { DEFAULT_GUIDE_OPTIONS } from "@exile-overlay/route-engine";
import type { DeepPartial, Settings, WidgetId, WidgetLayout } from "./types.js";

export const POE1_WINDOW_TITLE = "Path of Exile";

export const DEFAULT_SETTINGS: Settings = {
  schema: 1,
  firstRunDone: false,
  game: { targetTitle: POE1_WINDOW_TITLE, clientLogPath: null },
  features: { timer: true, reminders: true, zoneTips: true, leagueTips: true, gemLinks: true, tree: true, shopping: true },
  hotkeys: {
    nextStep: "F4",
    prevStep: "F3",
    resync: "Shift+F4",
    toggleEdit: "F6",
    toggleOverlay: "F7",
  },
  guide: {
    preset: "league-start",
    options: DEFAULT_GUIDE_OPTIONS,
    view: "full",
    showHints: true,
    bundleUrl: null,
  },
  layouts: {},
  characters: {},
  activeCharacter: null,
  runs: [],
};

export const DEFAULT_WIDGET_LAYOUT: Record<WidgetId, WidgetLayout> = {
  // Right side, below the minimap area, out of the way of the life globe.
  guide: { x: 0.74, y: 0.3, width: 0.24, visible: true, opacity: 0.92, scale: 1 },
  // Left side, below the party/buff area. Shown only when a build is imported.
  gems: { x: 0.005, y: 0.22, width: 0.2, visible: true, opacity: 0.9, scale: 0.95 },
  // Below the gem links.
  tree: { x: 0.005, y: 0.52, width: 0.2, visible: true, opacity: 0.9, scale: 0.95 },
  status: { x: 0.005, y: 0.005, width: 0.18, visible: true, opacity: 0.85, scale: 1 },
};

export function resolutionKey(width: number, height: number): string {
  return `${Math.round(width)}x${Math.round(height)}`;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Merge `patch` into `base`; arrays and primitives replace. Returns a new object. */
export function deepMerge<T>(base: T, patch: DeepPartial<T> | unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return (patch === undefined ? base : patch) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : value;
  }
  return out as T;
}
