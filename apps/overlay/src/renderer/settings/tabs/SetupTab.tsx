import { updateSettings } from "../../common/api.js";
import { useNow } from "../../common/hooks.js";
import { logHelp } from "../../../shared/log-help.js";
import type { AppState } from "../../../shared/types.js";
import { Check } from "../components/Check.js";
import { PickLogButton } from "../components/PickLogButton.js";
import { PobImport } from "../components/PobImport.js";
import { PresetPicker } from "../components/PresetPicker.js";

export function SetupTab({ state, onDone }: { state: AppState; onDone: () => void }) {
  const { overlay, guide } = state;
  const now = useNow(2000);
  const help = logHelp(state, overlay.attachedAt ? now - overlay.attachedAt : 0);
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
        <Check ok={help.ok}>
          <strong>Game log: {help.title.replace(/^Game log /, "").replace(/^./, (c) => c.toLowerCase())}</strong>
          <div className="muted small">{help.detail}</div>
          {help.offerPicker && (
            <div className="row" style={{ marginTop: 6 }}>
              <PickLogButton primary />
              {state.settings.game.clientLogPath && (
                <button onClick={() => void updateSettings({ game: { clientLogPath: null } })}>Detect automatically</button>
              )}
            </div>
          )}
        </Check>
        <Check ok={guide.state === "ready" ? true : guide.state === "error" ? false : null}>
          <strong>Guide</strong>
          <div className="muted small">
            {guide.state === "ready" ? `${guide.title} (game ${guide.gameVersion})` : guide.message ?? "Loading…"}
          </div>
        </Check>
      </div>
      <h2>1. How do you play this league?</h2>
      <p className="muted small">Sets which side stops the route takes and how much help you see. You can change it any time under Guide &amp; build.</p>
      <PresetPicker state={state} />
      <h2>2. Your keys (in game)</h2>
      <table className="keys">
        <tbody>
          <tr><td><kbd>{state.settings.hotkeys.nextStep}</kbd> / <kbd>{state.settings.hotkeys.prevStep}</kbd></td><td>next / previous zone, if the guide is off</td></tr>
          <tr><td><kbd>{state.settings.hotkeys.resync}</kbd></td><td>jump to the zone you are in</td></tr>
          <tr><td><kbd>{state.settings.hotkeys.toggleEdit}</kbd></td><td>move and resize the overlay</td></tr>
          <tr><td><kbd>{state.settings.hotkeys.toggleOverlay}</kbd></td><td>hide or show it</td></tr>
        </tbody>
      </table>
      <p className="muted small">Change them under Hotkeys. The guide also shows them during your first zones.</p>
      <h2>3. Optional: import your build</h2>
      <p className="muted small">Adds "take" and "buy" steps for your build's gems, plus vendor search text.</p>
      <PobImport state={state} />
      <div className="row" style={{ marginTop: 24 }}>
        <button
          className="primary"
          onClick={() => {
            void updateSettings({ firstRunDone: true });
            onDone();
          }}
        >
          Done
        </button>
        <span className="muted small">
          {help.ok
            ? "Then log in to a character: the guide appears on the right side of the game once you enter a zone."
            : "You can finish setup before the game runs: the checks above turn green on their own once it starts."}
        </span>
      </div>
    </section>
  );
}
