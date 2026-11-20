import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyBuild, compileGuide, gemPlan, parsePobXml, type GameData } from "./index.js";

const bundle = JSON.parse(
  readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8"),
) as { routes: string[]; data: GameData.Bundle };

const gem = (id: string) => `<Gem gemId="Metadata/Items/Gems/${id}"/>`;
const pob = (cls: string, gems: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build className="${cls}" bandit="None"/>
  <Skills><Skill enabled="true">${gems.map(gem).join("")}</Skill></Skills>
</PathOfBuilding>`;

const planFor = (cls: string, gems: string[], library = false) => {
  const build = parsePobXml(pob(cls, gems), bundle.data);
  const options = { leagueStart: true, library };
  const guide = applyBuild(compileGuide(bundle.routes, bundle.data, { ...options } as never), build, bundle.data, options);
  return gemPlan(guide, build, bundle.data);
};
const short = (id: string) => id.split("/").at(-1);

describe("gemPlan", () => {
  const plan = planFor("Witch", [
    "SkillGemFireball",
    "SupportGemArcaneSurge",
    "SkillGemRaiseZombie",
    "SupportGemMinionDamage",
    "SkillGemSummonRagingSpirit",
    "SkillGemFreezingPulse",
    "SkillGemPortal",
    "SupportGemEnlighten",
  ]);
  const act1 = plan.acts.find((a) => a.act === 1)!;
  const item = (id: string) => plan.acts.flatMap((a) => a.items).find((i) => short(i.gemId) === id);

  it("starts with the class's start and chest gems", () => {
    expect(act1.items.slice(0, 2).map((i) => [short(i.gemId), i.how])).toEqual([
      ["SkillGemFireball", "start"],
      ["SupportGemArcaneSurge", "chest"],
    ]);
  });

  it("takes quest rewards from the quest NPC and buys the rest from vendors", () => {
    expect(item("SkillGemRaiseZombie")).toMatchObject({ how: "quest", npc: "Tarkleigh", questId: "a1q1" });
    expect(item("SupportGemMinionDamage")).toMatchObject({ how: "quest", npc: "Nessa", questId: "a1q2" });
    expect(item("SkillGemSummonRagingSpirit")).toMatchObject({ how: "quest", npc: "Tarkleigh", questId: "a1q4" });
    // Enemy at the Gate gives one gem; the second from its list is bought from Nessa.
    expect(item("SkillGemFreezingPulse")).toMatchObject({ how: "vendor", npc: "Nessa", questId: "a1q1", count: 1 });
  });

  it("groups by act in route order and lists known gems the campaign never offers", () => {
    expect(plan.acts.map((a) => a.act)).toEqual([...plan.acts.map((a) => a.act)].sort((a, b) => a - b));
    // Portal only drops; Enlighten isn't in the game data at all, so it isn't listed.
    expect(plan.unavailable.map(short)).toEqual(["SkillGemPortal"]);
    const all = plan.acts.flatMap((a) => a.items.map((i) => i.gemId));
    expect(new Set(all).size).toBe(all.length);
  });

  it("follows the route options: Siosa sells to every class only after the Library quest", () => {
    const cleave = (library: boolean) =>
      planFor("Witch", ["SkillGemFireball", "SkillGemCleave"], library)
        .acts.flatMap((a) => a.items.map((i) => ({ ...i, act: a.act })))
        .find((i) => short(i.gemId) === "SkillGemCleave");
    expect(cleave(false)).toMatchObject({ how: "vendor", npc: "Lilly Roth", act: 6 });
    expect(cleave(true)).toMatchObject({ how: "vendor", npc: "Siosa", act: 3 });
  });
});
