import { useState } from "react";
import { api, useAppState, useGuide } from "../common/api.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { AppState, WidgetId, WidgetLayout } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Widget } from "./Widget.js";
import { Interactive } from "./Navigation.js";
import { GuideCard } from "./GuideCard.js";
import { gemColour } from "../common/Step.js";

export function OverlayApp() {
  const state = useAppState();
  const guide = useGuide();
  if (!state) return null;
  const { overlay } = state;
  const editing = overlay.editing;
  if (overlay.hidden && !editing) return null;
  // Login screen and character select: show nothing (unless editing the layout).
  if (state.game.inGame === false && !editing) return null;

  const bounds = overlay.bounds;
  const res = bounds ? resolutionKey(bounds.width, bounds.height) : "unknown";
  const saved = state.settings.layouts[res] ?? {};
  const layoutOf = (id: WidgetId): WidgetLayout => ({ ...DEFAULT_WIDGET_LAYOUT[id], ...saved[id] });
  const save = (id: WidgetId, layout: WidgetLayout) =>
    void api.send({ type: "setWidgetLayout", resolution: res, widget: id, layout });

  return (
    <div className={`overlay-root ${editing ? "editing" : ""}`}>
      {editing && <EditBar resolution={res} />}
      <Widget id="guide" title="Leveling guide" layout={layoutOf("guide")} editing={editing} onChange={(l) => save("guide", l)}>
        <GuideCard state={state} guide={guide} />
      </Widget>
      {guide?.build && (
        <Widget id="gems" title="Gem links" layout={layoutOf("gems")} editing={editing} onChange={(l) => save("gems", l)}>
          <GemLinks guide={guide} />
        </Widget>
      )}
      <Widget id="status" title="Status" layout={layoutOf("status")} editing={editing} onChange={(l) => save("status", l)}>
        <StatusWidget state={state} editing={editing} />
      </Widget>
    </div>
  );
}

function EditBar({ resolution }: { resolution: string }) {
  return (
    <div className="edit-bar">
      <strong>Edit layout</strong>
      <span className="muted">
        Drag a widget by its title. Drag its right edge to resize. Layout is saved for {resolution}.
      </span>
      <button onClick={() => void api.send({ type: "resetLayout", resolution })}>Reset layout</button>
      <button onClick={() => void api.send({ type: "openSettings" })}>Settings</button>
      <button className="primary" onClick={() => void api.send({ type: "setEditing", editing: false })}>
        Done
      </button>
    </div>
  );
}

/** The build's skill groups: main gem(s) first, then supports, coloured by attribute. */
function GemLinks({ guide }: { guide: GuideRender }) {
  const [group, setGroup] = useState(0);
  const groups = guide.build?.gemLinks ?? [];
  if (!groups.length) return <div className="muted small">The imported build has no gem links.</div>;
  const g = groups[Math.min(group, groups.length - 1)];
  const gem = (id: string) => guide.gems[id] ?? { name: id.split("/").at(-1) ?? id, colour: "", isSupport: false };
  const where = (link: { quests: { questId: string }[] }) =>
    link.quests.length ? `buy after ${guide.quests[link.quests[0].questId]?.name ?? link.quests[0].questId}` : "not sold to your class";
  return (
    <div className="gem-links">
      <div className="gem-head">
        <span className="muted small">{guide.build?.ascendancy ?? guide.build?.className}</span>
        {groups.length > 1 && (
          <Interactive className="gem-nav">
            <button onClick={() => setGroup((group - 1 + groups.length) % groups.length)}>◀</button>
            <span className="small">
              {group + 1}/{groups.length}
            </span>
            <button onClick={() => setGroup((group + 1) % groups.length)}>▶</button>
          </Interactive>
        )}
      </div>
      <div className="gem-title">{g.title}</div>
      <ul className="gems">
        {[...g.primaryGems, ...g.secondaryGems].map((l, i) => (
          <li key={l.id} className={i < g.primaryGems.length ? "primary" : "support"} title={where(l)}>
            <span className="gem-dot" style={{ background: gemColour(gem(l.id).colour) }} />
            {gem(l.id).name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusWidget({ state, editing }: { state: AppState; editing: boolean }) {
  const problems: string[] = [];
  const { game, guide } = state;
  if (game.logStatus.kind === "searching") problems.push("Looking for the game log…");
  if (game.logStatus.kind === "error") problems.push(`Game log error: ${game.logStatus.message}`);
  if (guide.state === "error") problems.push(guide.message ?? "Guide error");
  if (!problems.length && !editing) return null;
  return (
    <div className="status">
      {problems.map((p) => (
        <div key={p} className="warn small">
          {p}
        </div>
      ))}
      {!problems.length && <div className="muted small">Tracking {game.area ? `· ${game.area.id}` : ""}</div>}
      <button className="link small" onClick={() => void api.send({ type: "openSettings", tab: "diagnostics" })}>
        Diagnostics
      </button>
    </div>
  );
}
