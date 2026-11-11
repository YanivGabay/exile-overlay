import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { format } from "node:util";

/**
 * The app's own log (not the game's): everything printed with console.* plus
 * caught errors, in <userData>/logs/exile-overlay.log. One old file is kept
 * when it passes `maxBytes`, so the folder never grows past ~2 MB.
 */
export class AppLog {
  readonly file: string;
  private writing = false;

  constructor(
    readonly dir: string,
    private readonly maxBytes = 1_000_000,
  ) {
    this.file = join(dir, "exile-overlay.log");
    mkdirSync(dir, { recursive: true });
  }

  write(level: "info" | "warn" | "error", text: string) {
    if (this.writing) return; // a failing write must not log itself forever
    this.writing = true;
    try {
      try {
        if (statSync(this.file).size > this.maxBytes) renameSync(this.file, `${this.file}.old`);
      } catch {
        /* no file yet */
      }
      const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${text.replace(/\r?\n/g, "\n    ")}\n`;
      appendFileSync(this.file, line);
    } catch {
      /* disk full or folder gone: logging is best effort */
    } finally {
      this.writing = false;
    }
  }

  /** The last `lines` lines, for support reports. */
  tail(lines = 60): string {
    try {
      const text = readFileSync(this.file, "utf8");
      return text.split("\n").slice(-lines - 1).join("\n");
    } catch {
      return "";
    }
  }

  /** Mirror console.log/warn/error into the file (the console still prints). */
  captureConsole() {
    for (const [method, level] of [
      ["log", "info"],
      ["info", "info"],
      ["warn", "warn"],
      ["error", "error"],
    ] as const) {
      const original = console[method].bind(console);
      console[method] = (...args: unknown[]) => {
        original(...args);
        this.write(level, format(...args));
      };
    }
  }
}

/** One line for an unknown thrown value. */
export function describeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message || err.name, stack: err.stack };
  return { message: typeof err === "string" ? err : format(err) };
}
