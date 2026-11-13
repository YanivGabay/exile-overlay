import { api, updateSettings } from "../../common/api.js";
import type { AppState } from "../../../shared/types.js";

const FEATURE_LABELS: [keyof AppState["settings"]["features"], string][] = [
  ["timer", "Campaign timer, deaths and levels per hour"],
    ["pace", "Pace against your best run (\"1:12 ahead in Act 3\")"],
  ["reminders", "Reminders (movement speed boots, weapon recipes, vendor gems, danger zones)"],
  ["zoneTips", "Zone tips"],
  ["leagueTips", "League tips link"],
  ["gemLinks", "Gem links widget (needs an imported build)"],
  ["shopping", "Gem shopping list in towns, with vendor search text"],
  ["tree", "Passive tree widget: which tree fits now, what to take next"],
  ["search", "Vendor search panel in towns (links, movement speed, +1 wands, weapon bases)"],
];

export function OverlayTab({ state }: { state: AppState }) {
  const res = Object.keys(state.settings.layouts);
  const features = state.settings.features;
  return (
    <section>
      <h1>Overlay</h1>
      <div className="row">
        <button className={state.overlay.hidden ? "primary" : ""} onClick={() => void api.send({ type: "setHidden", hidden: !state.overlay.hidden })}>
          {state.overlay.hidden ? "Show the overlay" : "Hide the overlay"}
        </button>
        <button onClick={() => void api.send({ type: "quit" })}>Quit Exile Overlay</button>
      </div>
      <p className="muted small">
        You can also hide it with {state.settings.hotkeys.toggleOverlay} in game, with the ✕ on the guide, or from the tray icon
        (bottom right of the taskbar; it may sit under the ^ arrow).
      </p>
      <h2>Stay out of the way</h2>
      <label className="toggle">
        <input
          type="checkbox"
          checked={state.settings.fade?.enabled !== false}
          onChange={(e) => void updateSettings({ fade: { enabled: e.target.checked } })}
        />
        Fade the overlay while I play (fully visible after a zone change and in town; faded when my cursor is over it in a
        zone)
      </label>
      <label className="field">
        Faded opacity: {Math.round((state.settings.fade?.idleOpacity ?? 0.35) * 100)}%
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={state.settings.fade?.idleOpacity ?? 0.35}
          onChange={(e) => void updateSettings({ fade: { idleOpacity: Number(e.target.value) } })}
        />
      </label>
      <label className="field">
        Fade after: {state.settings.fade?.afterSeconds ?? 8} seconds in a zone
        <input
          type="range"
          min={3}
          max={30}
          step={1}
          value={state.settings.fade?.afterSeconds ?? 8}
          onChange={(e) => void updateSettings({ fade: { afterSeconds: Number(e.target.value) } })}
        />
      </label>
      <h2>Show on the overlay</h2>
      {FEATURE_LABELS.map(([key, label]) => (
        <label className="toggle" key={key}>
          <input
            type="checkbox"
            checked={features?.[key] !== false}
            onChange={(e) => void updateSettings({ features: { [key]: e.target.checked } })}
          />
          {label}
        </label>
      ))}
      <h2>Layout</h2>
      <p className="muted small">
        Press {state.settings.hotkeys.toggleEdit} in game (or the button below) to move, resize, fade or hide widgets. Layouts are
        saved per game resolution, relative to the game window, so they survive window moves.
      </p>
      <button
        className="primary"
        disabled={!state.overlay.attached}
        onClick={() => void api.send({ type: "setEditing", editing: true })}
      >
        Edit layout now
      </button>
      {!state.overlay.attached && <span className="muted small"> (start the game first)</span>}
      <h2>Saved layouts</h2>
      {res.length === 0 ? (
        <p className="muted small">None yet: the default layout is used.</p>
      ) : (
        <table className="table">
          <tbody>
            {res.map((r) => (
              <tr key={r}>
                <td>{r}</td>
                <td>
                  <button onClick={() => void api.send({ type: "resetLayout", resolution: r })}>Reset to default</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
