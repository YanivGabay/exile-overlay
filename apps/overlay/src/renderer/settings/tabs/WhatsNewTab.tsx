import { useEffect, useState } from "react";
import { updateSettings } from "../../common/api.js";
import { CHANGELOG, whatsNewSince } from "../../../shared/changelog.js";
import type { AppState } from "../../../shared/types.js";
import { UpdateBox } from "../components/UpdateBox.js";

export function WhatsNewTab({ state }: { state: AppState }) {
  // Snapshot on open: the badge stays while the tab is open, even after it's marked seen.
  const [unseen] = useState(() => whatsNewSince(state.settings.lastSeenVersion, state.appVersion));
  // Opening this tab counts as seen.
  useEffect(() => {
    if (state.settings.lastSeenVersion !== state.appVersion) void updateSettings({ lastSeenVersion: state.appVersion });
  }, [state.settings.lastSeenVersion, state.appVersion]);
  const fresh = new Set(unseen.map((e) => e.version));
  return (
    <section>
      <h1>What's new</h1>
      <UpdateBox state={state} />
      {CHANGELOG.map((e) => (
        <div key={e.version} className="changelog-entry">
          <h2>
            {e.version} <span className="muted small">{e.date}</span> {fresh.has(e.version) && <span className="badge-new">new for you</span>}
          </h2>
          <ul className="small">
            {e.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
