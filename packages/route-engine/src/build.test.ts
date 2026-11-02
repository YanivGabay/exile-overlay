import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyBuild, compileGuide, parsePobXml, type GameData } from "./index.js";

const bundle = JSON.parse(
  readFileSync(new URL("../../../guides-snapshot/poe1.json", import.meta.url), "utf8"),
) as { routes: string[]; data: GameData.Bundle };

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build className="Marauder" ascendClassName="Juggernaut" bandit="Alira" level="90"/>
  <Skills activeSkillSet="1">
    <SkillSet id="1" title="^xFF0000Leveling">
      <Skill enabled="true" label="Main">
        <Gem gemId="Metadata/Items/Gems/SkillGemSunder" nameSpec="Sunder"/>
        <Gem gemId="Metadata/Items/Gems/SupportGemRuthless" nameSpec="Ruthless"/>
      </Skill>
      <Skill enabled="true">
        <Gem gemId="Metadata/Items/Gems/SkillGemLeapSlam" nameSpec="Leap Slam"/>
      </Skill>
      <Skill enabled="false">
        <Gem gemId="Metadata/Items/Gems/SkillGemGroundSlam" nameSpec="Ground Slam"/>
      </Skill>
    </SkillSet>
  </Skills>
  <Tree activeSpec="1">
    <Spec title="Act 2" treeVersion="3_29"><URL>https://www.pathofexile.com/passive-skill-tree/AAAA</URL></Spec>
  </Tree>
</PathOfBuilding>`;

describe("parsePobXml", () => {
  const build = parsePobXml(XML, bundle.data);

  it("reads class, bandit, gems and trees", () => {
    expect(build.className).toBe("Marauder");
    expect(build.ascendancy).toBe("Juggernaut");
    expect(build.bandit).toBe("Alira");
    expect(build.requiredGems.map((g) => g.id.split("/").at(-1))).toEqual([
      "SkillGemSunder",
      "SupportGemRuthless",
      "SkillGemLeapSlam",
    ]);
    expect(build.gemLinks[0].title).toBe("Leveling");
    expect(build.gemLinks[0].secondaryGems).toHaveLength(1);
    expect(build.trees[0]).toMatchObject({ name: "Act 2", version: "3_29" });
  });

  it("rejects non-PoB XML", () => {
    expect(() => parsePobXml("<foo/>", bundle.data)).toThrow();
  });

  it("adds gem steps with stable ids and a vendor search string", () => {
    const guide = compileGuide(bundle.routes, bundle.data);
    const withGems = applyBuild(guide, build, bundle.data);
    const gemSteps = withGems.steps.filter((s) => s.step.type === "gem_step");
    // Ruthless is the Marauder's Act 1 chest gem, so only Sunder and Leap Slam need steps.
    expect(gemSteps.map((s) => s.id.split("~").at(-1)).sort()).toEqual(["SkillGemLeapSlam", "SkillGemSunder"]);
    expect(new Set(withGems.steps.map((s) => s.id)).size).toBe(withGems.steps.length);
    const again = applyBuild(compileGuide(bundle.routes, bundle.data), build, bundle.data);
    expect(again.steps.map((s) => s.id)).toEqual(withGems.steps.map((s) => s.id));
    const withCopy = withGems.steps.find(
      (s) => s.step.type === "fragment_step" && s.step.parts.some((p) => typeof p !== "string" && p.type === "copy"),
    );
    expect(withCopy).toBeDefined();
    // Edges are untouched, so progress stays valid.
    expect(withGems.edges).toEqual(guide.edges);
  });

  it("gems-only keeps area-changing steps", () => {
    const guide = compileGuide(bundle.routes, bundle.data);
    const slim = applyBuild(guide, build, bundle.data, { gemsOnly: true, leagueStart: true, library: false });
    const edgeSteps = slim.steps.filter((s) => s.edgeIndex !== null).length;
    expect(edgeSteps).toBe(guide.steps.filter((s) => s.edgeIndex !== null).length);
    expect(slim.steps.length).toBeLessThan(guide.steps.length);
  });
});
