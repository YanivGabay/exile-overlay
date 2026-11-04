import { buildVendorSearch } from "@exile-overlay/route-engine";
import { api } from "../common/api.js";
import { Interactive } from "./Navigation.js";
import type { AppState } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";

const SHORT: Record<string, string> = {
  "ms-boots": "MS boots",
  "plus1-fire": "+1 fire",
  "plus1-cold": "+1 cold",
  "plus1-lightning": "+1 lightning",
  "plus1-chaos": "+1 chaos",
  "plus1-physical": "+1 phys spell",
  "phys-weapon": "phys weapon",
  "recipe-bases": "sash / chain belt",
};

/** In towns: pick what to look for in vendor windows, copy one search string. */
export function VendorSearch({ state, guide, level }: { state: AppState; guide: GuideRender; level: number | null }) {
  const data = guide.search;
  if (!data) return null;
  const sel = state.settings.search ?? { presets: [], links: [], gems: false };
  const set = (patch: Partial<typeof sel>) => void api.send({ type: "updateSettings", patch: { search: { ...sel, ...patch } } });
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const gemNames = sel.gems && guide.build ? Object.values(guide.gems).map((g) => g.name) : [];
  const strings = buildVendorSearch(data, sel.presets, sel.links, level ?? 1, gemNames);
  return (
    <div className="vsearch">
      <Interactive className="chips">
        {Object.keys(data.links).map((id) => (
          <button key={id} className={`chip-btn ${sel.links.includes(id) ? "on" : ""}`} onClick={() => set({ links: toggle(sel.links, id) })}>
            {id}
          </button>
        ))}
        {Object.keys(data.presets).map((id) => (
          <button
            key={id}
            className={`chip-btn ${sel.presets.includes(id) ? "on" : ""}`}
            title={data.presets[id].label}
            onClick={() => set({ presets: toggle(sel.presets, id) })}
          >
            {SHORT[id] ?? id}
          </button>
        ))}
        {guide.build && (
          <button className={`chip-btn ${sel.gems ? "on" : ""}`} onClick={() => set({ gems: !sel.gems })}>
            build gems
          </button>
        )}
      </Interactive>
      {strings.length > 0 ? (
        <Interactive className="vsearch-copy">
          {strings.map((s, i) => (
            <button key={i} className="primary" title={s} onClick={() => void api.send({ type: "copyText", text: s })}>
              Copy search{strings.length > 1 ? ` ${i + 1}/${strings.length}` : ""}
            </button>
          ))}
        </Interactive>
      ) : (
        <div className="muted small">Pick what to look for.</div>
      )}
      <div className="muted small">Paste with Ctrl+V into the shop's search box. Only tiers that can roll at your level are included.</div>
    </div>
  );
}
