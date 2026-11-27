import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** One crash or caught error, kept on this PC only. */
export interface CrashEntry {
  /** ISO time. */
  at: string;
  /** "main process", "overlay page", "settings page", or the UI part that caught it. */
  where: string;
  message: string;
  stack?: string;
  version: string;
}

/**
 * Local-only crash list: <userData>/logs/crashes.json, newest first, at most
 * `max` entries. Nothing here is ever sent anywhere; Diagnostics shows the list
 * and copies one entry into a bug report only when the player clicks.
 */
export class CrashLog {
  readonly file: string;

  constructor(
    dir: string,
    private readonly version: string,
    private readonly max = 20,
  ) {
    mkdirSync(dir, { recursive: true });
    this.file = join(dir, "crashes.json");
  }

  list(): CrashEntry[] {
    try {
      const data = JSON.parse(readFileSync(this.file, "utf8")) as unknown;
      return Array.isArray(data) ? data.filter((e): e is CrashEntry => !!e && typeof e.at === "string" && typeof e.message === "string") : [];
    } catch {
      return []; // no file yet, or damaged: start over
    }
  }

  record(entry: Omit<CrashEntry, "at" | "version"> & { at?: string }): CrashEntry {
    const full: CrashEntry = { at: entry.at ?? new Date().toISOString(), version: this.version, where: entry.where, message: entry.message, stack: entry.stack };
    const prev = this.list();
    // The same error repeating (an error thrown in a loop) is one entry, not a disk write per throw.
    const last = prev[0];
    if (last && last.where === full.where && last.message === full.message && Date.parse(full.at) - Date.parse(last.at) < 60_000) return last;
    const next = [full, ...prev].slice(0, this.max);
    try {
      writeFileSync(`${this.file}.tmp`, JSON.stringify(next, null, 1));
      renameSync(`${this.file}.tmp`, this.file);
    } catch {
      /* best effort: a full disk must not cause another crash */
    }
    return full;
  }

  clear() {
    try {
      writeFileSync(this.file, "[]");
    } catch {
      /* ignore */
    }
  }
}
