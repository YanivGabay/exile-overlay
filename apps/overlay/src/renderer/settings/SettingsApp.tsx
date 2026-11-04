import { useEffect, useState } from "react";
import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import type { AppState, HotkeySettings } from "../../shared/types.js";
import type { Diagnostics } from "../../preload/index.js";
import type { Bandit } from "@exile-overlay/route-engine";
import { HotkeyInput } from "./HotkeyInput.js";
import { compareSplit, formatDuration } from "../../shared/timer.js";

const TABS = [
  ["setup", "Setup"],
  ["guide", "Guide & build"],
  ["hotkeys", "Hotkeys"],
  ["layout", "Overlay"],
  ["diagnostics", "Diagnostics"],
  ["about", "About"],
] as const;
type Tab = (typeof TABS)[number][0];

export function SettingsApp() {
  const state = useAppState();
  const initial = (location.hash.slice(1) as Tab) || "guide";
  const [tab, setTab] = useState<Tab>(TABS.some(([t]) => t === initial) ? initial : "guide");
  useEffect(() => api.onSettingsTab((t) => setTab(t as Tab)), []);
  if (!state) return null;
  return (
    <div className="settings">
      <nav>
        <div className="brand">Exile Overlay</div>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <div className="spacer" />
        <div className="muted small">v{state.appVersion}</div>
      </nav>
      <main>
        {tab === "setup" && <SetupTab state={state} onDone={() => setTab("guide")} />}
        {tab === "guide" && <GuideTab state={state} />}
        {tab === "hotkeys" && <HotkeysTab state={state} />}
        {tab === "layout" && <LayoutTab state={state} />}
        {tab === "diagnostics" && <DiagnosticsTab state={state} />}
        {tab === "about" && <AboutTab />}
      </main>
    </div>
  );
}

// ----- Setup wizard -----------------------------------------------------------

