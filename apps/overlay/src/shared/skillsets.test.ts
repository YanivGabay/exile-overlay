import { describe, expect, it } from "vitest";
import { pickSkillSet } from "./skillsets.js";

describe("pickSkillSet", () => {
  it("matches act ranges", () => {
    const t = ["Act 1-3", "Act 4-6", "Act 7+"];
    expect(pickSkillSet(t, 2, 10)).toBe(0);
    expect(pickSkillSet(t, 5, 40)).toBe(1);
    expect(pickSkillSet(t, 9, 60)).toBe(2);
  });
  it("matches level ranges and plain numbers", () => {
    expect(pickSkillSet(["Level 1-12", "lvl 12-28", "28+"], 3, 20)).toBe(1);
    expect(pickSkillSet(["1-12", "13-30"], 1, 5)).toBe(0);
  });
  it("falls back to the first set", () => {
    expect(pickSkillSet(["Leveling", "Endgame"], 3, 20)).toBe(0);
    expect(pickSkillSet(["Level 50+"], 1, null)).toBe(0);
  });
});

describe("pickSkillSet with real PoB titles (Maxroll AWoRA)", () => {
  const sets = ["Act 1", "Act 2", "Act 3", "Act 4-10", "Lvl70 after 3rd lab", "lvl 80-92 Early Rare 6 link {1}", "Early Covenant {9}", "Mid {5}"];
  const specs = ["LvLing Tree lvl 12", "LvLing Tree lvl 24", "LvLing Tree lvl 36", "LvLing Tree lvl 80 (Respec 18 points)", "LvLing Tree lvl 92 (Respec 11) {1}"];
  it("follows acts, then level milestones after the campaign", () => {
    expect(pickSkillSet(sets, 1, 5)).toBe(0);
    expect(pickSkillSet(sets, 6, 45)).toBe(3);
    expect(pickSkillSet(sets, 10, 72)).toBe(4);
    expect(pickSkillSet(sets, 10, 85)).toBe(5);
    expect(pickSkillSet(sets, 10, 95)).toBe(5); // past the last range: it keeps applying; gear tiers have no level
  });
  it("treats single levels as milestones and ignores tags and respec notes", () => {
    expect(pickSkillSet(specs, 1, 5)).toBe(0);
    expect(pickSkillSet(specs, 3, 30)).toBe(1);
    expect(pickSkillSet(specs, 10, 85)).toBe(3);
    expect(pickSkillSet(specs, 10, 93)).toBe(4);
  });
});
