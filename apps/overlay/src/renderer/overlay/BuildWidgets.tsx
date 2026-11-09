import { prettyTitle } from "../../shared/skillsets.js";
import { useMemo, useState } from "react";
import { availablePoints, questsDone, searchStrings, treeStep, type GuideProgress, type NodeInfo } from "@exile-overlay/route-engine";
import { api } from "../common/api.js";
import { Interactive } from "./Navigation.js";
import type { GuideRender } from "../../shared/guide-render.js";

/**
 * In town: every build gem a vendor will now sell you, grouped by NPC, with
 * one copy-search per 250 characters. Tick a gem off once you have it.
 */
export function ShoppingList({
  guide,
  progress,
  dismissed,
  inTown,
}: {
  guide: GuideRender;
  progress: GuideProgress;
  dismissed: Set<string>;
  inTown: boolean;
}) {
  const list = useMemo(() => {
    if (!guide.build || !inTown) return [];
    const done = questsDone(guide, progress);
    const seen = new Set<string>();
    const out: { gemId: string; name: string; npc: string }[] = [];
    for (const v of guide.build.vendorGems) {
      if (seen.has(v.gemId) || !done.has(v.questId) || dismissed.has(`gem:${v.gemId}`)) continue;
      seen.add(v.gemId);
      out.push({ gemId: v.gemId, name: guide.gems[v.gemId]?.name ?? v.gemId, npc: v.npc });
    }
    return out;
  }, [guide, progress, dismissed, inTown]);
  if (!list.length) return null;
  const byNpc = new Map<string, typeof list>();
  for (const g of list) byNpc.set(g.npc, [...(byNpc.get(g.npc) ?? []), g]);
  const searches = searchStrings(list.map((g) => g.name));
  return (
    <div className="shopping">
      <div className="shop-head">
        Gems you can buy now
        <Interactive className="inline">
          {searches.map((s, i) => (
            <button key={i} className="copy-btn" title={s} onClick={() => void api.send({ type: "copyText", text: s })}>
              copy search{searches.length > 1 ? ` ${i + 1}` : ""}
            </button>
          ))}
        </Interactive>
      </div>
      {[...byNpc].map(([npc, gems]) => (
        <div key={npc} className="shop-npc">
          <span className="muted">{npc}:</span>{" "}
          {gems.map((g, i) => (
            <span key={g.gemId}>
              {i > 0 && ", "}
              {g.name}
              <Interactive className="inline">
                <button
                  className="got"
                  title="Got it: remove from the list"
                  onClick={() => void api.send({ type: "dismissReminder", id: `gem:${g.gemId}` })}
                >
                  ✓
                </button>
              </Interactive>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Which PoB tree fits now, and what to take next, by name. */
export function TreeWidget({
  guide,
  act,
  level,
  questPoints,
}: {
  guide: GuideRender;
  act: number;
  level: number | null;
  questPoints: number;
}) {
  const [manual, setManual] = useState<number | null>(null);
  const trees = guide.build?.trees ?? [];
  const step = useMemo(
    () => (guide.tree ? treeStep(trees, guide.tree, act, level, manual) : null),
    [guide.tree, trees, act, level, manual],
  );
  if (!guide.tree || !step) return <div className="muted small">The imported build has no passive trees.</div>;
  const usable = trees.filter((t) => t.nodes?.length).length;
  const have = availablePoints(level, questPoints);
  const spare = have !== null ? have - step.currentPoints : null;
  const names = (ns: NodeInfo[]) => ns.map((n) => n.name).join(", ");
  return (
    <div className="tree-w">
      <div className="gem-head">
        <span className="gem-title">{prettyTitle(step.currentName)}</span>
        {usable > 1 && (
          <Interactive className="gem-nav">
            <button title="Previous tree" onClick={() => setManual(Math.max(0, step.current - 1))}>◀</button>
            <span className="small">
              {step.current + 1}/{usable}
              {manual === null ? "" : " (manual)"}
            </span>
            <button title="Next tree" onClick={() => setManual(Math.min(usable - 1, step.current + 1))}>▶</button>
            {manual !== null && <button onClick={() => setManual(null)}>auto</button>}
          </Interactive>
        )}
      </div>
      <div className="small muted">
        This tree uses {step.currentPoints} points
        {have !== null && <>, you have about {have}</>}
        {spare !== null && spare > 0 && <span className="warn"> ({spare} to spend)</span>}
      </div>
      {step.nextName ? (
        <div className="tree-next">
          <div>
            Next: <strong>{prettyTitle(step.nextName)}</strong>
            {step.nextPoints !== null && <span className="muted small"> (+{step.nextPoints - step.currentPoints} points)</span>}
          </div>
          {step.add.keystones.length > 0 && <div className="tk-kill">Keystone: {names(step.add.keystones)}</div>}
          {step.add.ascendancy.length > 0 && <div className="tk-town">Ascendancy: {names(step.add.ascendancy)}</div>}
          {step.add.notables.length > 0 && <div className="tk-area">Notables: {names(step.add.notables)}</div>}
          {(step.add.small > 0 || step.add.masteries.length > 0 || step.add.jewels > 0) && (
            <div className="muted small">
              {step.add.small > 0 && `+${step.add.small} small nodes`}
              {step.add.masteries.length > 0 && `, masteries: ${names(step.add.masteries)}`}
              {step.add.jewels > 0 && `, ${step.add.jewels} jewel socket${step.add.jewels > 1 ? "s" : ""}`}
            </div>
          )}
          {step.remove.length > 0 && (
            <div className="warn small">Refund {step.remove.length}: {names(step.remove.slice(0, 6))}</div>
          )}
        </div>
      ) : (
        <div className="muted small">This is the build's last tree.</div>
      )}
    </div>
  );
}
