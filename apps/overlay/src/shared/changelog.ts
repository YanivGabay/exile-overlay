/**
 * Player-facing "what's new", newest first. Plain sentences about what changed
 * in the game for them, not commit messages. Add an entry for every release.
 */
export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.2",
    date: "2026-11-12",
    items: [
      "New Report a problem button in Settings → Diagnostics: it copies a report (no account or character names) and opens the bug form on GitHub, ready to paste.",
      "Report on a route step (press F6) now opens the guide error form with the zone, step and guide version already filled in.",
      "Diagnostics links to the FAQ, which covers the SmartScreen warning, finding Client.txt and the overlay not showing in fullscreen.",
      "If the app hits an error, the error screen and the crash message offer Report a problem too.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-11-11",
    items: [
      "First beta for the 3.30 league: a leveling guide that follows your game log and moves on when you change zones.",
      "Four route presets (league start, speedrun, safe, first time) that set the side stops and how much help you see.",
      "Import your Path of Building: gem links, what to take or buy, and the passive tree that fits your level.",
      "Vendor search text for links, movement speed boots and weapon recipe bases, one click to copy.",
      "Campaign timer with act splits, live pace against your best run, and a run summary to share at the end.",
      "Move, resize and fade every widget; layouts are saved per game resolution.",
      "If something breaks, Settings → Diagnostics copies a report and opens the log folder.",
    ],
  },
];

/** Compares "1.2.3" style versions; pre-release tags sort before the release. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core, pre = ""] = v.replace(/^v/, "").split("-", 2);
    return { nums: core.split(".").map((n) => Number.parseInt(n, 10) || 0), pre };
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (pa.nums[i] ?? 0) - (pb.nums[i] ?? 0);
    if (d) return Math.sign(d);
  }
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  return pa.pre < pb.pre ? -1 : 1;
}

/** Entries the player hasn't seen: newer than `lastSeen`, up to the running version. */
export function whatsNewSince(lastSeen: string | null | undefined, current: string, log = CHANGELOG): ChangelogEntry[] {
  if (!lastSeen) return [];
  return log.filter((e) => compareVersions(e.version, lastSeen) > 0 && compareVersions(e.version, current) <= 0);
}
