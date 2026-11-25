import { EventEmitter } from "node:events";
import { LogTailer, locateClientLog, parseLine, type LogEvent } from "@exile-overlay/log-watcher";
import type { AppStateStore } from "../state/app-state.js";

const RETRY_MS = 5000;

/**
 * Finds Client.txt, tails it, and turns lines into game events.
 * Retries every few seconds until the game (and its log) shows up, and
 * restarts when the manual log path in settings changes.
 */
export class GameLog extends EventEmitter<{ event: [LogEvent, boolean] }> {
  private tailer: LogTailer | null = null;
  private retry: NodeJS.Timeout | null = null;
  private stopped = false;
  /** Bumped by stop(); a connect() from before a restart must not start a second tailer. */
  private generation = 0;
  lastDetail = "";

  constructor(private readonly state: AppStateStore) {
    super();
    state.on("settings", (next, prev) => {
      if (next.game.clientLogPath !== prev.game.clientLogPath) void this.restart();
    });
  }

  async start() {
    this.stopped = false;
    await this.connect();
  }

  stop() {
    this.stopped = true;
    this.generation++;
    this.tailer?.stop();
    this.tailer = null;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
  }

  async restart() {
    this.stop();
    this.state.patch({ game: { logStatus: { kind: "searching" } } });
    await this.start();
  }

  private async connect() {
    if (this.stopped) return;
    const gen = this.generation;
    const manual = this.state.settings.game.clientLogPath;
    // Test hook: behave like a machine where the game was never installed or started.
    const result =
      process.env.EXILE_OVERLAY_NO_AUTODETECT && !manual
        ? { logPath: null, processes: [], detail: "Automatic detection is off (test run)." }
        : await locateClientLog("poe1", manual);
    if (gen !== this.generation) return;
    this.lastDetail = result.detail;
    if (!result.logPath) {
      this.state.set("game", { ...this.state.get().game, logStatus: { kind: "searching" } });
      this.retry = setTimeout(() => void this.connect(), RETRY_MS);
      return;
    }

    const tailer = new LogTailer(result.logPath);
    tailer.on("lines", (lines, replay) => this.onLines(lines, replay));
    tailer.on("error", (err) => {
      if (gen !== this.generation) return;
      this.state.patch({ game: { logStatus: { kind: "error", message: err.message } } });
      tailer.stop();
      this.tailer = null;
      this.retry = setTimeout(() => void this.connect(), RETRY_MS);
    });
    try {
      // Set before start() so a stop() during the replay read reaches this tailer.
      this.tailer = tailer;
      await tailer.start();
      if (gen !== this.generation) return tailer.stop();
      this.updateWatching();
    } catch (err) {
      tailer.stop();
      if (this.tailer === tailer) this.tailer = null;
      if (gen !== this.generation) return;
      this.state.patch({ game: { logStatus: { kind: "error", message: (err as Error).message } } });
      this.retry = setTimeout(() => void this.connect(), RETRY_MS);
    }
  }

  private updateWatching() {
    if (!this.tailer) return;
    this.state.set("game", {
      ...this.state.get().game,
      logStatus: { kind: "watching", path: this.tailer.path, sizeBytes: this.tailer.size },
    });
  }

  private onLines(lines: string[], replay: boolean) {
    const events: LogEvent[] = [];
    for (const line of lines) {
      const ev = parseLine(line);
      if (ev) events.push(ev);
    }
    if (replay) {
      // Only the latest area and level-up matter when catching up.
      const lastArea = events.findLast((e) => e.type === "areaGenerated");
      const lastLevel = events.findLast((e) => e.type === "levelUp");
      // Other players seen in the window first, so a party member's level-up isn't taken for yours.
      for (const e of events) if (e.type === "otherPlayer") this.apply(e, true);
      for (const e of [lastLevel, lastArea]) if (e) this.apply(e, true);
      // Whichever came last decides whether we are in a zone or at character select.
      const lastPresence = events.findLast((e) => e.type === "areaGenerated" || e.type === "outOfGame");
      this.state.set("game", { ...this.state.get().game, inGame: lastPresence ? lastPresence.type === "areaGenerated" : null });
    } else {
      for (const e of events) this.apply(e, false);
    }
    this.updateWatching();
  }

  private apply(e: LogEvent, replay: boolean) {
    const game = this.state.get().game;
    switch (e.type) {
      case "areaGenerated":
        this.state.set("game", { ...game, inGame: true, area: { id: e.areaId, name: null, level: e.areaLevel } });
        break;
      case "outOfGame":
        this.state.set("game", { ...game, inGame: false });
        break;
      case "areaEntered":
        if (game.area) this.state.set("game", { ...game, area: { ...game.area, name: e.areaName } });
        break;
      case "levelUp":
        this.state.set("game", {
          ...game,
          character: { name: e.character, className: e.className, level: e.level },
        });
        break;
    }
    this.emit("event", e, replay);
  }
}
