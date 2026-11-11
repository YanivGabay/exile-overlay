import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNewerBundle, isGuideBundle, readBundle, writeBundle, type GuideBundle } from "./bundle.js";

const bundle = (over: Partial<GuideBundle> = {}): GuideBundle => ({
  schema: 1,
  game: "poe1",
  title: "t",
  gameVersion: "3.30",
  version: "a",
  builtAt: "2026-11-11T10:00:00Z",
  routes: [],
  data: { Areas: {} } as GuideBundle["data"],
  ...over,
});

const serve = (body: unknown, ok = true) =>
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));

afterEach(() => vi.unstubAllGlobals());

describe("guide bundles", () => {
  it("recognises bundles and rejects anything else", () => {
    expect(isGuideBundle(bundle())).toBe(true);
    expect(isGuideBundle({ ...bundle(), schema: 2 })).toBe(false);
    expect(isGuideBundle({ ...bundle(), data: {} })).toBe(false);
    expect(isGuideBundle(null)).toBe(false);
  });

  it("reads what it wrote, and returns null for missing or broken files", () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-bundle-"));
    const path = join(dir, "sub", "poe1.json");
    expect(readBundle(path)).toBeNull();
    writeBundle(path, join(dir, "sub"), bundle());
    expect(readBundle(path)?.version).toBe("a");
    writeFileSync(path, "{not json");
    expect(readBundle(path)).toBeNull();
  });

  it("takes a remote bundle only when it is newer and for the same game", async () => {
    const current = bundle();
    serve(bundle({ version: "b", builtAt: "2026-11-11T12:00:00Z" }));
    expect((await fetchNewerBundle("u", current))?.version).toBe("b");
    serve(bundle({ version: "b", builtAt: "2026-11-11T09:00:00Z" }));
    expect(await fetchNewerBundle("u", current)).toBeNull();
    serve(bundle({ builtAt: "2026-11-11T12:00:00Z" }));
    expect(await fetchNewerBundle("u", current)).toBeNull();
    serve(bundle({ version: "b", builtAt: "2026-11-11T12:00:00Z", game: "poe2" }));
    expect(await fetchNewerBundle("u", current)).toBeNull();
    serve({}, false);
    expect(await fetchNewerBundle("u", current)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await fetchNewerBundle("u", current)).toBeNull();
  });
});
