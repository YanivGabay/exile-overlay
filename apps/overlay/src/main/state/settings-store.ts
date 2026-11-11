import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DEFAULT_SETTINGS, deepMerge } from "../../shared/defaults.js";
import type { Settings } from "../../shared/types.js";

/**
 * Settings live in one JSON file in the user's app-data folder, never next to
 * the executable, so the install location never matters. Writes are atomic
 * (temp file + rename) and debounced.
 */
export class SettingsStore {
  private timer: NodeJS.Timeout | null = null;
  private pending: Settings | null = null;

  constructor(private readonly file: string) {}

  static inDir(dir: string) {
    return new SettingsStore(join(dir, "settings.json"));
  }

  load(): Settings {
    try {
      const raw = JSON.parse(readFileSync(this.file, "utf8"));
      return deepMerge(DEFAULT_SETTINGS, raw);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        // Corrupt file: keep a copy for support, start fresh.
        try {
          renameSync(this.file, `${this.file}.corrupt-${Date.now()}`);
        } catch {
          /* ignore */
        }
      }
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  save(settings: Settings) {
    this.pending = settings;
    if (this.timer) return;
    this.timer = setTimeout(() => this.flush(), 400);
  }

  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.pending) return;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.pending, null, 2));
    renameSync(tmp, this.file);
    this.pending = null;
  }
}
