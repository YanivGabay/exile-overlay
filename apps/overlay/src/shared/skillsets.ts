/**
 * Pick the PoB skill set for where the player is, from its title:
 * "Act 1-3", "Act 4", "Level 12-28", "lvl 38+", "1-12". Falls back to the first set.
 */
export function pickSkillSet(titles: string[], act: number, level: number | null): number {
  let best = -1;
  titles.forEach((title, i) => {
    if (best !== -1) return;
    const t = title.toLowerCase();
    const nums = [...t.matchAll(/\d+/g)].map((m) => Number(m[0]));
    if (!nums.length) return;
    const lo = nums[0];
    const hi = t.includes("+") ? Infinity : nums[1] ?? nums[0];
    const value = /\bact/.test(t) ? act : level;
    if (value !== null && value >= lo && value <= hi) best = i;
  });
  return best === -1 ? 0 : best;
}

