import { useState } from "react";
import { updateSettings } from "../../common/api.js";
import type { AppState } from "../../../shared/types.js";

export function LogPathPicker({ state }: { state: AppState }) {
  const [path, setPath] = useState(state.settings.game.clientLogPath ?? "");
  return (
    <div className="row" style={{ flex: 1 }}>
      <input
        style={{ flex: 1 }}
        placeholder="Client.txt path (leave empty to detect automatically)"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <button onClick={() => void updateSettings({ game: { clientLogPath: path.trim() || null } })}>
        Use
      </button>
    </div>
  );
}
