/**
 * What the overlay makes of a PoB: gem steps on the route, the skill set and
 * tree step it shows at sample levels. Run: tsx scripts/check-build.ts <pob.xml> [preset]
 */
import { readFileSync } from "node:fs";
import { stepGroups, applyBuild, compileGuide, parsePobXml, pickByTitle, treeStep, type GameData, type TreeTable } from "../packages/route-engine/src/index.js";

const bundle = JSON.parse(readFileSync(new URL("../guides-snapshot/poe1.json", import.meta.url), "utf8")) as {
  routes: string[];
  data: GameData.Bundle;
  tree: TreeTable;
  campaign: { presets: { id: string; options: Parameters<typeof compileGuide>[2] }[] };
};
const build = parsePobXml(readFileSync(process.argv[2], "utf8"), bundle.data);
const preset = bundle.campaign.presets.find((p) => p.id === (process.argv[3] ?? "league-start"))!;
console.log(`${build.className} / ${build.ascendancy}, bandit ${build.bandit}, ${build.requiredGems.length} gems, ${build.gemLinks.length} links, ${build.trees.length} trees`);
const guide = applyBuild(compileGuide(bundle.routes, bundle.data, { ...preset.options, bandit: build.bandit }), build, bundle.data, {
  leagueStart: preset.options.leagueStart,
  library: preset.options.library,
});
const areas = bundle.data.Areas;
let n = 0;
const groups = stepGroups(guide);
for (const [i, s] of guide.steps.entries())
  if (s.step.type === "gem_step") {
    const edge = guide.edges[groups[i]];
    console.log(`  gem: ${bundle.data.Gems[s.step.requiredGem.id]?.name ?? s.step.requiredGem.id}  (${s.step.rewardType}) ~ ${areas[edge]?.name ?? "?"}`);
    n++;
  }
console.log(`${n} gem steps on the route`);
const setTitles = [...new Set(build.gemLinks.map((g) => g.title))];
for (const [act, level] of [[1, 5], [2, 15], [3, 28], [5, 45], [8, 60], [10, 68], [10, 72], [10, 82], [10, 93]] as const) {
  const t = treeStep(build.trees, bundle.tree, act, level);
  console.log(
    `act ${act} lvl ${level}: gems "${setTitles[pickByTitle(setTitles, act, level)]}" | tree "${t?.currentName}" -> "${t?.nextName}" ` +
      `(+${t?.add.notables.map((x) => x.name).join(", ")}${t?.add.keystones.length ? "; key " + t.add.keystones.map((x) => x.name).join(", ") : ""}${t?.add.ascendancy.length ? "; asc " + t.add.ascendancy.map((x) => x.name).join(", ") : ""}${t?.remove.length ? "; respec -" + t.remove.filter((x) => x.kind !== "s").map((x) => x.name).join(", ") : ""})`,
  );
}
