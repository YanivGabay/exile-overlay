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
