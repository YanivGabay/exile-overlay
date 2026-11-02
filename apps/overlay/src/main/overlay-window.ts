import { BrowserWindow, screen } from "electron";
import { OverlayController, OVERLAY_WINDOW_OPTS } from "electron-overlay-window";
import type { AppStateStore } from "./app-state.js";
import type { Rect } from "../shared/types.js";

/**
 * One transparent, click-through window that electron-overlay-window keeps
 * glued to the game window (found by its exact title). It never moves,
 * resizes or otherwise touches the game window.
 *
 * Edit mode makes the overlay take mouse input (to drag widgets or click
 * buttons); leaving edit mode gives focus back to the game.
 */
export class OverlayWindow {
  readonly window: BrowserWindow;

  constructor(
    private readonly state: AppStateStore,
    preload: string,
    loadPage: (win: BrowserWindow, page: "overlay") => void,
  ) {
    this.window = new BrowserWindow({
      ...OVERLAY_WINDOW_OPTS,
      webPreferences: {
        preload,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    loadPage(this.window, "overlay");

    const ev = OverlayController.events;
    ev.on("attach", (e: { hasAccess?: boolean; x: number; y: number; width: number; height: number }) => {
      this.state.patch({
        overlay: { attached: true, targetFocused: true, bounds: toRect(e) },
      });
      if (e.hasAccess === false) {
        this.state.patch({
          overlay: { attached: true },
        });
        console.warn("[overlay] no access to the game window: the game probably runs as administrator");
      }
    });
    ev.on("detach", () => {
      this.state.patch({ overlay: { attached: false, targetFocused: false, editing: false } });
    });
    ev.on("focus", () => this.state.patch({ overlay: { targetFocused: true } }));
    ev.on("blur", () => this.state.patch({ overlay: { targetFocused: false } }));
    ev.on("moveresize", (e: Rect) => this.state.patch({ overlay: { bounds: toRect(e) } }));

    OverlayController.attachByTitle(this.window, state.settings.game.targetTitle);
  }

  setEditing(editing: boolean) {
    const { overlay } = this.state.get();
    if (editing === overlay.editing) return;
    if (editing) {
      if (!overlay.attached) return;
      OverlayController.activateOverlay();
    } else {
      OverlayController.focusTarget();
    }
    this.state.patch({ overlay: { editing } });
  }

  setHidden(hidden: boolean) {
    this.state.patch({ overlay: { hidden } });
  }

  /** Scale factor of the display the game is on (for diagnostics). */
  displayScale(): number | null {
    const b = this.state.get().overlay.bounds;
    if (!b) return null;
    const dip = screen.screenToDipRect(null, b);
    return screen.getDisplayMatching(dip).scaleFactor;
  }
}

function toRect(e: { x: number; y: number; width: number; height: number }): Rect {
  return { x: e.x, y: e.y, width: e.width, height: e.height };
}
