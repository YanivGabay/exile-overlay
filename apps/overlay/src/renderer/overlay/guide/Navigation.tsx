import { useEffect, useMemo, useRef } from "react";
import { Interactive } from "../layout/Interactive.js";
import { api } from "../../common/api.js";
import { AnyStep } from "./Step.js";
import type { AppState } from "../../../shared/types.js";
import { IconBack, IconFold, IconFwd, IconHere, IconMap, IconUndo } from "./Icons.js";
import type { GuideRender } from "../../../shared/guide-render.js";

export function NavBar({ state, mapOpen, onToggleMap, onFold }: { state: AppState; mapOpen: boolean; onToggleMap: () => void; onFold?: () => void }) {
  const k = state.settings.hotkeys;
  const canUndo = state.tracking?.undoEdge != null;
  return (
    <Interactive className="nav">
      <button title={`Previous zone (${k.prevStep})`} onClick={() => void api.send({ type: "guideStep", delta: -1 })}>
        <IconBack title="Previous zone" />
      </button>
      <button title={`Next zone (${k.nextStep})`} onClick={() => void api.send({ type: "guideStep", delta: 1 })}>
        <IconFwd title="Next zone" />
      </button>
      <button
        title={`I'm here: jump to the zone you are in (${k.resync})`}
        disabled={!state.game.area}
        onClick={() => void api.send({ type: "guideResync" })}
      >
        <IconHere title="I'm here" />
      </button>
      <button title="Undo the last move" disabled={!canUndo} onClick={() => void api.send({ type: "guideUndo" })}>
        <IconUndo title="Undo" />
      </button>
      {onFold && (
        <button title="Fold the guide to a small tab" onClick={onFold}>
          <IconFold title="Fold" />
        </button>
      )}
      <button
        title={`Hide the overlay (${k.toggleOverlay} or the tray icon brings it back)`}
        onClick={() => void api.send({ type: "setHidden", hidden: true })}
      >
        ✕
      </button>
      <button title="Route map: pick where you are" className={mapOpen ? "on" : ""} onClick={onToggleMap}>
        <IconMap title="Route map" />
      </button>
    </Interactive>
  );
}

/** Every zone of the route, grouped by act. Click one to continue from there. */
export function RouteMap({ guide, active, onPick }: { guide: GuideRender; active: number; onPick: () => void }) {
  const groups = useMemo(() => {
    // For each edge: its section and the steps done there (up to the next edge).
    const out: { edge: number; section: string; steps: GuideRender["steps"] }[] = [];
    for (const step of guide.steps) {
      if (step.edgeIndex !== null) out.push({ edge: step.edgeIndex, section: step.sectionName, steps: [] });
      out.at(-1)?.steps.push(step);
    }
    return out;
  }, [guide]);
  const activeRef = useRef<HTMLLIElement>(null);
  useEffect(() => activeRef.current?.scrollIntoView({ block: "center" }), []);

  let lastSection = "";
  return (
    <Interactive className="route-map-wrap">
      <ul className="route-map">
        {groups.map((g) => {
          const header = g.section !== lastSection ? <li className="map-act">{g.section}</li> : null;
          lastSection = g.section;
          const area = guide.areas[guide.edges[g.edge]];
          const detail = g.steps.slice(1, 3);
          return [
            header,
            <li
              key={g.edge}
              ref={g.edge === active ? activeRef : undefined}
              className={`map-row ${g.edge === active ? "active" : ""} ${g.edge < active ? "past" : ""}`}
              onClick={() => {
                void api.send({ type: "guideSetEdge", edge: g.edge });
                onPick();
              }}
            >
              <span className={`tk ${area?.isTown ? "tk-town" : "tk-area"}`}>{area?.name ?? guide.edges[g.edge]}</span>
              {detail.map((d) => (
                <span key={d.id} className="map-detail">
                  <AnyStep entry={d} guide={guide} />
                </span>
              ))}
            </li>,
          ];
        })}
      </ul>
    </Interactive>
  );
}
