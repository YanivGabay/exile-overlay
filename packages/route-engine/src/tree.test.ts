import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { availablePoints, parsePobXml, pickByTitle, treeStep, type GameData, type TreeTable } from "./index.js";

const table = JSON.parse(readFileSync(new URL("../test-fixtures/tree-3_29_1.json", import.meta.url), "utf8")) as TreeTable;
const bundle = JSON.parse(readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8")) as { data: GameData.Bundle };

const XML = `<PathOfBuilding><Build className="Marauder" bandit="None"/><Skills/>
<Tree activeSpec="1">
  <Spec title="Level 1-20" treeVersion="3_29" nodes="94,127"><URL>x</URL></Spec>
  <Spec title="Level 20-40" treeVersion="3_29" nodes="94,127,223,31961,12926,1734,193,55485"><URL>y</URL></Spec>
  <Spec title="Level 40+" treeVersion="3_29" nodes="94,223,31961,12926,1734,193,55485"><URL>z</URL></Spec>
</Tree></PathOfBuilding>`;

describe("passive tree", () => {
  const build = parsePobXml(XML, bundle.data);
  it("reads spec nodes from PoB", () => {
    expect(build.trees.map((t) => t.nodes?.length)).toEqual([2, 8, 7]);
  });
  it("picks the spec for your level and names what the next one adds", () => {
    const s = treeStep(build.trees, table, 2, 12)!;
    expect(s.currentName).toBe("Level 1-20");
    expect(s.nextName).toBe("Level 20-40");
    expect(s.add.keystones.map((n) => n.name).sort()).toEqual(["Iron Grip", "Resolute Technique"]);
    expect(s.add.notables.map((n) => n.name)).toEqual(["Constitution"]);
    expect(s.add.ascendancy.map((n) => n.name)).toContain("Unflinching");
    expect(s.add.small).toBe(1);
    expect(s.currentPoints).toBe(2);
    expect(s.nextPoints).toBe(6);
  });
  it("reports refunds between specs", () => {
    const s = treeStep(build.trees, table, 5, 30)!;
    expect(s.remove.map((n) => n.id)).toEqual(["127"]);
  });
  it("counts available points", () => {
    expect(availablePoints(12, 2)).toBe(13);
    expect(pickByTitle(["Act 1-3", "Act 4+"], 4, 40)).toBe(1);
  });
});

describe("shipped passive tree", () => {
  const shipped = (JSON.parse(readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8")) as { tree: TreeTable }).tree;

  it("is at least as new as the 3.29.1 fixture and keeps every node id, so imported builds still match", () => {
    expect(shipped.version >= table.version).toBe(true);
    const missing = Object.keys(table.nodes).filter((id) => !(id in shipped.nodes));
    expect(missing).toEqual([]);
  });

  it("keeps keystone and notable names readable (name, kind, stats)", () => {
    const notables = Object.values(shipped.nodes).filter((n) => n[1] === "n" || n[1] === "k");
    expect(notables.length).toBeGreaterThan(800);
    for (const n of notables) expect(typeof n[0] === "string" && n[0].length > 0).toBe(true);
  });
});
