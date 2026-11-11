import { useState } from "react";
import { activeProfile, api, updateSettings } from "../../common/api.js";
import { DEFAULT_CHARACTER } from "../../../shared/defaults.js";
import type { AppState } from "../../../shared/types.js";

export function PobImport({ state }: { state: AppState }) {
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
          A build is imported for {profile.name === DEFAULT_CHARACTER ? "this character" : profile.name}.{" "}
          <button
            className="link"
            onClick={() => void updateSettings({ characters: { [profile.name]: { ...profile, pobCode: null } } })}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
