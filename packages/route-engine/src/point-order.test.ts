import { describe, expect, it } from "vitest";
import { nextPoints, pointOrder } from "./point-order.js";
import type { TreeTable } from "./tree.js";

// WITCH(1) ─ a(2) ─ b(3) ─ Far Notable(4) ─ Mastery(9)
//    │                              └─ e(10)
//    └─ c(5) ─ Close Notable(6) ─ d(7) ─ Keystone(8)
// 20/21 are ascendancy nodes, 65600 a cluster jewel node (not in the table).
const table: TreeTable = {
  version: "test",
  nodes: {
    "1": ["WITCH", "c"],
    "2": ["Intelligence", "s"],
    "3": ["Intelligence", "s"],
    "4": ["Far Notable", "n", ["+10 to Intelligence"]],
    "5": ["Life", "s"],
    "6": ["Close Notable", "n", ["8% increased maximum Life"]],
    "7": ["Mana", "s"],
    "8": ["Keystone", "k", ["Something big"]],
    "9": ["Some Mastery", "m"],
    "10": ["Energy Shield", "s"],
    "20": ["Necromancer", "x", [], "Necromancer"],
    "21": ["Asc Notable", "a", [], "Necromancer"],
  },
  starts: { Witch: "1", Marauder: "99" },
  links: [1, 2, 2, 3, 3, 4, 4, 9, 4, 10, 1, 5, 5, 6, 6, 7, 7, 8],
};

const trees = [
  { name: "Level 1-12", version: "3_30", url: "", nodes: ["1", "20", "2", "3", "4", "5", "6", "65600"] },
  { name: "Level 12+", version: "3_30", url: "", nodes: ["1", "20", "21", "2", "3", "4", "9", "10"] },
];

const ids = (es: { node: { id: string } }[]) => es.map((e) => e.node.id);

describe("pointOrder", () => {
  const order = pointOrder(table, "Witch", trees)!;

  it("walks the cheapest path to the nearest notable first, then refunds what the next tree drops", () => {
    expect(order.map((e) => `${e.type === "take" ? "+" : "-"}${e.node.id}`)).toEqual(["+5", "+6", "+2", "+3", "+4", "-5", "-6", "+9", "+10"]);
  });

  it("says which notable a small node leads to", () => {
    expect(order[0].goal?.name).toBe("Close Notable");
    expect(order[2].goal?.name).toBe("Far Notable");
    expect(order.at(-1)!.goal).toBeNull();
  });

  it("skips the class start, ascendancy nodes and unknown cluster nodes", () => {
    const all = ids(order);
    for (const id of ["1", "20", "21", "65600"]) expect(all).not.toContain(id);
  });

  it("needs links and the class's start node", () => {
    expect(pointOrder({ ...table, links: undefined }, "Witch", trees)).toBeNull();
    expect(pointOrder(table, "Shadow", trees)).toBeNull();
  });
});

describe("nextPoints", () => {
  const order = pointOrder(table, "Witch", trees)!;

  it("starts at the beginning with no points", () => {
    expect(ids(nextPoints(order, 0).next)).toEqual(["5", "6", "2"]);
  });

  it("continues after the points the player has", () => {
    const n = nextPoints(order, 2);
    expect(n.spent).toBe(2);
    expect(ids(n.next)).toEqual(["2", "3", "4"]);
    expect(n.refund).toEqual([]);
  });

  it("shows the respec once the first tree is complete", () => {
    const n = nextPoints(order, 5);
    expect(ids(n.refund)).toEqual(["5", "6"]);
    expect(ids(n.next)).toEqual(["9", "10"]);
    expect(n.done).toBe(false);
  });

  it("is done once every tree is allocated", () => {
    const n = nextPoints(order, 9);
    expect(n.next).toEqual([]);
    expect(n.done).toBe(true);
    expect(n.spent).toBe(5);
  });
});
