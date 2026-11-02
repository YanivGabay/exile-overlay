/**
 * Parsers for Path of Exile's Client.txt. Only the lines we need are
 * recognised; everything else returns null.
 *
 * Example lines (PoE1, English client):
 *   2026/11/02 20:01:02 123456 cff94598 [DEBUG Client 1234] Generating level 2 area "1_1_2" with seed 1234567
 *   2026/11/02 20:05:00 123456 cb3d7b3f [INFO Client 1234] : Fancy_Name (Marauder) is now level 5
 *
 * "Generating level" lines are language-independent (area ids, not names),
 * which is why area tracking works on every client language.
 */

export type LogEvent =
  /** Login screen or character select: the player is not in a zone. */
  | { type: "outOfGame"; time: string; reason: "clientStart" | "loginServer" }
  | { type: "areaGenerated"; time: string; areaId: string; areaLevel: number; seed: number }
  | { type: "levelUp"; time: string; character: string; className: string; level: number }
  | { type: "areaEntered"; time: string; areaName: string };

const PREFIX = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\b.*?\] /;
const GENERATING = /^Generating level (\d+) area "([^"]+)"(?: with seed (\d+))?/;
// Character names: letters, digits, underscores. Class may be an ascendancy.
const LEVEL_UP = /^: (\S+) \(([A-Za-z]+)\) is now level (\d+)\s*$/;
// English only; used for display, never for tracking.
const ENTERED = /^: You have entered (.+?)\.\s*$/;

// Written when the client starts, and when the player logs out to character select.
const LOG_OPENING = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \*\*\*\*\* LOG FILE OPENING/;
const LOGIN_SERVER = /^Async connecting to \S*login\.pathofexile\.com/;

export function parseLine(line: string): LogEvent | null {
  const opening = LOG_OPENING.exec(line);
  if (opening) return { type: "outOfGame", time: opening[1], reason: "clientStart" };
  const prefix = PREFIX.exec(line);
  if (!prefix) return null;
  const time = prefix[1];
  const rest = line.slice(prefix[0].length);

  if (LOGIN_SERVER.test(rest)) return { type: "outOfGame", time, reason: "loginServer" };
  let m = GENERATING.exec(rest);
  if (m) {
    return {
      type: "areaGenerated",
      time,
      areaLevel: Number(m[1]),
      areaId: m[2],
      seed: m[3] ? Number(m[3]) : 0,
    };
  }
  m = LEVEL_UP.exec(rest);
  if (m) {
    return { type: "levelUp", time, character: m[1], className: m[2], level: Number(m[3]) };
  }
  m = ENTERED.exec(rest);
  if (m) return { type: "areaEntered", time, areaName: m[1] };
  return null;
}

/** PoE1 ascendancy → base class (quest gem rewards are per base class). */
export const ASCENDANCY_TO_CLASS: Record<string, string> = {
  Juggernaut: "Marauder",
  Berserker: "Marauder",
  Chieftain: "Marauder",
  Slayer: "Duelist",
  Gladiator: "Duelist",
  Champion: "Duelist",
  Deadeye: "Ranger",
  Raider: "Ranger",
  Pathfinder: "Ranger",
  Warden: "Ranger",
  Assassin: "Shadow",
  Saboteur: "Shadow",
  Trickster: "Shadow",
  Necromancer: "Witch",
  Elementalist: "Witch",
  Occultist: "Witch",
  Inquisitor: "Templar",
  Hierophant: "Templar",
  Guardian: "Templar",
  Ascendant: "Scion",
  Reliquarian: "Scion",
  Luminary: "Scion",
};

export const BASE_CLASSES = ["Marauder", "Duelist", "Ranger", "Shadow", "Witch", "Templar", "Scion"];

export function baseClassOf(className: string): string | null {
  if (BASE_CLASSES.includes(className)) return className;
  return ASCENDANCY_TO_CLASS[className] ?? null;
}

/** Areas that never count as route progress (towns are handled by the route). */
export function isHideoutLike(areaId: string): boolean {
  return /^Hideout|hideout/i.test(areaId) || areaId.startsWith("Menagerie") || areaId === "KalguuranSettlersLeague";
}
