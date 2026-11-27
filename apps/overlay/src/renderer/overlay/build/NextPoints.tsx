import { useMemo } from "react";
import { nextPoints, type NodeInfo, type PassiveQuest } from "@exile-overlay/route-engine";
import type { GuideRender } from "../../../shared/guide-render.js";

const KIND_CLASS: Record<string, string> = { k: "tk-kill", n: "tk-area", m: "tk-town", j: "muted" };

const tip = (n: NodeInfo) => (n.stats.length ? `${n.name}\n${n.stats.join("\n")}` : n.name);

/**
 * The next passive points to take for the points the player has, from the
 * imported build's trees (assuming they followed the order so far), plus a
 * warning for quest points they skipped on the way.
 */
export function NextPoints({
  guide,
  have,
  missed,
  count = 3,
}: {
  guide: GuideRender;
  /** Passive points the character has (level - 1 + quest points), null before the level is known. */
  have: number | null;
  missed: PassiveQuest[];
  count?: number;
}) {
  const order = guide.build?.points ?? null;
  const step = useMemo(() => (order && have !== null ? nextPoints(order, have, count) : null), [order, have, count]);
  const missedPoints = missed.reduce((n, q) => n + q.points, 0);

  return (
    <div className="points-w">
      <div className="gem-head">
        <span className="gem-title">Next points</span>
        {have !== null && <span className="small muted">you have about {have}</span>}
      </div>
      {missedPoints > 0 && (
        <div className="warn small points-missed">
          You skipped {missed.map((q) => q.name).join(", ")}: {missedPoints} point{missedPoints > 1 ? "s" : ""} short of the build. Go back for{" "}
          {missed.length > 1 ? "them" : "it"} when you can.
        </div>
      )}
      {!order ? (
        <div className="muted small">This guide version can't order the tree yet; it updates by itself.</div>
      ) : have === null || !step ? (
        <div className="muted small">Shows up once the game log reports your level.</div>
      ) : step.done ? (
        <div className="muted small">Every point in the build's trees is taken ({step.spent} points).</div>
      ) : (
        <>
          {step.refund.length > 0 && (
            <div className="warn small" title={step.refund.map((e) => e.node.name).join("\n")}>
              Respec: refund {step.refund.length} point{step.refund.length > 1 ? "s" : ""} (
              {step.refund
                .slice(0, 4)
                .map((e) => e.node.name)
                .join(", ")}
              {step.refund.length > 4 ? ", …" : ""})
            </div>
          )}
          <ol className="points-list">
            {step.next.map((e, i) => (
              <li key={`${e.node.id}-${i}`} title={tip(e.node)}>
                <span className={KIND_CLASS[e.node.kind] ?? ""}>{e.node.name}</span>
                {e.goal && e.goal.id !== e.node.id && (
                  <span className="muted small" title={tip(e.goal)}>
                    {" "}
                    toward <span className={KIND_CLASS[e.goal.kind] ?? ""}>{e.goal.name}</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
