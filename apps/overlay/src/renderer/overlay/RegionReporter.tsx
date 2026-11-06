import { useEffect } from "react";
import { api } from "../common/api.js";

type R = { x: number; y: number; width: number; height: number };
const rect = (el: Element): R => {
  const b = el.getBoundingClientRect();
  return { x: Math.round(b.left), y: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) };
};

/**
 * Tells the main process where the clickable controls (.interactive) and the
 * widgets are, whenever the page changes. Main uses the real cursor position
 * against these to toggle click-through and to fade widgets out of the way.
 */
export function RegionReporter() {
  useEffect(() => {
    let last = "";
    let frame = 0;
    const report = () => {
      frame = 0;
      const controls = [...document.querySelectorAll(".interactive")].map(rect).filter((r) => r.width > 0 && r.height > 0);
      const widgets = [...document.querySelectorAll("section.widget[data-widget]")].map((el) => ({
        id: (el as HTMLElement).dataset.widget!,
        rect: rect(el),
      }));
      const key = JSON.stringify([controls, widgets]);
      if (key !== last) {
        last = key;
        void api.send({ type: "setRegions", controls, widgets });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(report);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    window.addEventListener("resize", schedule);
    const t = setInterval(schedule, 1000);
    schedule();
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      clearInterval(t);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
