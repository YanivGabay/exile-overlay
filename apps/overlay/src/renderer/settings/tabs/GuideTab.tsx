import type { Bandit } from "@exile-overlay/route-engine";
import { api, updateSettings } from "../../common/api.js";
import { DEFAULT_CHARACTER } from "../../../shared/defaults.js";
import type { AppState } from "../../../shared/types.js";
import { PobImport } from "../components/PobImport.js";
import { PresetPicker } from "../components/PresetPicker.js";
import { RunsTable } from "../components/RunsTable.js";

export function GuideTab({ state }: { state: AppState }) {
  const g = state.settings.guide;
  const set = (patch: Partial<typeof g>) => void updateSettings({ guide: patch });
  const setOpt = (patch: Partial<typeof g.options>) => set({ options: { ...g.options, ...patch } });
  const characters = Object.values(state.settings.characters).filter((c) => c.name !== DEFAULT_CHARACTER);
  return (
    <section>
      <h1>Guide & build</h1>
      <h2>Preset</h2>
      <PresetPicker state={state} />
      <h2>Route</h2>
      <label className="toggle">
        <input type="checkbox" checked={g.options.leagueStart} onChange={(e) => setOpt({ leagueStart: e.target.checked })} />
        First character this league (waypoints and route structure)
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.options.trials ?? g.options.leagueStart} onChange={(e) => setOpt({ trials: e.target.checked })} />
        Labyrinth trials (needed once per league for your ascendancy)
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.options.quicksilver ?? g.options.leagueStart} onChange={(e) => setOpt({ quicksilver: e.target.checked })} />
        Quicksilver flasks: Tidal Island (Hailrake) and The Den (Great White Beast)
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.options.fiveLink ?? true} onChange={(e) => setOpt({ fiveLink: e.target.checked })} />
        5-link chances: league encounters in The Slave Pens (Act 5) and The Twilight Strand (Act 6) (they dropped one in 3.27 and 3.29; unconfirmed for 3.30)
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.options.extras ?? false} onChange={(e) => setOpt({ extras: e.target.checked })} />
        Side rewards: Chemist's Strongbox, Karui tattoo, Silver Locket
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.options.library} onChange={(e) => setOpt({ library: e.target.checked })} />
        Do the Library quest in Act 3 (for gems sold by Siosa)
      </label>
      <label className="field">
        Bandits (Act 2)
        <select value={g.options.bandit} onChange={(e) => setOpt({ bandit: e.target.value as Bandit })}>
          <option value="None">Kill all</option>
          <option value="Alira">Help Alira</option>
          <option value="Oak">Help Oak</option>
          <option value="Kraityn">Help Kraityn</option>
        </select>
      </label>
      <h2>View</h2>
      <label className="field">
        Show
        <select value={g.view} onChange={(e) => set({ view: e.target.value as typeof g.view })}>
          <option value="full">Full: current zone, next zone and what follows</option>
          <option value="compact">Compact: the next few steps only</option>
          <option value="gems">Gems only: quest rewards and gem purchases (needs a build)</option>
          <option value="minimal">Minimal: one line, where you are and where to go</option>
        </select>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={g.showHints} onChange={(e) => set({ showHints: e.target.checked })} />
        Show hints under steps
      </label>
      <h2>Campaign runs</h2>
      <RunsTable state={state} />
      <h2>Build (Path of Building)</h2>
      <PobImport state={state} />
      <h2>Characters</h2>
      {characters.length === 0 ? (
        <p className="muted small">Characters appear here after their first level-up. Progress is kept per character.</p>
      ) : (
        <table className="table">
          <tbody>
            {characters.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td className="muted">{c.className ?? ""} {c.level ? `level ${c.level}` : ""}</td>
                <td>{c.pobCode ? "build imported" : ""}</td>
                <td>
                  {state.settings.activeCharacter === c.name ? (
                    <span className="ok small">active</span>
                  ) : (
                    <button onClick={() => void api.send({ type: "selectCharacter", name: c.name })}>Use</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">
        Guide: {state.guide.title} · version {state.guide.version} · source {state.guide.source}
      </p>
    </section>
  );
}
