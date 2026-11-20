import { useState } from "react";
import { questsDone, type GemPlanItem, type GuideProgress } from "@exile-overlay/route-engine";
import type { GuideRender } from "../../../shared/guide-render.js";
import { byQuest, groupLabel, upcomingGems } from "../../../shared/gem-plan-view.js";
import { Interactive } from "../layout/Interactive.js";
import { gemColour } from "../guide/Step.js";

/**
 * The build's gems still to come in this act (or the next act that has any):
 * the next two quests: the reward to take and what to buy after it, from whom.
 * "All acts" opens the whole plan.
 */
/** Quests shown before "all acts", so the panel stays short mid-act. */
const NEXT_QUESTS = 2;

export function UpcomingGems({ guide, act, progress }: { guide: GuideRender; act: number; progress: GuideProgress }) {
  const [all, setAll] = useState(false);
  const plan = guide.build?.plan;
  if (!plan || plan.acts.length === 0) return null;
  const next = upcomingGems(plan, act, questsDone(guide, progress));
  const name = (i: GemPlanItem) => guide.gems[i.gemId]?.name ?? i.gemId.split("/").at(-1);
  const gems = (items: GemPlanItem[]) =>
    items.map((i, n) => (
      <span key={i.gemId} className="plan-gem">
        {n > 0 && ", "}
        <span className="gem-dot" style={{ background: gemColour(guide.gems[i.gemId]?.colour ?? "") }} />
        {name(i)}
        {i.count > 1 && ` ×${i.count}`}
      </span>
    ));
  const questName = (id: string) => guide.quests[id]?.name ?? id;
  const rows = (items: GemPlanItem[], limit = Infinity) =>
    byQuest(items).slice(0, limit).map((g) => (
      <div key={g.key} className="plan-npc">
        <span className="muted">{groupLabel(g, questName)}:</span>{" "}
        {g.take.length > 0 && (
          <>
            {g.questId ? "take " : ""}
            {g.take.length > 1 && g.takeFrom?.includes(" or ")
              ? g.take.map((i, n) => (
                  <span key={i.gemId}>
                    {n > 0 && ", "}
                    {gems([i])}
                    <span className="muted"> ({i.npc})</span>
                  </span>
                ))
              : gems(g.take)}
            {g.takeFrom && !g.takeFrom.includes(" or ") && g.takeFrom !== g.buyFrom && <span className="muted"> ({g.takeFrom})</span>}
          </>
        )}
        {g.take.length > 0 && g.buy.length > 0 && "; "}
        {g.buy.length > 0 && <>buy {gems(g.buy)}</>}
        {g.buyFrom && <span className="muted"> ({g.buyFrom})</span>}
      </div>
    ));
  return (
    <div className="gem-plan">
      <div className="plan-head">
        {all ? "Gem plan" : next ? (next.act === act ? "Gems in this act" : `Next gems: Act ${next.act}`) : "No more gems to take or buy"}
        <Interactive className="inline">
          <button className="copy-btn" title={all ? "Show only the gems still to come" : "Show the gem plan for every act"} onClick={() => setAll(!all)}>
            {all ? "this act" : "all acts"}
          </button>
        </Interactive>
      </div>
      {all ? (
        <>
          {plan.acts.map((a) => (
            <div key={a.act} className={`plan-act ${a.act < act ? "past" : ""}`}>
              <div className="plan-act-name">Act {a.act}</div>
              {rows(a.items)}
            </div>
          ))}
          {plan.unavailable.length > 0 && (
            <div className="plan-npc muted">Not given or sold in the campaign: {plan.unavailable.map((id) => guide.gems[id]?.name ?? id).join(", ")}</div>
          )}
        </>
      ) : (
        next && (
          <>
            {rows(next.items, NEXT_QUESTS)}
            {byQuest(next.items).length > NEXT_QUESTS && (
              <div className="plan-npc muted small">+{byQuest(next.items).length - NEXT_QUESTS} more quests with gems in Act {next.act}</div>
            )}
          </>
        )
      )}
    </div>
  );
}
