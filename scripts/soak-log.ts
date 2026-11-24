/**
 * Soak test: plays a real Client.txt into the overlay's log pipeline
 * (LogTailer → GameLog → GuideService → state + settings store), the way the
 * game writes it: appended in chunks to a temp file while the tailer polls.
 * Reports heap after GC along the way, events seen, and leftover listeners.
 *
 *   node --expose-gc --import tsx scripts/soak-log.ts <Client.txt> [chunkKiB=512]
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
process.exit(0);
