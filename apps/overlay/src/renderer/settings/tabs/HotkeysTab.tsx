import { useEffect, useState } from "react";
import { api, updateSettings } from "../../common/api.js";
import type { Diagnostics } from "../../../preload/index.js";
import type { AppState, HotkeySettings } from "../../../shared/types.js";
import { HotkeyInput } from "../components/HotkeyInput.js";

const HOTKEY_LABELS: Record<keyof HotkeySettings, string> = {
  nextStep: "Next zone",
  prevStep: "Previous zone",
  resync: "Jump to the zone you are in",
  toggleEdit: "Edit layout / interact with the overlay",
  toggleOverlay: "Hide / show the overlay",
};

export function HotkeysTab({ state }: { state: AppState }) {
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
                  <HotkeyInput value={keys[k]} onChange={(v) => void updateSettings({ hotkeys: { [k]: v } })} />
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
