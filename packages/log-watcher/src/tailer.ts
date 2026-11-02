import { EventEmitter } from "node:events";
import { open, stat } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { StringDecoder } from "node:string_decoder";

export interface TailerOptions {
  /** How many bytes from the end to replay on start (for current area/character). */
  replayBytes?: number;
  pollMs?: number;
}

/**
 * Polls a growing log file and emits complete lines.
 *
 * - On start it reads only the last `replayBytes` (default 2 MiB) and emits
 *   those lines with `replay = true`, so a multi-GB Client.txt costs nothing.
 * - Then it polls the size and reads only appended bytes.
 * - If the file shrinks (truncated or replaced) it starts over from 0.
 *
 * Polling `stat` is used instead of fs.watch, which misses appends on
 * Windows when another process holds the file open.
 */
export class LogTailer extends EventEmitter<{
  lines: [lines: string[], replay: boolean];
  error: [Error];
}> {
  private offset = 0;
  private remainder = "";
  private decoder = new StringDecoder("utf8");
  private timer: NodeJS.Timeout | null = null;
  private reading = false;
  private stopped = false;
  private readonly replayBytes: number;
  private readonly pollMs: number;
  size = 0;

  constructor(
    readonly path: string,
    options: TailerOptions = {},
  ) {
    super();
    this.replayBytes = options.replayBytes ?? 2 * 1024 * 1024;
    this.pollMs = options.pollMs ?? 250;
  }

  async start() {
    const { size } = await stat(this.path);
    this.size = size;
    const from = Math.max(0, size - this.replayBytes);
    this.offset = from;
    const text = await this.readRange(from, size);
    // When starting mid-file, drop the first (probably partial) line.
    const lines = this.splitLines(text, from > 0);
    if (lines.length) this.emit("lines", lines, true);
    this.schedule();
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule() {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.poll(), this.pollMs);
  }

  private async poll() {
    if (this.reading) return this.schedule();
    this.reading = true;
    try {
      const { size } = await stat(this.path);
      this.size = size;
      if (size < this.offset) {
        this.offset = 0;
        this.remainder = "";
        this.decoder = new StringDecoder("utf8");
      }
      if (size > this.offset) {
        const text = await this.readRange(this.offset, size);
        const lines = this.splitLines(text, false);
        if (lines.length) this.emit("lines", lines, false);
      }
    } catch (err) {
      this.emit("error", err as Error);
    } finally {
      this.reading = false;
      this.schedule();
    }
  }

  private async readRange(from: number, to: number): Promise<string> {
    if (to <= from) return "";
    let fh: FileHandle | null = null;
    try {
      fh = await open(this.path, "r");
      const length = to - from;
      const buf = Buffer.alloc(length);
      const { bytesRead } = await fh.read(buf, 0, length, from);
      this.offset = from + bytesRead;
      return this.decoder.write(buf.subarray(0, bytesRead));
    } finally {
      await fh?.close();
    }
  }

  private splitLines(text: string, dropFirst: boolean): string[] {
    const all = (this.remainder + text).split(/\r?\n/);
    this.remainder = all.pop() ?? "";
    if (dropFirst) all.shift();
    return all.filter((l) => l.length > 0);
  }
}
