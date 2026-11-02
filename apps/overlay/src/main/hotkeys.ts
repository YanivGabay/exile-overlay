import { globalShortcut } from "electron";
import type { HotkeySettings } from "../shared/types.js";
import type { AppStateStore } from "./app-state.js";

export type HotkeyAction = keyof HotkeySettings;

/**
 * Global hotkeys, registered only while the game (or our overlay) has focus,
 * so we never steal keys from other applications. Each hotkey triggers one
 * overlay action and never sends input to the game.
 */
export class Hotkeys {
  private active = false;
  private registered: string[] = [];
  /** Accelerators that failed to register (taken by another app or invalid). */
  failed: string[] = [];

  constructor(
    private readonly state: AppStateStore,
    private readonly handlers: Record<HotkeyAction, () => void>,
  ) {
    state.on("change", (s) => {
      const shouldBeActive = s.overlay.attached && (s.overlay.targetFocused || s.overlay.editing);
      if (shouldBeActive !== this.active) {
        this.active = shouldBeActive;
        if (shouldBeActive) this.register();
        else this.unregister();
      }
    });
    state.on("settings", (next, prev) => {
      if (JSON.stringify(next.hotkeys) !== JSON.stringify(prev.hotkeys) && this.active) {
        this.unregister();
        this.register();
      }
    });
  }

  private register() {
    this.failed = [];
    const keys = this.state.settings.hotkeys;
    for (const action of Object.keys(this.handlers) as HotkeyAction[]) {
      const accelerator = keys[action];
      if (!accelerator) continue;
      try {
        if (globalShortcut.register(accelerator, this.handlers[action])) {
          this.registered.push(accelerator);
        } else {
          this.failed.push(accelerator);
        }
      } catch {
        this.failed.push(accelerator);
      }
    }
  }

  private unregister() {
    for (const acc of this.registered) globalShortcut.unregister(acc);
    this.registered = [];
  }

  dispose() {
    this.unregister();
  }
}
