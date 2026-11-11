import { EventEmitter } from "node:events";
import { deepMerge } from "../../shared/defaults.js";
import type { AppState, DeepPartial, Settings } from "../../shared/types.js";
import type { SettingsStore } from "./settings-store.js";

/**
 * Single source of truth for everything the UI shows. Modules update it
 * through `patch`/`updateSettings`; every change is emitted once per tick so
 * bursts (e.g. a log catch-up) produce one broadcast.
 */
export class AppStateStore extends EventEmitter<{ change: [AppState]; settings: [Settings, Settings] }> {
  private state: AppState;
  private scheduled = false;

  constructor(
    initial: AppState,
    private readonly store: SettingsStore,
  ) {
    super();
    this.state = initial;
  }

  get(): AppState {
    return this.state;
  }

  get settings(): Settings {
    return this.state.settings;
  }

  patch(patch: DeepPartial<Omit<AppState, "settings">>) {
    this.state = deepMerge(this.state, patch as DeepPartial<AppState>);
    this.schedule();
  }

  /** Replace a top-level slice wholesale (for values where merging is wrong). */
  set<K extends keyof Omit<AppState, "settings">>(key: K, value: AppState[K]) {
    this.state = { ...this.state, [key]: value };
    this.schedule();
  }

  updateSettings(patch: DeepPartial<Settings>) {
    const prev = this.state.settings;
    this.replaceSettings(deepMerge(prev, patch));
  }

  replaceSettings(next: Settings) {
    const prev = this.state.settings;
    this.state = { ...this.state, settings: next };
    this.store.save(next);
    this.emit("settings", next, prev);
    this.schedule();
  }

  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.emit("change", this.state);
    });
  }
}
