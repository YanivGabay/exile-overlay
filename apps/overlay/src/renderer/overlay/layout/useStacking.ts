import { useEffect, useState } from "react";

/** Where the stacking pass moved a widget (`top`) or how far it cut its body (`maxBody`). */
export type Place = { top?: number; maxBody?: number };

/**
 * Keeps widgets from running under each other (e.g. a long gem list over the
 * tree widget). Top to bottom: a widget that overlaps the one above moves down
 * if it still fits on screen; otherwise the one above is cut off where it starts.
 * While editing, positions stay exactly what the player set; only the cutting applies.
 */
export function useStacking(editing: boolean): Record<string, Place> {
  const [places, setPlaces] = useState<Record<string, Place>>({});
  useEffect(() => {
    // While editing, widgets stay exactly where they're dragged (no pushing down),
    // but an upper widget is still cut where a lower one starts, so panels never
    // pile on top of each other in edit mode.
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
          if (!editing && p.top + p.h + GAP + it.h <= H) top = p.top + p.h + GAP;
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
