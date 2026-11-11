import { useEffect, useState } from "react";
import { api } from "../../common/api.js";
import { useNow } from "../../common/hooks.js";
import type { Diagnostics } from "../../../preload/index.js";
import { logHelp } from "../../../shared/log-help.js";
import { describeUpdate } from "../../../shared/report.js";
import { FAQ_URL } from "../../../shared/support-links.js";
import type { AppState } from "../../../shared/types.js";
import { LogPathPicker } from "../components/LogPathPicker.js";
import { PickLogButton } from "../components/PickLogButton.js";

export function DiagnosticsTab({ state }: { state: AppState }) {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  useEffect(() => {
    void api.getDiagnostics().then(setDiag);
    const t = setInterval(() => void api.getDiagnostics().then(setDiag), 2000);
    return () => clearInterval(t);
  }, []);
  const { overlay, game, guide } = state;
  const log = game.logStatus;
  const now = useNow(2000);
  const help = logHelp(state, overlay.attachedAt ? now - overlay.attachedAt : 0);
  const rows: [string, string, boolean | null][] = [
    ["Game window", overlay.attached ? `attached to "${state.settings.game.targetTitle}"` : `not found ("${state.settings.game.targetTitle}")`, overlay.attached],
    ["Window size", overlay.bounds ? `${overlay.bounds.width}×${overlay.bounds.height} at ${overlay.bounds.x},${overlay.bounds.y}` : "–", null],
    ["Display scale", diag?.displayScale ? `${Math.round(diag.displayScale * 100)}%` : "–", null],
    ["Game focused", overlay.targetFocused ? "yes" : "no", null],
    ["Log file", log.kind === "watching" ? `${log.path} (${(log.sizeBytes / 1e6).toFixed(1)} MB)` : `${help.title}: ${help.detail}`, help.ok],
    ["Log search", diag?.logDetail ?? "", null],
    ["Current area", game.area ? `${game.area.name ?? game.area.id} (area level ${game.area.level}, ${game.area.id})` : "–", null],
    ["Character", game.character ? `${game.character.name}, level ${game.character.level} ${game.character.className}` : "–", null],
    ["Guide", guide.state === "ready" ? `${guide.version} from ${guide.source}` : guide.message ?? guide.state, guide.state === "ready"],
    ["Hotkeys not registered", diag?.hotkeyFailures.join(", ") || "none", diag ? diag.hotkeyFailures.length === 0 : null],
    ["Settings folder", diag?.userData ?? "", null],
    ["App log", diag?.logDir ?? "", null],
    ["Updates", state.update ? describeUpdate(state.update) : "–", state.update?.kind === "error" ? false : null],
    ["System", diag ? `${diag.platform}, Electron ${diag.electron}` : "", null],
  ];
  const [copied, setCopied] = useState(false);
  return (
    <section>
      <h1>Diagnostics</h1>
      <p className="muted small">
        If the overlay doesn't show up, the red line below says why; the{" "}
        <button className="link" onClick={() => void api.send({ type: "openExternal", url: FAQ_URL })}>
          FAQ
        </button>{" "}
        covers the common cases. Report a problem copies a report (the app's recent log, without account or character names) and opens the bug
        form on GitHub: paste it there.
      </p>
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
        <button
          className="primary"
          onClick={() => {
            void api.send({ type: "reportProblem" });
            setCopied(true);
          }}
        >
          {copied ? "Report copied: paste it in the form" : "Report a problem"}
        </button>
        <button onClick={() => void api.send({ type: "copyReport" })}>Copy report only</button>
        <button onClick={() => void api.send({ type: "openLogFolder" })}>Open log folder</button>
      </div>
      <h2>Game log file</h2>
      <p className="muted small">Found automatically from the running game. If it isn't, choose Client.txt in the game folder's logs folder.</p>
      <div className="row">
        <PickLogButton />
        <LogPathPicker state={state} />
      </div>
    </section>
  );
}
