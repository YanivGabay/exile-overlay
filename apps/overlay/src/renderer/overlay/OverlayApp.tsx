import { useMemo, useState } from "react";
import { isMovementStep, zoneCard, type GuideStep, type RouteData } from "@exile-overlay/route-engine";
import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import { AnyStep, StepText } from "../common/Step.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { AppState, WidgetId, WidgetLayout } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Widget } from "./Widget.js";
import { Interactive, NavBar, RouteMap } from "./Navigation.js";

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
  const [mapOpen, setMapOpen] = useState(false);
  const card = useMemo(
    () => (guide ? zoneCard(guide, profile.progress, mode === "compact" ? 1 : 3) : null),
    [guide, profile.progress, mode],
  );

  if (state.guide.state === "error") return <div className="warn">{state.guide.message}</div>;
  if (!guide || !card) return <div className="muted">Loading guide…</div>;
  const done = new Set(profile.progress.completed);
  const editing = state.overlay.editing;
  const area = guide.areas[card.areaId];
  const nextArea = card.nextAreaId ? guide.areas[card.nextAreaId] : null;
  const level = profile.level ?? state.game.character?.level ?? null;

  const hintList = (subs: RouteData.FragmentStep[]) =>
    showHints && mode !== "compact" && subs.length > 0 ? (
      <ul className="hints">
        {subs.map((sub, i) => (
          <li key={i}>
            <StepText step={sub} guide={guide} />
          </li>
        ))}
      </ul>
    ) : null;

  const stepRow = (entry: GuideStep, kind: "todo" | "leave" | "preview") => (
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
      {kind !== "preview" && entry.step.type === "fragment_step" && hintList(entry.step.subSteps)}
    </li>
  );

  const todo = mode === "compact" ? card.todo.filter((s) => !done.has(s.id)).slice(0, 3) : card.todo;

  return (
    <div className="guide">
      <div className="guide-head">
        <span className="act">{card.sectionName}</span>
        <span className="progress-bar" title={`${Math.round(card.fraction * 100)}% of the campaign`}>
          <span style={{ width: `${card.fraction * 100}%` }} />
        </span>
        <NavBar state={state} mapOpen={mapOpen} onToggleMap={() => setMapOpen(!mapOpen)} />
      </div>
      {mapOpen && <RouteMap guide={guide} active={profile.progress.activeEdge} onPick={() => setMapOpen(false)} />}
      <TrackingBanner state={state} guide={guide} routeArea={card.areaId} />
      {state.tracking?.kind === "character" && state.tracking.event === "paused" ? (
        <CharacterPicker state={state} />
      ) : (
        <>

      <div className="zone">
        <span className={`zone-name ${area?.isTown ? "town" : ""}`}>{area?.name ?? card.areaId}</span>
        {area && !area.isTown && <span className="muted small">area level {area.level}</span>}
        {area && level !== null && !area.isTown && <LevelCheck charLevel={level} areaLevel={area.level} />}
      </div>
      {hintList(card.arrivalHints)}

      {todo.length > 0 ? (
        <ul className="steps">{todo.map((s) => stepRow(s, "todo"))}</ul>
      ) : (
        <div className="muted small nothing">Nothing to do here. Head on.</div>
      )}

      {card.leave && (
        <>
          <div className="then-label">
            Then{nextArea ? <> → <span className={`chip ${nextArea.isTown ? "chip-town" : "chip-area"}`}>{nextArea.name}</span></> : null}
          </div>
          <ul className="steps">
            {!isMovementStep(card.leave.step) && stepRow(card.leave, "leave")}
            {mode !== "compact" && card.nextTodo.map((s) => stepRow(s, "preview"))}
          </ul>
        </>
      )}
      {!card.leave && <div className="ok small">End of the route. Well done, exile.</div>}
        </>
      )}

      {guide.buildError && <div className="warn small">Build import failed: {guide.buildError}</div>}
      {reporting && <ReportBox stepId={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

/**
 * PoE1 experience penalty: no penalty while |player - area| <= 3 + floor(player / 16).
 * Shown only when it matters.
 */
function LevelCheck({ charLevel, areaLevel }: { charLevel: number; areaLevel: number }) {
  const safe = 3 + Math.floor(charLevel / 16);
  const diff = charLevel - areaLevel;
  if (Math.abs(diff) <= safe) return null;
  return diff > 0 ? (
    <span className="warn small" title="You get less experience here">
      you're {diff} levels over: move on
    </span>
  ) : (
    <span className="warn small" title="Monsters here are much stronger than you">
      you're {-diff} levels under: careful
    </span>
  );
}

/** Shown while the guide doesn't know which character is played. */
function CharacterPicker({ state }: { state: AppState }) {
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
function TrackingBanner({ state, guide, routeArea }: { state: AppState; guide: GuideRender; routeArea: string | undefined }) {
  const t = state.tracking;
  if (!t) return null;
  const name = (id: string | undefined) => (id ? guide.areas[id]?.name ?? id : "");
  const resume = <span className="chip chip-area">{name(routeArea)}</span>;
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
            You're in <span className="chip chip-area">{name(t.areaId ?? undefined)}</span>
            {t.visits && t.visits > 1 ? ` (visit ${t.visit} of ${t.visits} on the route). Press ${key} again for another visit.` : "."}{" "}
            {undo}
          </div>
        );
      if (t.how === "undo") return <div className="banner">Undone. {undo}</div>;
      return t.undoEdge !== null ? <div className="banner">Moved. {undo}</div> : null;
    case "detour":
      return (
        <div className="banner">
          {t.reason === "town" ? "In" : "Back in"} <span className="chip chip-town">{name(t.areaId)}</span>. The guide
          waits for you in {resume}. {undo}
        </div>
      );
    case "jumped":
      return (
        <div className="banner">
          Playing out of order: now in <span className="chip chip-area">{name(t.areaId)}</span>
          {t.skipped > 0 ? `, ${t.skipped} zone${t.skipped > 1 ? "s" : ""} left for later` : ""}. {undo}
        </div>
      );
    case "backtracked":
      return (
        <div className="banner">
          Back for <span className="chip chip-area">{name(t.areaId)}</span>, which you skipped earlier. {undo}
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
          <span className="chip chip-area">{name(t.areaId)}</span> is further along the route. Press {key} to continue from
          there.
        </div>
      );
    case "offRoute":
      return (
        <div className="banner">
          <span className="chip">{name(t.areaId)}</span> isn't part of the route. The guide waits in {resume}.
        </div>
      );
    default:
      return null;
  }
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
