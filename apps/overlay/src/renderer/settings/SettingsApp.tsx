import { useEffect, useState } from "react";
import { api, useAppState } from "../common/api.js";
import { AboutTab } from "./tabs/AboutTab.js";
import { DiagnosticsTab } from "./tabs/DiagnosticsTab.js";
import { GuideTab } from "./tabs/GuideTab.js";
import { HotkeysTab } from "./tabs/HotkeysTab.js";
import { OverlayTab } from "./tabs/OverlayTab.js";
import { SetupTab } from "./tabs/SetupTab.js";
import { WhatsNewTab } from "./tabs/WhatsNewTab.js";

const TABS = [
  ["setup", "Setup"],
  ["guide", "Guide & build"],
  ["hotkeys", "Hotkeys"],
  ["layout", "Overlay"],
  ["diagnostics", "Diagnostics"],
  ["whatsnew", "What's new"],
  ["about", "About"],
] as const;
type Tab = (typeof TABS)[number][0];

export function SettingsApp() {
  const state = useAppState();
  const initial = (location.hash.slice(1) as Tab) || "guide";
  const [tab, setTab] = useState<Tab>(TABS.some(([t]) => t === initial) ? initial : "guide");
  useEffect(() => api.onSettingsTab((t) => setTab(t as Tab)), []);
  if (!state) return null;
  return (
    <div className="settings">
      <nav>
        <div className="brand">Exile Overlay</div>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <div className="spacer" />
        <div className="muted small">v{state.appVersion}</div>
      </nav>
      <main>
        {tab === "setup" && <SetupTab state={state} onDone={() => setTab("guide")} />}
        {tab === "guide" && <GuideTab state={state} />}
        {tab === "hotkeys" && <HotkeysTab state={state} />}
        {tab === "layout" && <OverlayTab state={state} />}
        {tab === "diagnostics" && <DiagnosticsTab state={state} />}
        {tab === "whatsnew" && <WhatsNewTab state={state} />}
        {tab === "about" && <AboutTab state={state} />}
      </main>
    </div>
  );
}
