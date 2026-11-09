import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHANGELOG, compareVersions, whatsNewSince } from "./changelog.js";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };

describe("changelog", () => {
  it("has an entry for the version being built, newest first, plain sentences", () => {
    expect(CHANGELOG[0].version).toBe(pkg.version);
    for (let i = 1; i < CHANGELOG.length; i++) expect(compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version)).toBe(1);
    for (const e of CHANGELOG) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.items.length).toBeGreaterThan(0);
      for (const item of e.items) expect(item).toMatch(/^[A-Z].*\.$/);
    }
  });

  it("compares versions", () => {
    expect(compareVersions("0.1.10", "0.1.9")).toBe(1);
    expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0-beta.1", "1.0.0")).toBe(-1);
    expect(compareVersions("1.0.0-beta.2", "1.0.0-beta.1")).toBe(1);
    expect(compareVersions("0.2", "0.2.0")).toBe(0);
  });

  it("shows only entries the player hasn't seen, never on a fresh install", () => {
    const log = [
      { version: "0.3.0", date: "2026-12-01", items: ["C."] },
      { version: "0.2.0", date: "2026-11-20", items: ["B."] },
      { version: "0.1.0", date: "2026-11-13", items: ["A."] },
    ];
    expect(whatsNewSince("0.1.0", "0.3.0", log).map((e) => e.version)).toEqual(["0.3.0", "0.2.0"]);
    expect(whatsNewSince("0.1.0", "0.2.0", log).map((e) => e.version)).toEqual(["0.2.0"]);
    expect(whatsNewSince("0.3.0", "0.3.0", log)).toEqual([]);
    expect(whatsNewSince(null, "0.3.0", log)).toEqual([]);
    expect(whatsNewSince(undefined, "0.3.0", log)).toEqual([]);
  });
});
