import { useEffect, useState } from "react";
import type { AppState, WidgetId } from "../../../shared/types.js";
import type { GuideRender } from "../../../shared/guide-render.js";

/**
 * Smart fade: widgets are fully visible right after a zone change and in
 * town, then fade while you play. In a zone, the cursor over a widget (you are
 * fighting or walking there) fades it to the idle level; over its controls it is
 * fully visible and clickable.
 */
export function useFade(state: AppState | null, guide: GuideRender | null) {
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
    const inTown = areaId ? guide?.areas[areaId]?.isTown ?? false : false;
    if (o.pointerWidget === id) {
      if (o.pointer === "control") return 1;
      // In town you're there to use the panels: hovering never fades them. In a zone the
      // cursor over a panel usually means fighting there, so it fades, but only to the
      // normal faded level: fading it further hid the buttons you were reaching for.
      if (inTown) return base;
      return Math.min(base, f.idleOpacity);
    }
    if (inTown || Date.now() < freshUntil) return base;
    return Math.min(base, f.idleOpacity);
  };
}
