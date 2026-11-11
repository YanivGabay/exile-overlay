import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AppLog, describeError } from "./app-log.js";

const dirs: string[] = [];
const fresh = () => {
  const d = mkdtempSync(join(tmpdir(), "eo-log-"));
  dirs.push(d);
  return join(d, "logs");
};
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("AppLog", () => {
  it("creates its folder, writes timestamped lines and indents multi-line errors", () => {
    const log = new AppLog(fresh());
    log.write("error", "boom\n  at x");
    const text = readFileSync(log.file, "utf8");
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2}T\S+ ERROR boom\n {4} {2}at x\n$/);
  });

  it("keeps one old file when it grows past the limit", () => {
    const log = new AppLog(fresh(), 200);
    for (let i = 0; i < 20; i++) log.write("info", `line ${i} ${"x".repeat(20)}`);
    expect(existsSync(`${log.file}.old`)).toBe(true);
    expect(readFileSync(log.file, "utf8").length).toBeLessThan(400);
    expect(log.tail(2)).toContain("line 19");
  });

  it("tail is empty before anything was written", () => {
    expect(new AppLog(fresh()).tail()).toBe("");
  });

  it("describes anything that was thrown", () => {
    expect(describeError(new Error("x")).message).toBe("x");
    expect(describeError("plain").message).toBe("plain");
    expect(describeError({ code: 1 }).message).toContain("code");
  });
});
