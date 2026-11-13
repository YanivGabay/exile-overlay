import { activeProfile, api, useAppState, useGuide } from "../common/api.js";
import { DEFAULT_WIDGET_LAYOUT, resolutionKey } from "../../shared/defaults.js";
import type { WidgetId, WidgetLayout } from "../../shared/types.js";
import { BuildWidgets } from "./build/BuildWidgets.js";
import { GuideCard } from "./guide/GuideCard.js";
import { EditBar } from "./layout/EditBar.js";
import { RegionReporter } from "./layout/RegionReporter.js";
import { useFade } from "./layout/useFade.js";
import { useStacking } from "./layout/useStacking.js";
import { Widget } from "./layout/Widget.js";
import { VendorSearch } from "./search/VendorSearch.js";
import { StatusWidget } from "./status/StatusWidget.js";

export function OverlayApp() {
  const state = useAppState();
  const guide = useGuide();
  const fadeOf = useFade(state, guide);
  const places = useStacking(state?.overlay.editing ?? false);
  if (!state) return <RegionReporter />;
  const { overlay } = state;
  const editing = overlay.editing;
  // Hidden, or the login screen / character select: draw nothing, but keep reporting regions
  // (none), so main never keeps old buttons clickable on an empty overlay.
  if ((overlay.hidden || state.game.inGame === false) && !editing) return <RegionReporter />;

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
      <Widget id="guide" collapsible title="Leveling guide" layout={layoutOf("guide")} editing={editing} fade={fade("guide")} place={places.guide} onChange={(l) => save("guide", l)}>
        <GuideCard state={state} guide={guide} />
      </Widget>
      {guide?.build && <BuildWidgets state={state} guide={guide} layoutOf={layoutOf} save={save} editing={editing} fade={fade} places={places} />}
      {guide && state.settings.features?.search !== false && (editing || (guide.areas[state.game.area?.id ?? ""]?.isTown ?? false)) && (
        <Widget id="search" collapsible title="Vendor search" layout={layoutOf("search")} editing={editing} fade={fade("search")} place={places.search} onChange={(l) => save("search", l)}>
          <VendorSearch state={state} guide={guide} level={activeProfile(state).level ?? state.game.character?.level ?? null} />
        </Widget>
      )}
      <Widget id="status" title="Status" layout={layoutOf("status")} editing={editing} onChange={(l) => save("status", l)}>
        <StatusWidget state={state} editing={editing} areaName={(id) => guide?.areas[id]?.name ?? null} />
      </Widget>
    </div>
  );
}
