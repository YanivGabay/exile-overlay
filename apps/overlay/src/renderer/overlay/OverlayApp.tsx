import { useState } from "react";
import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { AppState, WidgetId, WidgetLayout } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Widget } from "./Widget.js";
import { Interactive } from "./Navigation.js";
import { GuideCard } from "./GuideCard.js";
import { pickSkillSet } from "../../shared/skillsets.js";
import { ShoppingList, TreeWidget } from "./BuildWidgets.js";
import { campaignStatus } from "@exile-overlay/route-engine";
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
      {guide?.build && <BuildWidgets state={state} guide={guide} layoutOf={layoutOf} save={save} editing={editing} />}
      <Widget id="status" title="Status" layout={layoutOf("status")} editing={editing} onChange={(l) => save("status", l)}>
        <StatusWidget state={state} editing={editing} />
      </Widget>
    </div>
  );
}

function BuildWidgets({
  state,
  guide,
  layoutOf,
  save,
  editing,
}: {
  state: AppState;
  guide: GuideRender;
  layoutOf: (id: WidgetId) => WidgetLayout;
  save: (id: WidgetId, l: WidgetLayout) => void;
  editing: boolean;
}) {
  const profile = activeProfile(state);
  const areaId = guide.edges[profile.progress.activeEdge];
  const act = guide.areas[areaId]?.act ?? 1;
  const level = profile.level ?? state.game.character?.level ?? null;
  const here = state.game.area?.id ?? areaId;
  const inTown = guide.areas[here]?.isTown ?? false;
  const questPoints = guide.campaign
    ? campaignStatus(guide, profile.progress, guide.campaign, {
        actOf: (id) => guide.areas[id]?.act,
        questName: (id) => guide.quests[id]?.name ?? id,
        killAllBandits: state.settings.guide.options.bandit === "None",
      }).pointsDone
    : 0;
  const f = state.settings.features;
  return (
    <>
      {f?.gemLinks !== false && (
        <Widget id="gems" title="Gem links" layout={layoutOf("gems")} editing={editing} onChange={(l) => save("gems", l)}>
          {f?.shopping !== false && (
            <ShoppingList guide={guide} progress={profile.progress} dismissed={new Set(profile.dismissed ?? [])} inTown={inTown} />
          )}
          <GemLinks guide={guide} act={act} level={level} />
        </Widget>
      )}
      {f?.tree !== false && (
        <Widget id="tree" title="Passive tree" layout={layoutOf("tree")} editing={editing} onChange={(l) => save("tree", l)}>
          <TreeWidget guide={guide} act={act} level={level} questPoints={questPoints} />
        </Widget>
      )}
    </>
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

/** The build's skill groups for this part of the campaign: usable now vs later, coloured by attribute. */
function GemLinks({ guide, act, level }: { guide: GuideRender; act: number; level: number | null }) {
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
        <span className="gem-title">{title}</span>
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
