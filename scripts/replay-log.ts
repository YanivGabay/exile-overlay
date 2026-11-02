/**
 * Replay a real Client.txt through the same parser and tracker the app uses,
 * and print a timeline of every decision. Used to validate tracking on real
 * sessions.
 *
 *   npx tsx scripts/replay-log.ts <Client.txt> [--from-edge N] [--quiet]
 *
 * Starts from the first "Generating level" of the last session (after the
 * last "LOG FILE OPENING") unless --all is given.
 */
import { readFileSync } from "node:fs";
import { parseLine, type LogEvent } from "@exile-overlay/log-watcher";
import { compileGuide, trackArea, zoneCard, INITIAL_PROGRESS, type GameData, type GuideProgress } from "@exile-overlay/route-engine";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) throw new Error("usage: replay-log.ts <Client.txt>");
const all = args.includes("--all");
const quiet = args.includes("--quiet");
const fromEdgeArg = args.indexOf("--from-edge");
const fromEdge = fromEdgeArg >= 0 ? Number(args[fromEdgeArg + 1]) : 0;

const bundle = JSON.parse(readFileSync(new URL("../guides-snapshot/poe1.json", import.meta.url), "utf8")) as {
  routes: string[];
  data: GameData.Bundle;
};
const guide = compileGuide(bundle.routes, bundle.data);
const name = (id: string | undefined) => (id ? bundle.data.Areas[id]?.name ?? id : "-");

let lines = readFileSync(file, "utf8").split(/\r?\n/);
if (!all) {
  const lastOpen = lines.findLastIndex((l) => l.includes("***** LOG FILE OPENING *****"));
  if (lastOpen > 0) lines = lines.slice(lastOpen);
}
const events = lines.map(parseLine).filter((e): e is LogEvent => e !== null);

let progress: GuideProgress = { ...INITIAL_PROGRESS, activeEdge: fromEdge };
let inGame: boolean | null = null;
const counts: Record<string, number> = {};
for (const e of events) {
  if (e.type === "outOfGame") {
    if (inGame !== false && !quiet) console.log(`${e.time}  -- out of game (${e.reason}): overlay hidden`);
    inGame = false;
    continue;
  }
  if (e.type === "levelUp") {
    if (!quiet) console.log(`${e.time}  level ${e.level} ${e.character} (${e.className})`);
    continue;
  }
  if (e.type !== "areaGenerated") continue;
  inGame = true;
  const r = trackArea(guide, progress, e.areaId, { isTown: (id) => bundle.data.Areas[id]?.is_town_area ?? false, actOf: (id) => bundle.data.Areas[id]?.act });
  counts[r.outcome.kind] = (counts[r.outcome.kind] ?? 0) + 1;
  progress = r.progress;
  const card = zoneCard(guide, progress);
  if (!quiet)
    console.log(
      `${e.time}  entered ${name(e.areaId).padEnd(24)} -> ${r.outcome.kind.padEnd(8)} route: ${name(card.areaId)} (#${progress.activeEdge}), then ${name(card.nextAreaId ?? undefined)}`,
    );
}
console.log(`\nzone entries: ${Object.values(counts).reduce((a, b) => a + b, 0)}`, counts);
console.log(`final route position: #${progress.activeEdge} ${name(guide.edges[progress.activeEdge])} of ${guide.edges.length - 1}`);
