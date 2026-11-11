import { useEffect, useState } from "react";
import { api, updateSettings } from "../../common/api.js";
import { whatsNewSince } from "../../../shared/changelog.js";
import { logHelp } from "../../../shared/log-help.js";
import type { AppState } from "../../../shared/types.js";

export function StatusWidget({ state, editing, areaName }: { state: AppState; editing: boolean; areaName: (id: string) => string | null }) {
  const { game, guide, overlay } = state;
  const [now, setNow] = useState(Date.now());
  const waiting = game.logStatus.kind !== "watching";
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [waiting]);
  const help = logHelp(state, overlay.attachedAt ? now - overlay.attachedAt : 0);
  const problems: { text: string; warn: boolean }[] = [];
  if (help.ok === false) problems.push({ text: help.title, warn: true });
  else if (help.ok === null) problems.push({ text: "Looking for the game log…", warn: false });
  if (guide.state === "error") problems.push({ text: guide.message ?? "Guide error", warn: true });
  const unseen = whatsNewSince(state.settings.lastSeenVersion, state.appVersion);
  if (!problems.length && !unseen.length && !editing) return null;
  return (
    <div className="status">
      {problems.map((p) => (
        <div key={p.text} className={`${p.warn ? "warn" : "muted"} small`}>
          {p.text}
        </div>
      ))}
      {!problems.length && <div className="muted small">Following your game log{game.area ? `: you are in ${game.area.name ?? areaName(game.area.id) ?? game.area.id}` : ""}</div>}
      {unseen.length > 0 && (
        <div className="small notice">
          Updated to {state.appVersion}.{" "}
          <button className="link small" onClick={() => void api.send({ type: "openSettings", tab: "whatsnew" })}>
            See what's new
          </button>
          <button className="link small" title="Hide this" onClick={() => updateSettings({ lastSeenVersion: state.appVersion })}>
            Dismiss
          </button>
        </div>
      )}
      <div>
        {help.offerPicker && (
          <button className="link small" onClick={() => void api.send({ type: "pickClientLog" })}>
            Choose Client.txt
          </button>
        )}
        <button className="link small" onClick={() => void api.send({ type: "openSettings", tab: "diagnostics" })}>
          Diagnostics
        </button>
      </div>
    </div>
  );
}
