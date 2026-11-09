import { useEffect, useState } from "react";
import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { AppState, WidgetId, WidgetLayout } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Widget } from "./Widget.js";
import { Interactive } from "./Navigation.js";
import { GuideCard } from "./GuideCard.js";
import { pickSkillSet, prettyTitle } from "../../shared/skillsets.js";
import { ShoppingList, TreeWidget } from "./BuildWidgets.js";
import { VendorSearch } from "./VendorSearch.js";
import { RegionReporter } from "./RegionReporter.js";
import { campaignStatus } from "@exile-overlay/route-engine";
import { gemColour } from "../common/Step.js";

/**
 * Smart fade: widgets are fully visible right after a zone change and in
 * town, then fade while you play. If the cursor is over a widget (you are
 * fighting or walking there) it almost disappears; over its controls it is
 * fully visible and clickable.
 */
function useFade(state: AppState | null, guide: GuideRender | null) {
  const areaId = state?.game.area?.id ?? null;
  const after = (state?.settings.fade?.afterSeconds ?? 8) * 1000;
  const [freshUntil, setFreshUntil] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => {
    setFreshUntil(Date.now() + after);
    const t = setTimeout(() => tick((n) => n + 1), after + 50);
    return () => clearTimeout(t);
  }, [areaId, after]);
  return (id: WidgetId, base: number): number | undefined => {
    if (!state) return undefined;
    const f = state.settings.fade;
    const o = state.overlay;
    if (!f?.enabled || o.editing) return undefined;
    if (o.pointerWidget === id) return o.pointer === "control" ? 1 : 0.12;
    const inTown = areaId ? guide?.areas[areaId]?.isTown ?? false : false;
    if (inTown || Date.now() < freshUntil) return base;
    return Math.min(base, f.idleOpacity);
  };
}

type Place = { top?: number; maxBody?: number };

/**
 * Keeps widgets from running under each other (e.g. a long gem list over the
 * tree widget). Top to bottom: a widget that overlaps the one above moves down
 * if it still fits on screen; otherwise the one above is cut off where it starts.
 * Off while editing the layout, so positions are exactly what the player set.
 */
