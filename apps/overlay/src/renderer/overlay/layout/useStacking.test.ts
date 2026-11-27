import { describe, expect, it } from "vitest";
import { stackWidgets, type StackItem } from "./useStacking.js";

// The left column at 1280x720 from the 0.1.4 smoke test: a tall gem panel
// (Act 2, gem plan open), Next points, then the tree. Each has a 17px fold tab on top.
const H = 720;
const item = (id: string, yFrac: number, h: number, lead = 17): StackItem => ({ id, x: 6, w: 250, y: yFrac * H, h, chrome: 30, lead });

describe("widget stacking", () => {
  it("keeps the next widget's fold tab off the panel above (720p left column)", () => {
    const gems = item("gems", 0.22, 200);
    const points = item("points", 0.47, 122);
    const tree = item("tree", 0.52, 140);
    const out = stackWidgets([tree, points, gems], H, false);
    const gemsBottom = gems.y + gems.h;
    const pointsTop = out.points.top!;
    expect(pointsTop - points.lead).toBeGreaterThanOrEqual(gemsBottom + 6 - 0.5);
    expect(out.tree.top! - tree.lead).toBeGreaterThanOrEqual(pointsTop + points.h + 6 - 0.5);
  });

  it("leaves a widget alone when its tab already clears the one above", () => {
    const out = stackWidgets([item("gems", 0.1, 100), item("tree", 0.3, 100)], H, false);
    expect(out.tree).toBeUndefined();
  });

  it("moves the next widget only as far as it fits, then cuts the panel above, tab included", () => {
    const out = stackWidgets([item("gems", 0.22, 500), item("tree", 0.6, 250)], H, false);
    expect(out.tree?.top).toBe(H - 250);
    // The gem panel ends 6px above the tree's tab.
    expect(0.22 * H + 30 + out.gems.maxBody!).toBeLessThanOrEqual(H - 250 - 17 - 6 + 0.5);
  });

  it("never moves widgets while editing", () => {
    const out = stackWidgets([item("gems", 0.22, 200), item("points", 0.47, 122)], H, true);
    expect(out.points?.top).toBeUndefined();
  });

  it("ignores side-by-side widgets", () => {
    const right: StackItem = { ...item("guide", 0.25, 400), x: 1000 };
    expect(stackWidgets([item("gems", 0.22, 300), right], H, false)).toEqual({});
  });
});

describe("widget stacking with a long gem plan (measured in the 0.1.4 layout tour)", () => {
  // [id, natural top fraction, full height incl. hidden overflow] per resolution.
  const cases: [string, number, [string, number, number][]][] = [
    ["720", 720, [["gems", 0.22, 640], ["points", 0.47, 122], ["tree", 0.52, 136]]],
    ["1080", 1080, [["gems", 0.22, 765], ["points", 0.47, 145], ["tree", 0.52, 142]]],
    ["1440", 1440, [["gems", 0.22, 934], ["points", 0.47, 131], ["tree", 0.52, 181]]],
    ["ultrawide", 1440, [["gems", 0.22, 918], ["points", 0.47, 157], ["tree", 0.52, 181]]],
  ];
  for (const [name, height, ws] of cases) {
    it(`keeps gems, points, tree in order without overlap at ${name}`, () => {
      const items = ws.map(([id, y, h]) => ({ id, x: 6, w: 300, y: y * height, h, chrome: 30, lead: 17 }));
      const out = stackWidgets(items, height, false);
      const boxes = items.map((i) => {
        const top = out[i.id]?.top ?? i.y;
        const h = out[i.id]?.maxBody !== undefined ? out[i.id].maxBody! + i.chrome : i.h;
        return { id: i.id, top, bottom: top + h, tabTop: top - i.lead };
      });
      for (let k = 1; k < boxes.length; k++) expect(boxes[k].tabTop, `${boxes[k].id} under ${boxes[k - 1].id}`).toBeGreaterThanOrEqual(boxes[k - 1].bottom + 6 - 0.5);
      expect(boxes.at(-1)!.bottom).toBeLessThanOrEqual(height);
      // The long gem plan is what gives way; points and tree are shown whole.
      expect(out.points?.maxBody).toBeUndefined();
      expect(out.tree?.maxBody).toBeUndefined();
    });
  }
});
