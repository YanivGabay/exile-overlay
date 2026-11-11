import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ErrorBoundary } from "../../common/ErrorBoundary.js";
import type { WidgetId, WidgetLayout } from "../../../shared/types.js";

const MIN_WIDTH = 0.08;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A positioned overlay panel. Position and width are fractions of the game
 * client, so the same layout fits any window size. In edit mode it can be
 * dragged by its title, resized from its right edge, faded, scaled, hidden.
 */
export function Widget(props: {
  id: WidgetId;
  title: string;
  layout: WidgetLayout;
  editing: boolean;
  onChange: (layout: WidgetLayout) => void;
  children: ReactNode;
  /** Opacity override while playing (smart fade); undefined = the layout's own opacity. */
  fade?: number;
  /** Placement from collision avoidance (px): pushed-down top and a body height cap. */
  place?: { top?: number; maxBody?: number };
}) {
  const { layout, editing, onChange } = props;
  // Local copy while dragging, so we don't save on every pointer move.
  const [draft, setDraft] = useState<WidgetLayout | null>(null);
  const drag = useRef<{ mode: "move" | "resize"; startX: number; startY: number; start: WidgetLayout } | null>(null);
  const l = draft ?? layout;

  if (!l.visible && !editing) return null;

  const begin = (mode: "move" | "resize") => (e: PointerEvent) => {
    if (!editing) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, startX: e.clientX, startY: e.clientY, start: l };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / window.innerWidth;
    const dy = (e.clientY - d.startY) / window.innerHeight;
    if (d.mode === "move") {
      setDraft({
        ...d.start,
        x: clamp(d.start.x + dx, 0, 1 - d.start.width),
        y: clamp(d.start.y + dy, 0, 0.97),
      });
    } else {
      setDraft({ ...d.start, width: clamp(d.start.width + dx, MIN_WIDTH, 1 - d.start.x) });
    }
  };
  const end = () => {
    if (drag.current && draft) onChange(draft);
    drag.current = null;
    setDraft(null);
  };
  const set = (patch: Partial<WidgetLayout>) => onChange({ ...l, ...patch });

  return (
    <section
      data-widget={props.id}
      data-x={l.x}
      data-y={l.y}
      className={`widget widget-${props.id} ${editing ? "editable" : ""} ${l.visible ? "" : "hidden-widget"}`}
      style={{
        left: `${l.x * 100}%`,
        top: !editing && props.place?.top !== undefined ? `${props.place.top}px` : `${l.y * 100}%`,
        width: `${l.width * 100}%`,
        opacity: editing ? Math.max(l.opacity, 0.6) : (props.fade ?? l.opacity),
        fontSize: `${l.scale * 100}%`,
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {editing && (
        <header className="widget-title" onPointerDown={begin("move")}>
          <span>{props.title}</span>
          <span className="widget-tools" onPointerDown={(e) => e.stopPropagation()}>
            <button title="Smaller text" onClick={() => set({ scale: clamp(+(l.scale - 0.1).toFixed(2), 0.6, 2) })}>
              A−
            </button>
            <button title="Larger text" onClick={() => set({ scale: clamp(+(l.scale + 0.1).toFixed(2), 0.6, 2) })}>
              A+
            </button>
            <button title="More transparent" onClick={() => set({ opacity: clamp(+(l.opacity - 0.1).toFixed(2), 0.3, 1) })}>
              ◐−
            </button>
            <button title="More opaque" onClick={() => set({ opacity: clamp(+(l.opacity + 0.1).toFixed(2), 0.3, 1) })}>
              ◐+
            </button>
            <button title={l.visible ? "Hide this widget" : "Show this widget"} onClick={() => set({ visible: !l.visible })}>
              {l.visible ? "Hide" : "Show"}
            </button>
          </span>
        </header>
      )}
      <div
        className={`widget-body ${props.place?.maxBody !== undefined ? "capped" : ""}`}
        style={props.place?.maxBody !== undefined ? { maxHeight: props.place.maxBody } : undefined}
      >
        <ErrorBoundary where={`overlay: ${props.id}`} variant="panel">
          {props.children}
        </ErrorBoundary>
      </div>
      {editing && <div className="resize-handle" onPointerDown={begin("resize")} title="Drag to resize" />}
    </section>
  );
}
