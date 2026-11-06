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
      this.restoreClickThrough();
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
    ev.on("focus", () => {
      this.state.patch({ overlay: { targetFocused: true } });
      this.restoreClickThrough();
    });
    ev.on("blur", () => this.state.patch({ overlay: { targetFocused: false } }));
    ev.on("moveresize", (e: Rect) => this.state.patch({ overlay: { bounds: toRect(e) } }));

    // Clicks on hover-enabled controls must not take focus away from the game.
    this.window.setFocusable(false);
    OverlayController.attachByTitle(this.window, state.settings.game.targetTitle);
  }

  private hovering = false;
  private controls: Rect[] = [];
  private widgets: { id: string; rect: Rect }[] = [];
  private poll: NodeJS.Timeout | null = null;

  /**
   * The library resets click-through on attach/focus; re-apply our state.
   */
  private restoreClickThrough() {
    setImmediate(() => {
      if (this.window.isDestroyed() || this.state.get().overlay.editing) return;
      this.window.setIgnoreMouseEvents(!this.hovering);
    });
  }

  /** The page reports where its clickable controls and widgets are (window coordinates, DIP). */
  setRegions(controls: Rect[], widgets: { id: string; rect: Rect }[]) {
    this.controls = controls;
    this.widgets = widgets;
    this.ensurePolling();
  }

  /**
   * Click-through everywhere except over controls, without relying on mouse
   * forwarding (which does not reach a click-through window over some games).
   * We read the real cursor 25 times a second and toggle click-through.
   */
  private ensurePolling() {
    if (this.poll) return;
    const inside = (p: { x: number; y: number }, r: Rect) => p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
    this.poll = setInterval(() => {
      if (this.window.isDestroyed() || !this.window.isVisible()) return;
      const { overlay } = this.state.get();
      if (overlay.editing || overlay.hidden) return;
      const c = screen.getCursorScreenPoint();
      const b = this.window.getBounds();
      const p = { x: c.x - b.x, y: c.y - b.y };
      const overControl = this.controls.some((r) => inside(p, r));
      if (overControl !== this.hovering) {
        this.hovering = overControl;
        this.window.setIgnoreMouseEvents(!overControl);
        console.log(`[overlay] controls ${overControl ? "clickable" : "click-through"}`);
      }
      const overWidget = this.widgets.find((w) => inside(p, w.rect))?.id ?? null;
      const zone = overControl ? "control" : overWidget ? "widget" : "none";
      if (overlay.pointer !== zone || overlay.pointerWidget !== overWidget) {
        this.state.patch({ overlay: { pointer: zone, pointerWidget: overWidget } });
      }
    }, 40);
  }

  setEditing(editing: boolean) {
    const { overlay } = this.state.get();
    if (editing === overlay.editing) return;
    if (editing) {
      if (!overlay.attached) return;
      // Edit mode needs keyboard focus (e.g. the report box).
      this.window.setFocusable(true);
      OverlayController.activateOverlay();
    } else {
      OverlayController.focusTarget();
      this.window.setFocusable(false);
      this.hovering = false;
      this.restoreClickThrough();
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