function Check({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  return (
    <div className="check">
      <span className={ok ? "ok" : ok === false ? "warn" : "muted"}>{ok ? "✓" : ok === false ? "!" : "…"}</span>
      <div>{children}</div>
    </div>
  );
}

function SetupTab({ state, onDone }: { state: AppState; onDone: () => void }) {
  const { overlay, game, guide } = state;
  const log = game.logStatus;
  return (
    <section>
      <h1>Welcome</h1>
      <p className="muted">
        Exile Overlay shows a leveling guide on top of Path of Exile and moves to the next step when you change zones.
        There is nothing to calibrate. These checks update live:
      </p>
      <div className="checks">
        <Check ok={overlay.attached ? true : null}>
          <strong>Game window</strong>
          <div className="muted small">
            {overlay.attached
              ? `Found "${state.settings.game.targetTitle}" (${overlay.bounds?.width}×${overlay.bounds?.height}).`
              : `Start Path of Exile in Windowed or Windowed Fullscreen mode. Exclusive fullscreen hides overlays.`}
          </div>
        </Check>
        <Check ok={log.kind === "watching" ? true : log.kind === "error" ? false : null}>
          <strong>Game log</strong>
          <div className="muted small">
            {log.kind === "watching" ? `Reading ${log.path}` : log.kind === "error" ? log.message : "Found automatically once the game runs."}
          </div>
        </Check>
        <Check ok={guide.state === "ready" ? true : guide.state === "error" ? false : null}>
          <strong>Guide</strong>
          <div className="muted small">
            {guide.state === "ready" ? `${guide.title} (game ${guide.gameVersion})` : guide.message ?? "Loading…"}
          </div>
        </Check>
      </div>
      <h2>Your keys</h2>
      <p className="muted small">
        {state.settings.hotkeys.nextStep} / {state.settings.hotkeys.prevStep}: next / previous zone ·{" "}
        {state.settings.hotkeys.toggleEdit}: move and resize the overlay · {state.settings.hotkeys.toggleOverlay}: hide it.
        Change them under Hotkeys.
      </p>
      <h2>Optional: import your build</h2>
      <p className="muted small">Adds "take" and "buy" steps for your build's gems, plus vendor search text.</p>
      <PobImport state={state} />
      <div className="row" style={{ marginTop: 24 }}>
        <button
          className="primary"
          onClick={() => {
            void api.send({ type: "updateSettings", patch: { firstRunDone: true } });
            onDone();
          }}
        >
          Done
        </button>
      </div>
    </section>
  );
}

// ----- Guide ------------------------------------------------------------------

function PobImport({ state }: { state: AppState }) {
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const profile = activeProfile(state);
  return (
    <div className="pob">
      <div className="row">
        <input
          style={{ flex: 1 }}
          placeholder="Path of Building code, or a pobb.in / poe.ninja / pastebin / maxroll link"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await api.send({ type: "importPob", input });
            setBusy(false);
            setMsg(res.ok ? { ok: true, text: "Build imported." } : { ok: false, text: String(res.error) });
            if (res.ok) setInput("");
          }}
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </div>
      {msg && <div className={`small ${msg.ok ? "ok" : "warn"}`}>{msg.text}</div>}
      {profile.pobCode && (
        <div className="small muted">
          A build is imported for {profile.name === "_default" ? "this character" : profile.name}.{" "}
          <button
            className="link"
            onClick={() => void api.send({ type: "updateSettings", patch: { characters: { [profile.name]: { ...profile, pobCode: null } } } })}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function GuideTab({ state }: { state: AppState }) {
  const g = state.settings.guide;
  const set = (patch: Partial<typeof g>) => void api.send({ type: "updateSettings", patch: { guide: patch } });
  const setOpt = (patch: Partial<typeof g.options>) => set({ options: { ...g.options, ...patch } });
  const characters = Object.values(state.settings.characters).filter((c) => c.name !== "_default");
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
        5-link chances: league encounters in The Slave Pens (Act 5) and The Twilight Strand (Act 6)
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

// ----- Hotkeys ----------------------------------------------------------------

const HOTKEY_LABELS: Record<keyof HotkeySettings, string> = {
  nextStep: "Next zone",
  prevStep: "Previous zone",
  resync: "Jump to the zone you are in",
  toggleEdit: "Edit layout / interact with the overlay",
  toggleOverlay: "Hide / show the overlay",
};

function HotkeysTab({ state }: { state: AppState }) {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  useEffect(() => void api.getDiagnostics().then(setDiag), [state.settings.hotkeys]);
  const keys = state.settings.hotkeys;
  const values = Object.values(keys);
  return (
    <section>
      <h1>Hotkeys</h1>
      <p className="muted small">
        Hotkeys only work while the game or the overlay is focused, and never send anything to the game. Click a box and
        press the key combination. Backspace clears it.
      </p>
      <table className="table">
        <tbody>
          {(Object.keys(HOTKEY_LABELS) as (keyof HotkeySettings)[]).map((k) => {
            const dupe = keys[k] && values.filter((v) => v === keys[k]).length > 1;
            const failed = diag?.hotkeyFailures.includes(keys[k]);
            return (
              <tr key={k}>
                <td>{HOTKEY_LABELS[k]}</td>
                <td>
                  <HotkeyInput value={keys[k]} onChange={(v) => void api.send({ type: "updateSettings", patch: { hotkeys: { [k]: v } } })} />
                </td>
                <td className="warn small">
                  {dupe ? "Used twice" : failed ? "Taken by another program" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted small">
        Avoid keys you use in game. F-keys are usually free in Path of Exile. Awakened PoE Trade uses Ctrl+D and Alt+D by
        default.
      </p>
    </section>
  );
}

// ----- Layout -----------------------------------------------------------------

const FEATURE_LABELS: [keyof AppState["settings"]["features"], string][] = [
  ["timer", "Campaign timer, deaths and levels per hour"],
  ["reminders", "Reminders (movement speed boots, weapon recipes, vendor gems, danger zones)"],
  ["zoneTips", "Zone tips"],
  ["leagueTips", "League tips link"],
  ["gemLinks", "Gem links widget (needs an imported build)"],
  ["shopping", "Gem shopping list in towns, with vendor search text"],
  ["tree", "Passive tree widget: which tree fits now, what to take next"],
  ["search", "Vendor search panel in towns (links, movement speed, +1 wands, weapon bases)"],
];

function LayoutTab({ state }: { state: AppState }) {
  const res = Object.keys(state.settings.layouts);
  const features = state.settings.features;
  return (
    <section>
      <h1>Overlay</h1>
      <div className="row">
        <button className="primary" onClick={() => void api.send({ type: "setHidden", hidden: !state.overlay.hidden })}>
          {state.overlay.hidden ? "Show the overlay" : "Hide the overlay"}
        </button>
        <button onClick={() => void api.send({ type: "quit" })}>Quit Exile Overlay</button>
      </div>
      <p className="muted small">
        You can also hide it with {state.settings.hotkeys.toggleOverlay} in game, with the ✕ on the guide, or from the tray icon
        (bottom right of the taskbar; it may sit under the ^ arrow).
      </p>
      <h2>Show on the overlay</h2>
      {FEATURE_LABELS.map(([key, label]) => (
        <label className="toggle" key={key}>
          <input
            type="checkbox"
            checked={features?.[key] !== false}
            onChange={(e) => void api.send({ type: "updateSettings", patch: { features: { [key]: e.target.checked } } })}
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

// ----- Diagnostics ------------------------------------------------------------

function DiagnosticsTab({ state }: { state: AppState }) {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  useEffect(() => {
    void api.getDiagnostics().then(setDiag);
    const t = setInterval(() => void api.getDiagnostics().then(setDiag), 2000);
    return () => clearInterval(t);
  }, []);
  const { overlay, game, guide } = state;
  const log = game.logStatus;
  const rows: [string, string, boolean | null][] = [
    ["Game window", overlay.attached ? `attached to "${state.settings.game.targetTitle}"` : `not found ("${state.settings.game.targetTitle}")`, overlay.attached],
    ["Window size", overlay.bounds ? `${overlay.bounds.width}×${overlay.bounds.height} at ${overlay.bounds.x},${overlay.bounds.y}` : "–", null],
    ["Display scale", diag?.displayScale ? `${Math.round(diag.displayScale * 100)}%` : "–", null],
    ["Game focused", overlay.targetFocused ? "yes" : "no", null],
    ["Log file", log.kind === "watching" ? `${log.path} (${(log.sizeBytes / 1e6).toFixed(1)} MB)` : log.kind === "error" ? log.message : "searching…", log.kind === "watching" ? true : log.kind === "error" ? false : null],
    ["Log search", diag?.logDetail ?? "", null],
    ["Current area", game.area ? `${game.area.id} (level ${game.area.level})` : "–", null],
    ["Character", game.character ? `${game.character.name} ${game.character.className} ${game.character.level}` : "–", null],
    ["Guide", guide.state === "ready" ? `${guide.version} from ${guide.source}` : guide.message ?? guide.state, guide.state === "ready"],
    ["Hotkeys not registered", diag?.hotkeyFailures.join(", ") || "none", diag ? diag.hotkeyFailures.length === 0 : null],
    ["Settings folder", diag?.userData ?? "", null],
    ["System", diag ? `${diag.platform}, Electron ${diag.electron}` : "", null],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return (
    <section>
      <h1>Diagnostics</h1>
      <p className="muted small">If the overlay doesn't show up, the red line below says why. Copy this into a bug report.</p>
      <table className="table diag">
        <tbody>
          {rows.map(([k, v, ok]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className={ok === false ? "warn" : ok ? "ok" : ""}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row">
        <button onClick={() => void api.send({ type: "copyText", text: text })}>Copy report</button>
        <LogPathPicker state={state} />
      </div>
    </section>
  );
}

function LogPathPicker({ state }: { state: AppState }) {
  const [path, setPath] = useState(state.settings.game.clientLogPath ?? "");
  return (
    <div className="row" style={{ flex: 1 }}>
      <input
        style={{ flex: 1 }}
        placeholder="Client.txt path (leave empty to detect automatically)"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <button onClick={() => void api.send({ type: "updateSettings", patch: { game: { clientLogPath: path.trim() || null } } })}>
        Use
      </button>
    </div>
  );
}

// ----- About ------------------------------------------------------------------

function AboutTab() {
  return (
    <section>
      <h1>About</h1>
      <p>Exile Overlay is free and open source (MIT).</p>
      <h2>What it reads and sends</h2>
      <ul className="small">
        <li>Reads the game's log file (Client.txt) to know which zone you are in, your character's name, class and level.</li>
        <li>Never reads or changes game memory or files, and never sends keys or clicks to the game.</li>
        <li>Downloads guide updates, and the build links you paste. Nothing about you is uploaded.</li>
        <li>Draws in its own window on top of the game. It never moves or resizes the game window.</li>
      </ul>
      <h2>Credits</h2>
      <p className="small">
        The route language, the initial route and game data come from{" "}
        <button className="link" onClick={() => void api.send({ type: "openExternal", url: "https://github.com/HeartofPhos/exile-leveling" })}>
          exile-leveling
        </button>{" "}
        by HeartofPhos (MIT).
      </p>
      <h2>Sources for tips and route</h2>
      <p className="small muted">Tips are written in our own words from these public guides. The creators don't endorse Exile Overlay.</p>
      <Credits />
      <p className="muted small">This product isn't affiliated with or endorsed by Grinding Gear Games in any way.</p>
    </section>
  );
}

function RunsTable({ state }: { state: AppState }) {
  const runs = state.settings.runs ?? [];
  if (!runs.length)
    return (
      <p className="muted small">
        Finish a campaign that started in The Twilight Strand and its act times show here, as best, previous and average splits.
      </p>
    );
  const acts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <table className="table">
      <thead>
        <tr>
          <td>Reached</td>
          <td>Best</td>
          <td>Previous</td>
          <td>Average</td>
        </tr>
      </thead>
      <tbody>
        {acts.map((a) => {
          const c = compareSplit(runs, a);
          if (c.best === null) return null;
          return (
            <tr key={a}>
              <td>{a === 11 ? "Campaign done" : `Act ${a}`}</td>
              <td>{formatDuration(c.best)}</td>
              <td>{formatDuration(c.previous!)}</td>
              <td>{formatDuration(c.average!)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Pick a preset: sets the route options and view, and which tips and reminders show. */
function PresetPicker({ state }: { state: AppState }) {
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
            void api.send({ type: "updateSettings", patch: { guide: { preset: p.id, options: p.options, view: p.view } } })
          }
        >
          <strong>{p.name}</strong>
          <span className="muted small">{p.description}</span>
        </button>
      ))}
    </div>
  );
}

export function Credits() {
  const guide = useGuide();
  const credits = guide?.campaign?.credits ?? [];
  if (!credits.length) return null;
  return (
    <ul className="small">
      {credits.map((c) => (
        <li key={c.key}>
          <button className="link" onClick={() => void api.send({ type: "openExternal", url: c.url })}>
            {c.title}
          </button>{" "}
          by {c.creator}
          {c.license ? ` (${c.license})` : ""}
        </li>
      ))}
    </ul>
  );
}
