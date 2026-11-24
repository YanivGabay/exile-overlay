/**
 * Reliability survey of a real Client.txt, per game version.
 * Counts parsed events and prints lines that look like events we should
 * recognise but didn't (near misses). Prints shapes only, no chat text.
 *
 *   npx tsx scripts/survey-log.ts <Client.txt>
 */
import { readFileSync } from "node:fs";
import { parseLine } from "@exile-overlay/log-watcher";

const file = process.argv[2];
const HINTS = /is now level|has been slain|committed suicide|Generating level|You have entered|login\.pathofexile|Kitava's cruel|new dawn|LOG FILE OPENING|disconnect/i;
let version = "unknown";
const stats = new Map<string, Record<string, number>>();
const misses = new Map<string, { n: number; example: string }>();
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const ua = /User agent: PoE release\/tags\/(\S+)/.exec(line);
  if (ua) version = ua[1].replace(/[a-z]$/, "");
  const s = stats.get(version) ?? {};
  stats.set(version, s);
  s.lines = (s.lines ?? 0) + 1;
  const e = parseLine(line);
  if (e) s[e.type] = (s[e.type] ?? 0) + 1;
  else if (HINTS.test(line)) {
    // Chat lines (#, $, @, &, %, or "Name:") are expected misses.
    const rest = line.replace(/^.*?\] /, "");
    if (/^[#$@&%]|^<[^>]*> ?\S+:|^\S+: /.test(rest)) continue;
    const shape = rest.replace(/\d+/g, "N").replace(/"[^"]*"/g, '"…"').slice(0, 90);
    const m = misses.get(shape) ?? { n: 0, example: "" };
    m.n++;
    misses.set(shape, m);
  }
}
console.table(Object.fromEntries(stats));
for (const [shape, m] of [...misses].sort((a, b) => b[1].n - a[1].n)) console.log(m.n, shape);
