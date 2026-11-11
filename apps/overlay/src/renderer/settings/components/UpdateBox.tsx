import { api } from "../../common/api.js";
import { describeUpdate } from "../../../shared/report.js";
import type { AppState } from "../../../shared/types.js";

export function UpdateBox({ state }: { state: AppState }) {
  const u = state.update ?? { kind: "idle" as const };
  return (
    <div className="update-box">
      <div>
        <strong>Version {state.appVersion}</strong>
        <div className={`small ${u.kind === "ready" ? "ok" : "muted"}`}>Updates: {describeUpdate(u)}</div>
      </div>
      <div className="spacer" />
      {u.kind === "ready" ? (
        <button className="primary" onClick={() => void api.send({ type: "installUpdate" })}>
          Restart and update
        </button>
      ) : (
        u.kind !== "dev" && (
          <button disabled={u.kind === "checking" || u.kind === "downloading"} onClick={() => void api.send({ type: "checkUpdates" })}>
            Check for updates
          </button>
        )
      )}
    </div>
  );
}
