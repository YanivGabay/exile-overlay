import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compileGuide,
  fragmentsToText,
  onAreaEntered,
  resyncTo,
  stepEdge,
  viewAt,
  INITIAL_PROGRESS,
  type GameData,
} from "./index.js";

const bundle = JSON.parse(
  readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8"),
) as { routes: string[]; data: GameData.Bundle };

const guide = compileGuide(bundle.routes, bundle.data);

describe("compileGuide", () => {
  it("parses the bundled PoE1 route without errors", () => {
    expect(guide.logs.filter((l) => l.type === "error")).toEqual([]);
    expect(guide.steps.length).toBeGreaterThan(300);
    expect(guide.edges[0]).toBe("1_1_1");
  });

  it("gives every step a unique, stable id", () => {
    const ids = guide.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const again = compileGuide(bundle.routes, bundle.data);
    expect(again.steps.map((s) => s.id)).toEqual(ids);
  });

  it("keeps ids of untouched steps when another step changes", () => {
    const edited = [...bundle.routes];
    edited[0] = edited[0].replace("Find and kill {kill|Hillock}", "Kill {kill|Hillock} quickly");
    const changed = compileGuide(edited, bundle.data);
    const before = new Set(guide.steps.map((s) => s.id));
    const after = changed.steps.map((s) => s.id);
    const kept = after.filter((id) => before.has(id)).length;
    expect(kept).toBe(after.length - 1);
  });

  it("renders readable text", () => {
    const first = guide.steps[0];
    expect(fragmentsToText(first.step.parts, bundle.data)).toMatch(/Hillock/);
  });
});

describe("progress", () => {
  it("advances on the next area and ignores detours", () => {
    let p = INITIAL_PROGRESS;
    p = onAreaEntered(guide, p, guide.edges[1]);
    expect(p.activeEdge).toBe(1);
    p = onAreaEntered(guide, p, "HideoutSomething");
    expect(p.activeEdge).toBe(1);
    p = onAreaEntered(guide, p, guide.edges[0]);
    expect(p.activeEdge).toBe(1);
  });

  it("jumps ahead when a zone was missed", () => {
    const p = onAreaEntered(guide, INITIAL_PROGRESS, guide.edges[4]);
    expect(p.activeEdge).toBe(4);
  });

  it("re-syncs forward and backward", () => {
    const far = guide.edges.length - 5;
    let p = resyncTo(guide, INITIAL_PROGRESS, guide.edges[far]);
    expect(guide.edges[p.activeEdge]).toBe(guide.edges[far]);
    p = resyncTo(guide, p, "1_1_2");
    expect(guide.edges[p.activeEdge]).toBe("1_1_2");
    expect(stepEdge(guide, { activeEdge: 0, completed: [] }, -1).activeEdge).toBe(0);
  });

  it("shows current steps and the next area step", () => {
    const view = viewAt(guide, INITIAL_PROGRESS);
    expect(view.current.length).toBeGreaterThan(0);
    expect(view.next?.edgeIndex).toBe(1);
    expect(view.sectionName).toBe("Act 1");
  });
});
