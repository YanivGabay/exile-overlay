import type { GuideOptions, GuideProgress, TrackOutcome } from "@exile-overlay/route-engine";

/** Rectangle in physical screen pixels. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WidgetId = "guide" | "status";

/**
 * Widget placement, relative to the game client area so a layout survives
 * window moves and resolution changes. x/y/width are fractions of the client
 * width/height; the height is content-driven.
 */
export interface WidgetLayout {
  x: number;
  y: number;
  width: number;
  visible: boolean;
  opacity: number;
  /** Font scale multiplier, 1 = default. */
  scale: number;
}

export type GuideViewMode = "full" | "compact" | "gems";

export interface HotkeySettings {
  nextStep: string;
  prevStep: string;
  resync: string;
  toggleEdit: string;
  toggleOverlay: string;
}

export interface CharacterProfile {
  name: string;
  className: string | null;
  level: number | null;
  progress: GuideProgress;
  /** Raw Path of Building export code, if imported. */
  pobCode: string | null;
  lastSeen: string;
}

export interface Settings {
  schema: 1;
  firstRunDone: boolean;
  game: {
    /** Exact window title of the game client. Changing it needs an app restart. */
    targetTitle: string;
    /** Manual Client.txt path; null = detect automatically. */
    clientLogPath: string | null;
  };
  hotkeys: HotkeySettings;
  guide: {
    options: GuideOptions;
    view: GuideViewMode;
    showHints: boolean;
    /** Where to fetch guide bundle updates; null = built-in default. */
    bundleUrl: string | null;
  };
  /** Layouts keyed by client resolution ("1920x1080"), then widget id. */
  layouts: Record<string, Partial<Record<WidgetId, WidgetLayout>>>;
  characters: Record<string, CharacterProfile>;
  activeCharacter: string | null;
}

export type LogStatus =
  | { kind: "searching" }
  | { kind: "watching"; path: string; sizeBytes: number }
  | { kind: "error"; message: string };

export interface OverlayStatus {
  attached: boolean;
  targetFocused: boolean;
  /** Game client bounds in physical pixels. */
  bounds: Rect | null;
  /** Edit mode: the overlay takes mouse input and widgets can be moved. */
  editing: boolean;
  hidden: boolean;
}

export interface GameStatus {
  logStatus: LogStatus;
  /** False on the login screen and character select; null before the log is read. */
  inGame: boolean | null;
  area: { id: string; name: string | null; level: number } | null;
  character: { name: string; className: string | null; level: number | null } | null;
}

export interface GuideStatus {
  state: "loading" | "ready" | "error";
  source: "snapshot" | "cache" | "remote" | null;
  version: string | null;
  gameVersion: string | null;
  title: string | null;
  message: string | null;
}

/** A manual move: hotkey, button, route map, or "I'm here". */
export interface ManualMove {
  kind: "manual";
  how: "step" | "pick" | "resync" | "undo";
  areaId: string | null;
  to: number;
  /** For "I'm here" when the zone is on the route more than once. */
  visit?: number;
  visits?: number;
}

/** Which character the guide follows changed, or is unknown. */
export interface CharacterNotice {
  kind: "character";
  event: "switched" | "new" | "paused";
  name: string | null;
  areaId: string;
}

export type TrackingInfo = (TrackOutcome | ManualMove | CharacterNotice) & {
  at: string;
  /** Route position before this move; null when nothing moved. Enables Undo. */
  undoEdge: number | null;
};

/** Everything the renderers display. Main owns it and pushes every change. */
export interface AppState {
  appVersion: string;
  settings: Settings;
  overlay: OverlayStatus;
  game: GameStatus;
  guide: GuideStatus;
  /** The tracker's last decision, shown in the overlay. Null until the first zone change. */
  tracking: TrackingInfo | null;
}

/** Commands renderers send to main. */
export type Command =
  | { type: "updateSettings"; patch: DeepPartial<Settings> }
  | { type: "setWidgetLayout"; resolution: string; widget: WidgetId; layout: WidgetLayout }
  | { type: "resetLayout"; resolution: string }
  | { type: "setEditing"; editing: boolean }
  | { type: "guideStep"; delta: 1 | -1 }
  | { type: "guideResync" }
  | { type: "guideSetEdge"; edge: number }
  | { type: "guideUndo" }
  | { type: "setHover"; interactive: boolean }
  | { type: "toggleStepDone"; stepId: string }
  | { type: "selectCharacter"; name: string }
  | { type: "importPob"; input: string }
  | { type: "reportStep"; stepId: string; note: string }
  | { type: "openSettings"; tab?: string }
  | { type: "openExternal"; url: string }
  | { type: "quit" };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends unknown[]
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

export const IPC = {
  getState: "app:get-state",
  state: "app:state",
  command: "app:command",
  getGuide: "guide:get",
  guide: "guide:changed",
} as const;
