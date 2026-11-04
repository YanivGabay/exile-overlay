/**
 * Vendor search strings for the in-game search box (Ctrl+F in shops).
 * Terms come from game data (guides repo: tools/build_search.py).
 */
import { searchStrings } from "./reminders.js";

export interface SearchData {
  presets: Record<string, { label: string; terms: [string, number][] }>;
  links: Record<string, string>;
  maxLength: number;
}

/** Terms of a preset that can roll on items of this item level (vendor items = area level). */
export function termsFor(data: SearchData, presetId: string, itemLevel: number): string[] {
  const p = data.presets[presetId];
  if (!p) return [];
  return p.terms.filter(([, lvl]) => lvl <= itemLevel).map(([t]) => t);
}

/**
 * One or more search strings for the chosen presets and links, plus extra
 * terms (e.g. the build's gem names). Each fits the game's length limit.
 */
export function buildVendorSearch(
  data: SearchData,
  presetIds: string[],
  linkIds: string[],
  itemLevel: number,
  extraTerms: string[] = [],
): string[] {
  const terms = [
    ...linkIds.map((id) => data.links[id]).filter(Boolean),
    ...presetIds.flatMap((id) => termsFor(data, id, itemLevel)),
    ...extraTerms,
  ];
  return terms.length ? searchStrings([...new Set(terms)], data.maxLength) : [];
}
