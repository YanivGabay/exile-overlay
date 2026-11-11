import { useEffect, useState } from "react";
import type { AppState, WidgetId } from "../../../shared/types.js";
import type { GuideRender } from "../../../shared/guide-render.js";

/**
 * Smart fade: widgets are fully visible right after a zone change and in
 * town, then fade while you play. If the cursor is over a widget (you are
 * fighting or walking there) it almost disappears; over its controls it is
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
    if (o.pointerWidget === id) return o.pointer === "control" ? 1 : 0.12;
    const inTown = areaId ? guide?.areas[areaId]?.isTown ?? false : false;
    if (inTown || Date.now() < freshUntil) return base;
    return Math.min(base, f.idleOpacity);
  };
}
