import { updateSettings, useGuide } from "../../common/api.js";
import type { AppState } from "../../../shared/types.js";

/** Pick a preset: sets the route options and view, and which tips and reminders show. */
export function PresetPicker({ state }: { state: AppState }) {
  const guide = useGuide();
  const presets = guide?.campaign?.presets ?? [];
  if (!presets.length) return null;
  return (
    <div className="presets">
      {presets.map((p) => (
        <button
          key={p.id}
          className={`preset ${state.settings.guide.preset === p.id ? "on" : ""}`}
          onClick={() =>
            void updateSettings({ guide: { preset: p.id, options: p.options, view: p.view } })
          }
        >
          <strong>{p.name}</strong>
          <span className="muted small">{p.description}</span>
        </button>
      ))}
    </div>
  );
}