function useStacking(editing: boolean): Record<string, Place> {
  const [places, setPlaces] = useState<Record<string, Place>>({});
  useEffect(() => {
    if (editing) {
      setPlaces({});
      return;
    }
    let frame = 0;
    let last = "";
    const run = () => {
      frame = 0;
      const H = window.innerHeight;
      const W = window.innerWidth;
      const items = [...document.querySelectorAll<HTMLElement>("section.widget[data-widget]")]
        .map((el) => {
          const body = el.querySelector<HTMLElement>(".widget-body");
          const chrome = el.offsetHeight - (body?.clientHeight ?? 0);
          return {
            id: el.dataset.widget!,
            x: Number(el.dataset.x) * W,
            w: el.offsetWidth,
            y: Number(el.dataset.y) * H,
            h: chrome + (body?.scrollHeight ?? 0),
            chrome,
          };
        })
        .filter((i) => i.h > 0 && i.id !== "status")
        .sort((a, b) => a.y - b.y);
      const out: Record<string, Place> = {};
      const placed: { id: string; x: number; w: number; top: number; h: number; chrome: number }[] = [];
      const GAP = 6;
      for (const it of items) {
        let top = it.y;
        for (const p of placed) {
          const sideBySide = it.x >= p.x + p.w || p.x >= it.x + it.w;
          if (sideBySide || top >= p.top + p.h + GAP || top + it.h <= p.top) continue;
          if (p.top + p.h + GAP + it.h <= H) top = p.top + p.h + GAP;
          else {
            // No room below: cut the one above where this one starts.
            p.h = Math.max(60, top - GAP - p.top);
            out[p.id] = { ...out[p.id], maxBody: Math.max(40, p.h - p.chrome) };
          }
        }
        if (top + it.h > H) out[it.id] = { ...out[it.id], maxBody: Math.max(40, H - top - it.chrome - GAP) };
        if (top !== it.y) out[it.id] = { ...out[it.id], top: Math.round(top) };
        placed.push({ id: it.id, x: it.x, w: it.w, top, h: Math.min(it.h, H - top), chrome: it.chrome });
      }
      const key = JSON.stringify(out);
      if (key !== last) {
        last = key;
        setPlaces(out);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [editing]);
  return places;
}

export function OverlayApp() {
  const state = useAppState();
  const guide = useGuide();
  const fadeOf = useFade(state, guide);
  const places = useStacking(state?.overlay.editing ?? false);
  if (!state) return null;
  const { overlay } = state;
  const editing = overlay.editing;
  if (overlay.hidden && !editing) return null;
  // Login screen and character select: show nothing (unless editing the layout).
  if (state.game.inGame === false && !editing) return null;

  const bounds = overlay.bounds;
  const res = bounds ? resolutionKey(bounds.width, bounds.height) : "unknown";
  const saved = state.settings.layouts[res] ?? {};
  const layoutOf = (id: WidgetId): WidgetLayout => ({ ...DEFAULT_WIDGET_LAYOUT[id], ...saved[id] });
  const fade = (id: WidgetId) => fadeOf(id, layoutOf(id).opacity);
  const save = (id: WidgetId, layout: WidgetLayout) =>
    void api.send({ type: "setWidgetLayout", resolution: res, widget: id, layout });

  return (
    <div className={`overlay-root ${editing ? "editing" : ""}`}>
      <RegionReporter />
      {editing && <EditBar resolution={res} toggleKey={state.settings.hotkeys.toggleEdit} />}
      <Widget id="guide" title="Leveling guide" layout={layoutOf("guide")} editing={editing} fade={fade("guide")} place={places.guide} onChange={(l) => save("guide", l)}>
        <GuideCard state={state} guide={guide} />
      </Widget>
      {guide?.build && <BuildWidgets state={state} guide={guide} layoutOf={layoutOf} save={save} editing={editing} fade={fade} places={places} />}
      {guide && state.settings.features?.search !== false && (editing || (guide.areas[state.game.area?.id ?? ""]?.isTown ?? false)) && (
        <Widget id="search" title="Vendor search" layout={layoutOf("search")} editing={editing} fade={fade("search")} place={places.search} onChange={(l) => save("search", l)}>
          <VendorSearch state={state} guide={guide} level={activeProfile(state).level ?? state.game.character?.level ?? null} />
        </Widget>
      )}
      <Widget id="status" title="Status" layout={layoutOf("status")} editing={editing} onChange={(l) => save("status", l)}>
        <StatusWidget state={state} editing={editing} areaName={(id) => guide?.areas[id]?.name ?? null} />
      </Widget>
    </div>
  );
}

function BuildWidgets({
  state,
  guide,
  layoutOf,
  save,
  editing,
  fade,
  places,
}: {
  places: Record<string, Place>;
  state: AppState;
  guide: GuideRender;
  layoutOf: (id: WidgetId) => WidgetLayout;
  save: (id: WidgetId, l: WidgetLayout) => void;
  editing: boolean;
  fade: (id: WidgetId) => number | undefined;
}) {
  const profile = activeProfile(state);
  const areaId = guide.edges[profile.progress.activeEdge];
  const act = guide.areas[areaId]?.act ?? 1;
  const level = profile.level ?? state.game.character?.level ?? null;
  const here = state.game.area?.id ?? areaId;
  const inTown = guide.areas[here]?.isTown ?? false;
  const questPoints = guide.campaign
    ? campaignStatus(guide, profile.progress, guide.campaign, {
        actOf: (id) => guide.areas[id]?.act,
        questName: (id) => guide.quests[id]?.name ?? id,
        killAllBandits: state.settings.guide.options.bandit === "None",
      }).pointsDone
    : 0;
  const f = state.settings.features;
  return (
    <>
      {f?.gemLinks !== false && (
        <Widget id="gems" title="Gem links" layout={layoutOf("gems")} editing={editing} fade={fade("gems")} place={places.gems} onChange={(l) => save("gems", l)}>
          {f?.shopping !== false && (
            <ShoppingList guide={guide} progress={profile.progress} dismissed={new Set(profile.dismissed ?? [])} inTown={inTown} />
          )}
          <GemLinks guide={guide} act={act} level={level} />
        </Widget>
      )}
      {f?.tree !== false && (
        <Widget id="tree" title="Passive tree" layout={layoutOf("tree")} editing={editing} fade={fade("tree")} place={places.tree} onChange={(l) => save("tree", l)}>
          <TreeWidget guide={guide} act={act} level={level} questPoints={questPoints} />
        </Widget>
      )}
    </>
  );
}

function EditBar({ resolution, toggleKey }: { resolution: string; toggleKey: string }) {
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

/** The build's skill groups for this part of the campaign: usable now vs later, coloured by attribute. */
function GemLinks({ guide, act, level }: { guide: GuideRender; act: number; level: number | null }) {
  const groups = guide.build?.gemLinks ?? [];
  const titles = [...new Set(groups.map((g) => g.title))];
  const auto = pickSkillSet(titles, act, level);
  const [manual, setManual] = useState<number | null>(null);
  if (!groups.length) return <div className="muted small">The imported build has no gem links.</div>;
  const setIndex = manual ?? auto;
  const title = titles[Math.min(setIndex, titles.length - 1)];
  const inSet = groups.filter((g) => g.title === title);
  const gem = (id: string) => guide.gems[id] ?? { name: id.split("/").at(-1) ?? id, colour: "", isSupport: false, level: 1 };
  const where = (link: { quests: { questId: string }[] }) =>
    link.quests.length ? `Sold after ${guide.quests[link.quests[0].questId]?.name ?? link.quests[0].questId}` : "Not sold to your class";
  const fresh =
    level === null
      ? []
      : inSet.flatMap((g) => [...g.primaryGems, ...g.secondaryGems]).filter((l) => {
          const lv = gem(l.id).level;
          return lv > 1 && lv <= level && lv > level - 2;
        });
  return (
    <div className="gem-links">
      <div className="gem-head">
        <span className="gem-title">{prettyTitle(title)}</span>
        {titles.length > 1 && (
          <Interactive className="gem-nav">
            <button title="Previous gem setup" onClick={() => setManual((setIndex - 1 + titles.length) % titles.length)}>◀</button>
            <span className="small">
              {setIndex + 1}/{titles.length}
              {manual === null ? "" : " (manual)"}
            </span>
            <button title="Next gem setup" onClick={() => setManual((setIndex + 1) % titles.length)}>▶</button>
            {manual !== null && (
              <button title="Follow my level again" onClick={() => setManual(null)}>auto</button>
            )}
          </Interactive>
        )}
      </div>
      {fresh.length > 0 && (
        <div className="gem-fresh">Usable at your level now: {fresh.map((l) => gem(l.id).name).join(", ")}</div>
      )}
      {inSet.map((g, gi) => (
        <ul className="gems" key={gi}>
          {[...g.primaryGems, ...g.secondaryGems].map((l, i) => {
            const info = gem(l.id);
            const locked = level !== null && info.level > level;
            return (
              <li key={l.id + i} className={`${i < g.primaryGems.length ? "primary" : "support"} ${locked ? "locked" : ""}`} title={where(l)}>
                <span className="gem-dot" style={{ background: gemColour(info.colour) }} />
                {info.name}
                {locked && <span className="gem-lvl">level {info.level}</span>}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}

function StatusWidget({ state, editing, areaName }: { state: AppState; editing: boolean; areaName: (id: string) => string | null }) {
  const problems: string[] = [];
  const { game, guide } = state;
  if (game.logStatus.kind === "searching") problems.push("Looking for the game log…");
  if (game.logStatus.kind === "error") problems.push(`Game log error: ${game.logStatus.message}`);
  if (guide.state === "error") problems.push(guide.message ?? "Guide error");
  if (!problems.length && !editing) return null;
  return (
    <div className="status">
      {problems.map((p) => (
        <div key={p} className="warn small">
          {p}
        </div>
      ))}
      {!problems.length && <div className="muted small">Following your game log{game.area ? `: you are in ${game.area.name ?? areaName(game.area.id) ?? game.area.id}` : ""}</div>}
      <button className="link small" onClick={() => void api.send({ type: "openSettings", tab: "diagnostics" })}>
        Diagnostics
      </button>
    </div>
  );
}
