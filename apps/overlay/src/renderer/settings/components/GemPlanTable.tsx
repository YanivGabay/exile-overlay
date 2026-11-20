import { useGuide } from "../../common/api.js";
import { byQuest, groupLabel } from "../../../shared/gem-plan-view.js";

/** The imported build's gems, act by act: the reward to take from each quest and what to buy after it. */
export function GemPlanTable() {
  const guide = useGuide();
  const plan = guide?.build?.plan;
  if (!guide || !plan || plan.acts.length === 0) return null;
  const name = (id: string) => guide.gems[id]?.name ?? id.split("/").at(-1);
  const questName = (id: string) => guide.quests[id]?.name ?? id;
  return (
    <div className="gem-plan-box">
      <h3>Gem plan for {guide.build?.className}</h3>
      <p className="muted small">Follows your route options above: for example, Siosa only sells gems to every class after the Library quest.</p>
      <table className="table gem-plan-table">
        <tbody>
          {plan.acts.map((a) =>
            byQuest(a.items).map((g, n) => (
              <tr key={`${a.act}-${g.key}`}>
                <td className="muted">{n === 0 ? `Act ${a.act}` : ""}</td>
                <td>{groupLabel(g, questName)}</td>
                <td>
                  {g.take.length > 0 && (
                    <div>
                      {g.questId ? "Take " : ""}
                      {g.takeFrom?.includes(" or ")
                        ? g.take.map((i) => `${name(i.gemId)} from ${i.npc}`).join(", ")
                        : g.take.map((i) => name(i.gemId)).join(", ")}
                      {g.takeFrom && !g.takeFrom.includes(" or ") && <span className="muted"> from {g.takeFrom}</span>}
                    </div>
                  )}
                  {g.buy.length > 0 && (
                    <div>
                      Buy {g.buy.map((i) => `${name(i.gemId)}${i.count > 1 ? ` ×${i.count}` : ""}`).join(", ")}
                      {g.buyFrom && <span className="muted"> from {g.buyFrom}</span>}
                    </div>
                  )}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      {plan.unavailable.length > 0 && (
        <p className="muted small">Not given or sold in the campaign (find them or trade): {plan.unavailable.map(name).join(", ")}</p>
      )}
    </div>
  );
}
