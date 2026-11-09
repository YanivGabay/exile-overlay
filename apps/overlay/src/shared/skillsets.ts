/** Skill sets use the same title rules as tree specs (see pickByTitle). */
export { pickByTitle as pickSkillSet } from "@exile-overlay/route-engine";

/** PoB set titles as players read them: "LvLing Tree lvl 12 {3}" → "Tree level 12". */
export function prettyTitle(title: string): string {
  let s = title.replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^(lv?l?ing|leveling|levelling)\s+tree\b\s*/i, "Tree ");
  s = s.replace(/\blvl\s*(\d+)/gi, "level $1").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
