import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyBuild,
  compileGuide,
  parsePobXml,
  INITIAL_PROGRESS,
  trackArea,
  setEdge,
  visitsOf,
  stepEdge,
  toggleCompleted,
  type CompiledGuide,
  type GameData,
  type GuideProgress,
  type PobBuild,
} from "@exile-overlay/route-engine";
import { baseClassOf, type LogEvent } from "@exile-overlay/log-watcher";
import type { AppStateStore } from "./app-state.js";
import { decodePobCode } from "./pob.js";
import type { CharacterProfile, ManualMove, TrackingInfo } from "../shared/types.js";
import type { GuideRender } from "../shared/guide-render.js";

export interface GuideBundle {
  schema: 1;
  game: "poe1" | "poe2";
  title: string;
  gameVersion: string;
  version: string;
  builtAt: string;
  routes: string[];
  data: GameData.Bundle;
}

/** Key used for progress before the log tells us the character's name. */
export const DEFAULT_CHARACTER = "_default";

const REMOTE_CHECK_MS = 30 * 60 * 1000;

export function isGuideBundle(v: unknown): v is GuideBundle {
  const b = v as GuideBundle;
  return (
    !!b &&
    b.schema === 1 &&
    (b.game === "poe1" || b.game === "poe2") &&
    Array.isArray(b.routes) &&
    typeof b.version === "string" &&
    typeof b.builtAt === "string" &&
    !!b.data?.Areas
  );
}

/**
 * Loads the guide bundle, compiles it with the player's route options, and
 * tracks per-character progress from log events.
 *
 * Bundle sources, newest wins: the snapshot shipped with the app, a cached
 * download in app-data, and (when a URL is configured) a remote bundle that
 * is re-checked every 30 minutes, so route fixes ship without an app update.
 */
