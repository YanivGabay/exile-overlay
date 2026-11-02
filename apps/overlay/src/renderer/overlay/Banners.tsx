import { useState } from "react";
import { api } from "../common/api.js";
import type { AppState } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Interactive } from "./Navigation.js";

/** Shown while the guide doesn't know which character is played. */
export function CharacterPicker({ state }: { state: AppState }) {
  const chars = Object.values(state.settings.characters).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  return (
    <Interactive className="picker">
      <div className="small muted">Who are you playing?</div>
      {chars.map((c) => (
        <button key={c.name} onClick={() => void api.send({ type: "selectCharacter", name: c.name })}>
          {c.name === "_default" ? "New character" : c.name}
          {c.level ? ` · ${c.level}` : ""}
        </button>
      ))}
    </Interactive>
  );
}

/** Says what the tracker just decided, so the guide never moves (or stays) silently. */
export function TrackingBanner({ state, guide, routeArea }: { state: AppState; guide: GuideRender; routeArea: string | undefined }) {
  const t = state.tracking;
  if (!t) return null;
  const name = (id: string | undefined) => (id ? guide.areas[id]?.name ?? id : "");
  const resume = <span className="tk tk-area">{name(routeArea)}</span>;
  const key = state.settings.hotkeys.resync;
  const undo =
    t.undoEdge !== null ? (
      <Interactive className="inline">
        <button className="link" onClick={() => void api.send({ type: "guideUndo" })}>
          {t.kind === "manual" && t.how === "undo" ? "Redo" : "Undo"}
        </button>
      </Interactive>
    ) : null;
  switch (t.kind) {
    case "manual":
      if (t.how === "resync")
        return (
          <div className="banner">
            You're in <span className="tk tk-area">{name(t.areaId ?? undefined)}</span>
            {t.visits && t.visits > 1 ? ` (visit ${t.visit} of ${t.visits} on the route). Press ${key} again for another visit.` : "."}{" "}
            {undo}
          </div>
        );
      if (t.how === "undo") return <div className="banner">Undone. {undo}</div>;
      return t.undoEdge !== null ? <div className="banner">Moved. {undo}</div> : null;
    case "detour":
      return (
        <div className="banner">
          {t.reason === "town" ? "In" : "Back in"} <span className="tk tk-town">{name(t.areaId)}</span>. The guide
          waits for you in {resume}. {undo}
        </div>
      );
    case "jumped":
      return (
        <div className="banner">
          Playing out of order: now in <span className="tk tk-area">{name(t.areaId)}</span>
          {t.skipped > 0 ? `, ${t.skipped} zone${t.skipped > 1 ? "s" : ""} left for later` : ""}. {undo}
        </div>
      );
    case "backtracked":
      return (
        <div className="banner">
          Back for <span className="tk tk-area">{name(t.areaId)}</span>, which you skipped earlier. {undo}
        </div>
      );
    case "character":
      if (t.event === "paused")
        return (
          <div className="banner banner-ask">
            This looks like a different character. The guide is paused until it levels up, or pick a character in Settings.
          </div>
        );
      if (t.event === "new") return <div className="banner">New character: the guide starts from the beginning.</div>;
      return <div className="banner">Now following {t.name === "_default" ? "your character" : t.name}.</div>;
    case "ahead":
      return (
        <div className="banner banner-ask">
          <span className="tk tk-area">{name(t.areaId)}</span> is further along the route. Press {key} to continue from
          there.
        </div>
      );
    case "offRoute":
      return (
        <div className="banner">
          <span className="tk">{name(t.areaId)}</span> isn't part of the route. The guide waits in {resume}.
        </div>
      );
    default:
      return null;
  }
}

export function ReportBox({ stepId, onClose }: { stepId: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="report-box">
      <div className="small">What was wrong with this step in game?</div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus />
      <div className="row">
        <button onClick={onClose}>Cancel</button>
        <button
          className="primary"
          onClick={() => {
            void api.send({ type: "reportStep", stepId, note });
            onClose();
          }}
        >
          Open report
        </button>
      </div>
    </div>
  );
}

