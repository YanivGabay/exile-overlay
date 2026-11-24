import { useEffect, useState } from "react";

/** Where the stacking pass moved a widget (`top`) or how far it cut its body (`maxBody`). */
export type Place = { top?: number; maxBody?: number };

/** A widget as measured on screen (px). `lead`/`trail`: the fold tab sticking out above/below. */
export interface StackItem {
  id: string;
  x: number;
  w: number;
  y: number;
  /** Full height including the body's hidden overflow and any tab below. */
  h: number;
  chrome: number;
  lead: number;
}

const GAP = 6;

/**
 * Lays out widgets that share screen columns, keeping their order top to bottom:
 * - first, bottom-up, the lowest top each widget can take so that everything
 *   below it in its column still fits on screen;
 * - then, top-down, a widget that overlaps the ones above (its fold tab
 *   included) moves down, but no lower than that limit; the panel above is cut
 *   where it starts instead (a long gem plan gives way to the tree, not the reverse).
 * While editing, nothing moves; only the cutting applies.
 */
export function stackWidgets(input: StackItem[], H: number, editing: boolean): Record<string, Place> {
  const items = input.filter((i) => i.h > 0 && i.id !== "status").sort((a, b) => a.y - b.y);
  const sameColumn = (a: { x: number; w: number }, b: { x: number; w: number }) => !(a.x >= b.x + b.w || b.x >= a.x + a.w);
  const limit: number[] = [];
  for (let i = items.length - 1; i >= 0; i--) {
    let l = H - items[i].h;
    for (let j = i + 1; j < items.length; j++)
      if (sameColumn(items[i], items[j])) l = Math.min(l, limit[j] - items[j].lead - GAP - items[i].h);
    limit[i] = l;
  }
  const out: Record<string, Place> = {};
  const placed: { id: string; x: number; w: number; top: number; h: number; chrome: number }[] = [];
  items.forEach((it, i) => {
    let top = it.y;
    if (!editing) {
      for (const p of placed) if (sameColumn(it, p)) top = Math.max(top, p.top + p.h + GAP + it.lead);
      top = Math.min(top, Math.max(it.y, limit[i]));
    }
    // Cut whatever above still runs into this widget (or its tab).
    for (const p of placed) {
      if (!sameColumn(it, p) || p.top >= top || p.top + p.h + GAP <= top - it.lead) continue;
      p.h = Math.max(60, top - it.lead - GAP - p.top);
      out[p.id] = { ...out[p.id], maxBody: Math.max(40, p.h - p.chrome) };
    }
    if (top + it.h > H) out[it.id] = { ...out[it.id], maxBody: Math.max(40, H - top - it.chrome - GAP) };
    if (top !== it.y) out[it.id] = { ...out[it.id], top: Math.round(top) };
    placed.push({ id: it.id, x: it.x, w: it.w, top, h: Math.min(it.h, H - top), chrome: it.chrome });
  });
  return out;
}

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
    const ro = new ResizeObserver(() => schedule());
    const watched = new WeakSet<Element>();
    const watch = (el: Element) => {
      if (watched.has(el)) return;
      watched.add(el);
      ro.observe(el);
    };
    const run = () => {
      frame = 0;
      const H = window.innerHeight;
      const W = window.innerWidth;
      const items = [...document.querySelectorAll<HTMLElement>("section.widget[data-widget]")]
        .map((el) => {
          watch(el);
          const body = el.querySelector<HTMLElement>(".widget-body");
          const chrome = el.offsetHeight - (body?.clientHeight ?? 0);
          // The fold tab hangs outside the panel: above it, or below it at the top of the screen.
          const box = el.getBoundingClientRect();
          const tab = el.querySelector<HTMLElement>(".widget-fold")?.getBoundingClientRect();
          const lead = tab ? Math.max(0, box.top - tab.top) : 0;
          const trail = tab ? Math.max(0, tab.bottom - box.bottom) : 0;
          return {
            id: el.dataset.widget!,
            x: Number(el.dataset.x) * W,
            w: el.offsetWidth,
            y: Number(el.dataset.y) * H,
            h: chrome + (body?.scrollHeight ?? 0) + trail,
            chrome,
            lead,
          } satisfies StackItem;
        });
      const out = stackWidgets(items, H, editing);
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
    // Panels also change size without any DOM change (a web font finishing loading,
    // scale changes): watch each panel's size too.
    void document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [editing]);
  return places;
}