export class GuideService extends EventEmitter<{ guide: [GuideRender] }> {
  private bundle: GuideBundle | null = null;
  private compiled: CompiledGuide | null = null;
  private render: GuideRender | null = null;
  private build: PobBuild | null = null;
  private buildError: string | null = null;
  private lastResync: { areaId: string; order: number[]; index: number; time: number } | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly state: AppStateStore,
    private readonly snapshotPath: string,
    private readonly cacheDir: string,
    private readonly defaultBundleUrl: string | null,
  ) {
    super();
    state.on("settings", (next, prev) => {
      const activePob = (st: typeof next) => st.characters[st.activeCharacter ?? DEFAULT_CHARACTER]?.pobCode ?? null;
      if (
        JSON.stringify(next.guide.options) !== JSON.stringify(prev.guide.options) ||
        next.guide.view !== prev.guide.view ||
        next.activeCharacter !== prev.activeCharacter ||
        activePob(next) !== activePob(prev)
      )
        this.recompile();
      if (next.guide.bundleUrl !== prev.guide.bundleUrl) void this.checkRemote();
    });
  }

  start() {
    const snapshot = this.readBundle(this.snapshotPath);
    const cached = this.readBundle(this.cachePath());
    const best = [snapshot, cached]
      .filter((b): b is GuideBundle => !!b)
      .sort((a, b) => b.builtAt.localeCompare(a.builtAt))[0];
    if (!best) {
      this.state.set("guide", {
        state: "error",
        source: null,
        version: null,
        gameVersion: null,
        title: null,
        message: "No guide found. Reinstall Exile Overlay.",
      });
      return;
    }
    this.use(best, best === cached ? "cache" : "snapshot");
    void this.checkRemote();
    this.timer = setInterval(() => void this.checkRemote(), REMOTE_CHECK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  getRender(): GuideRender | null {
    return this.render;
  }

  // ----- progress -----------------------------------------------------------

  private activeKey(): string {
    return this.state.settings.activeCharacter ?? DEFAULT_CHARACTER;
  }

  private profile(): CharacterProfile {
    const key = this.activeKey();
    return (
      this.state.settings.characters[key] ?? {
        name: key,
        className: null,
        level: null,
        progress: INITIAL_PROGRESS,
        pobCode: null,
        lastSeen: new Date().toISOString(),
      }
    );
  }

  private saveProgress(progress: GuideProgress) {
    const p = this.profile();
    if (p.progress.activeEdge === progress.activeEdge && p.progress.completed === progress.completed) return;
    this.saveProfile({ ...p, progress, lastSeen: new Date().toISOString() });
  }

  private saveProfile(profile: CharacterProfile) {
    const characters = { ...this.state.settings.characters, [profile.name]: profile };
    this.state.replaceSettings({ ...this.state.settings, characters });
  }

  private now() {
    return new Date().toISOString();
  }

  private moveTo(edge: number, move: Omit<ManualMove, "kind" | "to">) {
    if (!this.compiled) return;
    const before = this.profile().progress;
    const progress = setEdge(this.compiled, before, edge);
    const info: TrackingInfo = {
      kind: "manual",
      ...move,
      to: progress.activeEdge,
      at: this.now(),
      undoEdge: progress.activeEdge !== before.activeEdge ? before.activeEdge : null,
    };
    this.state.set("tracking", info);
    this.saveProgress(progress);
  }

  step(delta: 1 | -1) {
    this.lastResync = null;
    const p = this.profile().progress.activeEdge;
    this.moveTo(p + delta, { how: "step", areaId: this.compiled?.edges[p + delta] ?? null });
  }

  pick(edge: number) {
    this.lastResync = null;
    this.moveTo(edge, { how: "pick", areaId: this.compiled?.edges[edge] ?? null });
  }

  /** Swap back to the position before the last move (pressing it again redoes). */
  undo() {
    const t = this.state.get().tracking;
    if (!t || t.undoEdge === null) return;
    this.lastResync = null;
    this.moveTo(t.undoEdge, { how: "undo", areaId: this.compiled?.edges[t.undoEdge] ?? null });
  }

  /**
   * "I'm here": move to the route position of the zone the player is in.
   * Zones the route visits more than once are cycled nearest-first when the
   * key is pressed again within a few seconds.
   */
  resync() {
    const area = this.state.get().game.area;
    if (!this.compiled || !area) return;
    const now = Date.now();
    const last = this.lastResync;
    let order: number[];
    let index: number;
    if (last && last.areaId === area.id && now - last.time < 10_000) {
      order = last.order;
      index = (last.index + 1) % order.length;
    } else {
      order = visitsOf(this.compiled, area.id, this.profile().progress.activeEdge);
      index = 0;
    }
    if (order.length === 0) {
      this.lastResync = null;
      this.state.set("tracking", { kind: "offRoute", areaId: area.id, at: this.now(), undoEdge: null });
      return;
    }
    this.lastResync = { areaId: area.id, order, index, time: now };
    this.moveTo(order[index], {
      how: "resync",
      areaId: area.id,
      visit: [...order].sort((a, b) => a - b).indexOf(order[index]) + 1,
      visits: order.length,
    });
  }

  toggleStep(stepId: string) {
    this.saveProgress(toggleCompleted(this.profile().progress, stepId));
  }

  selectCharacter(name: string) {
    this.state.replaceSettings({ ...this.state.settings, activeCharacter: name });
  }

  setPob(code: string | null) {
    this.saveProfile({ ...this.profile(), pobCode: code });
  }

  onLogEvent(e: LogEvent, replay: boolean) {
    if (e.type === "levelUp") {
      const existing = this.state.settings.characters[e.character];
      const fromDefault =
        !existing && this.state.settings.activeCharacter === null
          ? this.state.settings.characters[DEFAULT_CHARACTER]
          : undefined;
      const profile: CharacterProfile = {
        name: e.character,
        className: baseClassOf(e.className) ?? e.className,
        level: e.level,
        // A brand-new character keeps the progress made before its first level-up.
        progress: existing?.progress ?? fromDefault?.progress ?? INITIAL_PROGRESS,
        pobCode: existing?.pobCode ?? fromDefault?.pobCode ?? null,
        lastSeen: new Date().toISOString(),
      };
      const characters = { ...this.state.settings.characters, [e.character]: profile };
      if (fromDefault) delete characters[DEFAULT_CHARACTER];
      this.state.replaceSettings({ ...this.state.settings, characters, activeCharacter: e.character });
      return;
    }
    if (e.type === "areaGenerated" && this.compiled) {
      // Replayed history (from before the app started) never moves saved progress.
      if (replay) return;
      const areas = this.bundle?.data.Areas ?? {};
      const { progress, outcome } = trackArea(this.compiled, this.profile().progress, e.areaId, {
        isTown: (id) => areas[id]?.is_town_area ?? false,
      });
      const before = this.profile().progress.activeEdge;
      const moved = progress.activeEdge !== before;
      // Detours keep the previous Undo available; moves replace it.
      const prevUndo = this.state.get().tracking?.undoEdge ?? null;
      this.state.set("tracking", { ...outcome, at: e.time, undoEdge: moved ? before : prevUndo });
      this.saveProgress(progress);
    }
  }

  // ----- bundle -------------------------------------------------------------

  private cachePath() {
    return join(this.cacheDir, "poe1.json");
  }

  private readBundle(path: string): GuideBundle | null {
    try {
      if (!existsSync(path)) return null;
      const b = JSON.parse(readFileSync(path, "utf8"));
      return isGuideBundle(b) ? b : null;
    } catch {
      return null;
    }
  }

  private use(bundle: GuideBundle, source: "snapshot" | "cache" | "remote") {
    this.bundle = bundle;
    this.state.set("guide", {
      state: "ready",
      source,
      version: bundle.version,
      gameVersion: bundle.gameVersion,
      title: bundle.title,
      message: null,
    });
    this.recompile();
  }

  private recompile() {
    if (!this.bundle) return;
    const { options, view } = this.state.settings.guide;
    let compiled = compileGuide(this.bundle.routes, this.bundle.data, options);
    const errors = compiled.logs.filter((l) => l.type === "error");
    if (errors.length) console.warn(`[guide] ${errors.length} route errors`, errors.slice(0, 5));

    this.build = null;
    this.buildError = null;
    const code = this.profile().pobCode;
    if (code) {
      try {
        this.build = parsePobXml(decodePobCode(code), this.bundle.data);
        compiled = applyBuild(compiled, this.build, this.bundle.data, {
          gemsOnly: view === "gems",
          leagueStart: options.leagueStart,
          library: options.library,
        });
      } catch (err) {
        this.buildError = (err as Error).message;
      }
    }
    this.compiled = compiled;
    this.publish();
  }

  private publish() {
    if (!this.compiled || !this.bundle) return;
    const data = this.bundle.data;
    this.render = {
      version: this.bundle.version,
      steps: this.compiled.steps,
      edges: this.compiled.edges,
      areas: Object.fromEntries(
        Object.values(data.Areas).map((a) => [a.id, { name: a.name, act: a.act, isTown: a.is_town_area }]),
      ),
      quests: Object.fromEntries(Object.values(data.Quests).map((q) => [q.id, { name: q.name }])),
      gems: this.gemNames(),
      build: this.build
        ? {
            className: this.build.className,
            ascendancy: this.build.ascendancy,
            gemLinks: this.build.gemLinks,
          }
        : null,
      buildError: this.buildError,
    };
    this.emit("guide", this.render);
  }

  /** Names and colours of gems used by the build (keeps the payload small). */
  private gemNames(): GuideRender["gems"] {
    if (!this.bundle || !this.build) return {};
    const { Gems, GemColours } = this.bundle.data;
    const out: GuideRender["gems"] = {};
    for (const g of this.build.requiredGems) {
      const gem = Gems[g.id];
      if (gem) out[g.id] = { name: gem.name, colour: GemColours[gem.primary_attribute] ?? "#c8c8c8", isSupport: gem.is_support };
    }
    return out;
  }

  /** Fetch a newer bundle if a URL is configured. Never throws. */
  async checkRemote() {
    const url = this.state.settings.guide.bundleUrl ?? this.defaultBundleUrl;
    if (!url || !this.bundle) return;
    try {
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) return;
      const remote = (await res.json()) as unknown;
      if (!isGuideBundle(remote) || remote.game !== this.bundle.game) return;
      if (remote.version === this.bundle.version || remote.builtAt <= this.bundle.builtAt) return;
      mkdirSync(this.cacheDir, { recursive: true });
      const tmp = `${this.cachePath()}.tmp`;
      writeFileSync(tmp, JSON.stringify(remote));
      renameSync(tmp, this.cachePath());
      this.use(remote, "remote");
    } catch {
      /* offline or bad response: keep the current bundle */
    }
  }
}
