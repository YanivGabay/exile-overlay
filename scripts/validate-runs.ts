/**
 * Accuracy check on real history, per character.
 *
 * Splits a Client.txt into sessions (between logins / character select).
 * A session belongs to the character named in its level-up lines; sessions
 * without one are skipped. Each character whose first session starts in The
 * Twilight Strand is replayed through the tracker, and we measure agreement:
 * after each zone entry that is on the route and not a town, is the guide's
 * current zone the zone the player is actually in?
 *
 *   npx tsx scripts/validate-runs.ts <Client.txt> [--verbose] [--variant alt]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseLine, type LogEvent } from "@exile-overlay/log-watcher";
import { compileGuide, trackArea, INITIAL_PROGRESS, type GameData, type GuideProgress } from "@exile-overlay/route-engine";

const file = process.argv[2];
const verbose = process.argv.includes("--verbose");
const leagueStart = !process.argv.includes("alt");
const bundle = JSON.parse(readFileSync(new URL("../guides-snapshot/poe1.json", import.meta.url), "utf8")) as {
  routes: string[];
  data: GameData.Bundle;
};
const areas = bundle.data.Areas;
const guide = compileGuide(bundle.routes, bundle.data, { leagueStart, library: false, bandit: "None" });
const onRoute = new Set(guide.edges);
const ctx = { isTown: (id: string) => areas[id]?.is_town_area ?? false, actOf: (id: string) => areas[id]?.act };

type Session = { character: string | null; entries: { time: string; areaId: string }[] };
const sessions: Session[] = [{ character: null, entries: [] }];
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const e: LogEvent | null = parseLine(line);
  if (!e) continue;
  const cur = sessions.at(-1)!;
  if (e.type === "outOfGame") {
    if (cur.entries.length) sessions.push({ character: null, entries: [] });
  } else if (e.type === "levelUp") {
    cur.character ??= e.character;
  } else if (e.type === "areaGenerated") {
    cur.entries.push({ time: e.time, areaId: e.areaId });
  }
}

const byChar = new Map<string, Session[]>();
for (const s of sessions) if (s.character) byChar.set(s.character, [...(byChar.get(s.character) ?? []), s]);

const exportPath = process.argv.includes("--export") ? process.argv[process.argv.indexOf("--export") + 1] : null;
const exported: string[][] = [];
let totalChecked = 0;
let totalAgree = 0;
let totalOk = 0;
let totalStalls = 0;
for (const [name, list] of byChar) {
  if (list[0].entries[0]?.areaId !== "1_1_1") continue; // only characters we saw from the start
  let entries = list.flatMap((s) => s.entries).filter((r) => areas[r.areaId] || /hideout/i.test(r.areaId));
  const stop = entries.findIndex((r) => r.areaId.startsWith("Map"));
  if (stop >= 0) entries = entries.slice(0, stop);
  exported.push(entries.map((r) => r.areaId));
  let progress: GuideProgress = INITIAL_PROGRESS;
  let checked = 0;
  let agree = 0;
  let ok = 0;
  const kinds: Record<string, number> = {};
  const misses: string[] = [];
  for (const r of entries) {
    const res = trackArea(guide, progress, r.areaId, ctx);
    progress = res.progress;
    kinds[res.outcome.kind] = (kinds[res.outcome.kind] ?? 0) + 1;
    if (!ctx.isTown(r.areaId) && onRoute.has(r.areaId)) {
      checked++;
      const agreed = guide.edges[progress.activeEdge] === r.areaId;
      if (agreed) agree++;
      // "Waiting": passing through a zone already done while the guide holds the next task.
      if (agreed || (res.outcome.kind === "detour" && res.outcome.reason === "visited")) ok++;
      if (agreed) {
      } else if (misses.length < 12)
        misses.push(`${r.time} in ${areas[r.areaId]?.name} -> ${res.outcome.kind}, guide at ${areas[guide.edges[progress.activeEdge]]?.name} (#${progress.activeEdge})`);
    }
  }
  totalChecked += checked;
  totalAgree += agree;
  totalOk += ok;
  totalStalls += kinds.ahead ?? 0;
  const lastCampaign = [...entries].reverse().find((r) => onRoute.has(r.areaId));
  console.log(
    `${name.padEnd(22)} ${list.length} sessions, ${entries.length} zones, agree ${checked ? ((100 * agree) / checked).toFixed(1) : "-"}% / agree-or-waiting ${checked ? ((100 * ok) / checked).toFixed(1) : "-"}%, guide ends at #${progress.activeEdge} ${areas[guide.edges[progress.activeEdge]]?.name}; player's last campaign zone ${areas[lastCampaign?.areaId ?? ""]?.name}`,
    JSON.stringify(kinds),
  );
  if (verbose) for (const m of misses) console.log("    miss:", m);
}
const pct = (n: number) => ((100 * n) / Math.max(1, totalChecked)).toFixed(1);
console.log(
  `\n${leagueStart ? "league start" : "alt"} route, ${totalChecked} on-route zone entries: agree ${pct(totalAgree)}%, agree-or-waiting ${pct(totalOk)}%, stalls (guide behind, asking) ${totalStalls}`,
);

if (exportPath) {
  // Zone ids only: no character names, chat or timestamps.
  writeFileSync(exportPath, JSON.stringify({ note: "Anonymized real campaign runs: area ids per character, in order.", runs: exported }));
  console.log(`exported ${exported.length} runs to ${exportPath}`);
}
