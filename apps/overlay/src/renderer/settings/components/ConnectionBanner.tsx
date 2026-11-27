import { updateSettings } from "../../common/api.js";
import { useNow } from "../../common/hooks.js";
import { connectionStatus } from "../../../shared/connection.js";
import type { AppState } from "../../../shared/types.js";
import { PickLogButton } from "./PickLogButton.js";

/** The big answer to "is it connected to my game?", at the top of Setup and Diagnostics. */
export function ConnectionBanner({ state }: { state: AppState }) {
  const now = useNow(2000);
  const s = connectionStatus(state, state.overlay.attachedAt ? now - state.overlay.attachedAt : 0);
  return (
    <div className={`connection connection-${s.tone}`} role="status">
      <span className="connection-dot" aria-hidden="true" />
      <div>
        <strong>{s.title}</strong>
        <div className="small">{s.detail}</div>
        {s.looked.length > 0 && (
          <>
            <div className="small muted" style={{ marginTop: 6 }}>Where we looked:</div>
            <ul className="small muted connection-looked">
              {s.looked.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div className="small muted">
              On Steam it is in …\steamapps\common\Path of Exile\logs. The game creates it the first time it runs; once you choose it, the overlay
              remembers it.
            </div>
          </>
        )}
        {s.offerPicker && (
          <div className="row" style={{ marginTop: 8 }}>
            <PickLogButton primary />
            {state.settings.game.clientLogPath && (
              <button onClick={() => void updateSettings({ game: { clientLogPath: null } })}>Detect automatically</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
