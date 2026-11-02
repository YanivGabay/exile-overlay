import { useMemo, useState } from "react";
import { viewAt } from "@exile-overlay/route-engine";
import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import { AnyStep } from "../common/Step.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { AppState, WidgetId, WidgetLayout } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Widget } from "./Widget.js";

export function OverlayApp() {
  const state = useAppState();
  const guide = useGuide();
  if (!state) return null;
  const { overlay } = state;
  const editing = overlay.editing;
  if (overlay.hidden && !editing) return null;

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
        <GuideWidget state={state} guide={guide} />
      </Widget>
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

function GuideWidget({ state, guide }: { state: AppState; guide: GuideRender | null }) {
  const profile = activeProfile(state);
  const { view: mode, showHints } = state.settings.guide;
  const [reporting, setReporting] = useState<string | null>(null);
  const view = useMemo(() => (guide ? viewAt(guide, profile.progress, mode === "compact" ? 2 : 4) : null), [guide, profile.progress, mode]);

  if (state.guide.state === "error") return <div className="warn">{state.guide.message}</div>;
  if (!guide || !view) return <div className="muted">Loading guide…</div>;
  const done = new Set(profile.progress.completed);
  const editing = state.overlay.editing;

  const stepRow = (entry: (typeof view.current)[number], kind: "current" | "next" | "upcoming") => (
    <li
      key={entry.id}
      className={`step step-${kind} ${done.has(entry.id) ? "done" : ""} ${entry.step.type === "gem_step" ? "gem" : ""}`}
      onClick={editing ? () => void api.send({ type: "toggleStepDone", stepId: entry.id }) : undefined}
    >
      <div className="step-text">
        <AnyStep entry={entry} guide={guide} />
        {editing && (
          <button
            className="link report"
            title="Report a wrong step"
            onClick={(e) => {
              e.stopPropagation();
              setReporting(entry.id);
            }}
          >
            report
          </button>
        )}
      </div>
      {showHints && mode !== "compact" && entry.step.type === "fragment_step" && entry.step.subSteps.length > 0 && (
        <ul className="hints">
          {entry.step.subSteps.map((sub, i) => (
            <li key={i}>
              <AnyStep entry={{ ...entry, step: sub }} guide={guide} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  const current = mode === "compact" ? view.current.filter((s) => !done.has(s.id)).slice(0, 3) : view.current;

  return (
    <div className="guide">
      <div className="guide-head">
        <span className="act">{view.sectionName}</span>
        <span className="progress-bar" title={`${Math.round(view.fraction * 100)}% of the campaign`}>
          <span style={{ width: `${view.fraction * 100}%` }} />
        </span>
        {profile.name !== "_default" && (
          <span className="muted small">
            {profile.name}
            {profile.level ? ` · ${profile.level}` : ""}
          </span>
        )}
      </div>
      <ul className="steps">
        {current.map((s) => stepRow(s, "current"))}
        {view.next && (
          <>
            <li className="next-label">Next</li>
            {stepRow(view.next, "next")}
          </>
        )}
        {mode !== "compact" && view.upcoming.map((s) => stepRow(s, "upcoming"))}
      </ul>
      {guide.buildError && <div className="warn small">Build import failed: {guide.buildError}</div>}
      {reporting && <ReportBox stepId={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

function ReportBox({ stepId, onClose }: { stepId: string; onClose: () => void }) {
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
