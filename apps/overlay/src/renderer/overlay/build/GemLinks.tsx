import { useState } from "react";
import type { GuideRender } from "../../../shared/guide-render.js";
import { pickSkillSet, prettyTitle } from "../../../shared/skillsets.js";
import { Interactive } from "../layout/Interactive.js";
import { gemColour } from "../guide/Step.js";

/** The build's skill groups for this part of the campaign: usable now vs later, coloured by attribute. */
export function GemLinks({ guide, act, level }: { guide: GuideRender; act: number; level: number | null }) {
  const groups = guide.build?.gemLinks ?? [];
  const titles = [...new Set(groups.map((g) => g.title))];
  const auto = pickSkillSet(titles, act, level);
  const [manual, setManual] = useState<number | null>(null);
  if (!groups.length) return <div className="muted small">The imported build has no gem links.</div>;
  const setIndex = manual ?? auto;
  const title = titles[Math.min(setIndex, titles.length - 1)];
  const inSet = groups.filter((g) => g.title === title);
  const gem = (id: string) => guide.gems[id] ?? { name: id.split("/").at(-1) ?? id, colour: "", isSupport: false, level: 1 };
  const where = (link: { quests: { questId: string }[] }) =>
    link.quests.length ? `Sold after ${guide.quests[link.quests[0].questId]?.name ?? link.quests[0].questId}` : "Not sold to your class";
  const fresh =
    level === null
      ? []
      : inSet.flatMap((g) => [...g.primaryGems, ...g.secondaryGems]).filter((l) => {
          const lv = gem(l.id).level;
          return lv > 1 && lv <= level && lv > level - 2;
        });
  return (
    <div className="gem-links">
      <div className="gem-head">
        <span className="gem-title">{prettyTitle(title)}</span>
        {titles.length > 1 && (
          <Interactive className="gem-nav">
            <button title="Previous gem setup" onClick={() => setManual((setIndex - 1 + titles.length) % titles.length)}>◀</button>
            <span className="small">
              {setIndex + 1}/{titles.length}
              {manual === null ? "" : " (manual)"}
            </span>
            <button title="Next gem setup" onClick={() => setManual((setIndex + 1) % titles.length)}>▶</button>
            {manual !== null && (
              <button title="Follow my level again" onClick={() => setManual(null)}>auto</button>
            )}
          </Interactive>
        )}
      </div>
      {fresh.length > 0 && (
        <div className="gem-fresh">Usable at your level now: {fresh.map((l) => gem(l.id).name).join(", ")}</div>
      )}
      {inSet.map((g, gi) => (
        <ul className="gems" key={gi}>
          {[...g.primaryGems, ...g.secondaryGems].map((l, i) => {
            const info = gem(l.id);
            const locked = level !== null && info.level > level;
            return (
              <li key={l.id + i} className={`${i < g.primaryGems.length ? "primary" : "support"} ${locked ? "locked" : ""}`} title={where(l)}>
                <span className="gem-dot" style={{ background: gemColour(info.colour) }} />
                {info.name}
                {locked && <span className="gem-lvl">level {info.level}</span>}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
