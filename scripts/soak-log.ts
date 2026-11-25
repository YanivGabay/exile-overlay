/**
 * Soak test: plays a real Client.txt into the overlay's log pipeline
 * (LogTailer → GameLog → GuideService → state + settings store), the way the
 * game writes it: appended in chunks to a temp file while the tailer polls.
 * Reports heap after GC along the way, events seen, and leftover listeners.
 *
 *   node --expose-gc --import tsx scripts/soak-log.ts <Client.txt> [chunkKiB=512]
 *
 * Extra output: SOAK_CHARS=1 (each character's level, step, timer), SOAK_TRACE=1
 * (who each campaign completion went to), SOAK_WINDOW="<from>,<to>" (log times;
 * the active character after every event in that window), SOAK_SIZES=1 and
 * SOAK_FIELDS=1 (what the saved state and GuideService hold, for leak hunts).
 */
import { appendFileSync, mkdtempSync, openSync, readSync, statSync, closeSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AppStateStore } from "../apps/overlay/src/main/state/app-state.js";
import { SettingsStore } from "../apps/overlay/src/main/state/settings-store.js";
import { GameLog } from "../apps/overlay/src/main/game/game-log.js";
import { GuideService } from "../apps/overlay/src/main/guide/guide-service.js";
import { DEFAULT_SETTINGS } from "../apps/overlay/src/shared/defaults.js";

const source = process.argv[2];
const chunk = Number(process.argv[3] ?? 512) * 1024;
const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error("run with node --expose-gc");
const heapMB = () => (gc(), process.memoryUsage().heapUsed / 2 ** 20);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "eo-soak-"));
const log = join(dir, "Client.txt");
writeFileSync(log, "");
const state = new AppStateStore(
  {
    appVersion: "soak",
    settings: { ...structuredClone(DEFAULT_SETTINGS), game: { ...DEFAULT_SETTINGS.game, clientLogPath: log } },
    overlay: { attached: true, targetFocused: true, bounds: null, editing: false, hidden: false },
    game: { logStatus: { kind: "searching" }, inGame: null, area: null, character: null },
    guide: { state: "loading", source: null, version: null, gameVersion: null, title: null, message: null },
    tracking: null,
  },
  SettingsStore.inDir(dir),
);
const snapshot = fileURLToPath(new URL("../guides-snapshot/poe1.json", import.meta.url));
const guide = new GuideService(state, snapshot, join(dir, "guides"), null);
guide.start();
const gameLog = new GameLog(state);
const counts: Record<string, number> = {};
gameLog.on("event", (e, replay) => {
  counts[e.type] = (counts[e.type] ?? 0) + 1;
  guide.onLogEvent(e, replay);
  const win = process.env.SOAK_WINDOW?.split(",");
  if (win && !replay && e.time >= win[0] && e.time <= win[1] && e.type !== "areaEntered") {
    const a = state.get().settings.activeCharacter;
    console.log(`win ${e.time} ${e.type} ${"areaId" in e ? e.areaId : "character" in e ? e.character : ""} -> ${a} edge ${state.get().settings.characters[a ?? "_default"]?.progress.activeEdge}`);
  }
  if (process.env.SOAK_TRACE && e.type === "campaignComplete") { const a = state.get().settings.characters[state.get().settings.activeCharacter ?? "_default"]; console.log(`campaign complete ${e.time} -> ${a?.name} edge ${a?.progress.activeEdge} fin ${a?.timer?.finishedAt != null} area ${state.get().game.area?.id}`); };
});
await gameLog.start();

const total = statSync(source).size;
const fd = openSync(source, "r");
const buf = Buffer.alloc(chunk);
const t0 = Date.now();
const samples: { mb: number; heap: number }[] = [{ mb: 0, heap: heapMB() }];
let pos = 0;
let lastSample = 0;
while (pos < total) {
  const n = readSync(fd, buf, 0, chunk, pos);
  appendFileSync(log, buf.subarray(0, n));
  pos += n;
  await wait(260); // one tailer poll
  if (pos - lastSample >= total / 10 || pos >= total) {
    lastSample = pos;
    samples.push({ mb: Math.round(pos / 2 ** 20), heap: Math.round(heapMB() * 10) / 10 });
  }
}
closeSync(fd);
await wait(600);
gameLog.stop();
guide.stop();
const s = state.get();
const active = s.settings.characters[s.settings.activeCharacter ?? "__default"] ?? null;
console.log(JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), counts, samples, inGame: s.game.inGame, area: s.game.area?.id,
  characters: Object.keys(s.settings.characters).length, runs: s.settings.runs.length,
  activeTimerDeaths: active?.timer?.deaths ?? null,
  listeners: { stateSettings: state.listenerCount("settings"), gameLog: gameLog.listenerCount("event") } }, null, 1));
if (process.env.SOAK_CHARS) console.log(Object.values(s.settings.characters).map((c) => `${c.name} lvl=${c.level} edge=${c.progress.activeEdge} timer=${c.timer ? `${c.timer.fullRun ? "full" : "partial"} fin=${c.timer.finishedAt !== null} ${Math.round(c.timer.elapsedMs / 60000)}min` : "none"} done=${(c as { campaignComplete?: boolean }).campaignComplete ?? false}`).join("\n"));
if (process.env.SOAK_SIZES) for (const c of Object.values(s.settings.characters)) console.log("size", c.name, JSON.stringify(c).length, Object.entries(c).map(([k, v]) => `${k}:${JSON.stringify(v ?? null).length}`).join(" "));
if (process.env.SOAK_FIELDS) for (const [k, v] of Object.entries(guide as unknown as Record<string, unknown>)) { let n = ""; try { n = v instanceof Set || v instanceof Map ? `size ${v.size}` : Array.isArray(v) ? `len ${v.length}` : typeof v === "object" && v ? `json ${JSON.stringify(v).length}` : String(v).slice(0, 40); } catch { n = "?"; } console.log("field", k, n); }
process.exit(0);
