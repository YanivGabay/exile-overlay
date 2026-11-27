import { EventEmitter } from "node:events";
import { open, stat } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { StringDecoder } from "node:string_decoder";

export interface TailerOptions {
  /** How many bytes from the end to replay on start (for current area/character). */
  replayBytes?: number;
  pollMs?: number;
  /** Most bytes read per poll; a bigger backlog is read over the next polls. */
  maxReadBytes?: number;
}

/** A "line" longer than this (no newline in sight) is junk, not a log line. */
const MAX_LINE = 64 * 1024;

/**
 * Polls a growing log file and emits complete lines.
 *
 * - On start it reads only the last `replayBytes` (default 2 MiB) and emits
 *   those lines with `replay = true`, so a multi-GB Client.txt costs nothing.
 * - Then it polls the size and reads only appended bytes, at most
 *   `maxReadBytes` (default 4 MiB) per poll, so a huge burst (the PC woke
 *   from sleep, a copied-in log) never needs one huge buffer.
 * - A run of bytes with no newline longer than 64 KiB is dropped.
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
  private readonly maxReadBytes: number;
  size = 0;

  constructor(
    readonly path: string,
    options: TailerOptions = {},
  ) {
    super();
    this.replayBytes = options.replayBytes ?? 2 * 1024 * 1024;
    this.pollMs = options.pollMs ?? 250;
    this.maxReadBytes = options.maxReadBytes ?? 4 * 1024 * 1024;
  }

  async start() {
    const { size } = await stat(this.path);
    this.size = size;
    const from = Math.max(0, size - this.replayBytes);
    this.offset = from;
    const text = await this.readRange(from, size);
    // When starting mid-file, drop the first (probably partial) line.
    const lines = this.splitLines(text, from > 0);
    if (lines.length && !this.stopped) this.emit("lines", lines, true);
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
        const text = await this.readRange(this.offset, Math.min(size, this.offset + this.maxReadBytes));
        const lines = this.splitLines(text, false);
        // stop() may have been called while we were reading.
        if (lines.length && !this.stopped) this.emit("lines", lines, false);
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
    if (this.remainder.length > MAX_LINE) this.remainder = "";
    if (dropFirst) all.shift();
    return all.filter((l) => l.length > 0);
  }
}
