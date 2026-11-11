import { api } from "../../common/api.js";

export function EditBar({ resolution, toggleKey }: { resolution: string; toggleKey: string }) {
  return (
    <div className="edit-bar">
      <strong>Edit layout</strong>
      <span className="muted">
        Drag a widget by its title, drag its right edge to resize. Saved for{" "}
        {resolution === "unknown" ? "this game resolution" : resolution.replace("x", "×")}. Press <kbd>{toggleKey}</kbd> or Done when finished.
      </span>
      <button onClick={() => void api.send({ type: "resetLayout", resolution })}>Reset layout</button>
      <button onClick={() => void api.send({ type: "openSettings" })}>Settings</button>
      <button className="primary" onClick={() => void api.send({ type: "setEditing", editing: false })}>
        Done
      </button>
    </div>
  );
}
