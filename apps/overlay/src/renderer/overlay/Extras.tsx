import { useEffect, useState } from "react";
import type { Reminder, TrialStatus } from "@exile-overlay/route-engine";
import { api } from "../common/api.js";
import { IconWarn } from "../common/Icons.js";
import { Interactive } from "./Navigation.js";
import { compareSplit, formatDuration, liveElapsed, type FinishedRun, type RunTimer } from "../../shared/timer.js";
import type { CharacterProfile } from "../../shared/types.js";

/** Up to two reminders, newest progression first; each can be dismissed. */
export function Reminders({ items }: { items: Reminder[] }) {
  if (!items.length) return null;
  return (
    <ul className="reminders">
      {items.slice(0, 2).map((r) => (
        <li key={r.id} className={`reminder ${r.kind}`}>
          {r.kind === "danger" && <IconWarn />} {r.text}
          <Interactive className="inline">
            {r.search && (
              <button className="copy-btn" title="Copy the vendor search text" onClick={() => void navigator.clipboard.writeText(r.search!)}>
                copy search
              </button>
            )}
            <button className="dismiss" title="Got it, hide this" onClick={() => void api.send({ type: "dismissReminder", id: r.id })}>
              ✕
            </button>
          </Interactive>
        </li>
      ))}
    </ul>
  );
}

export function TrialsLine({ trials, act }: { trials: TrialStatus[]; act: number }) {
  // Show the lab that matters for this part of the campaign.
  const lab = act <= 4 ? "normal" : act <= 7 ? "cruel" : "merciless";
  const t = trials.find((x) => x.lab === lab);
  if (!t || !t.total) return null;
  const name = lab[0].toUpperCase() + lab.slice(1);
  return (
    <span title={`Trials of Ascendancy needed for the ${name} Labyrinth`}>
      Trials {t.done}/{t.total} for {name} lab
    </span>
  );
}

/** Live campaign timer with this act's split compared with past runs. */
export function TimerStrip({
  profile,
  runs,
  act,
  level,
}: {
  profile: CharacterProfile;
  runs: FinishedRun[];
  act: number;
  level: number | null;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t: RunTimer | undefined = profile.timer;
  if (!t) return null;
  const elapsed = liveElapsed(t, now);
  const actStart = t.actSplits[act] ?? 0;
  const cmp = compareSplit(runs, act + 1);
  const hours = elapsed / 3_600_000;
  const levelsPerHour = level !== null && hours > 0.25 ? (level - t.startLevel) / hours : null;
  return (
    <div className="timer" title={t.fullRun ? "Campaign time (stops on character select)" : "Started mid-campaign: not counted toward your best"}>
      <span className="time">{formatDuration(elapsed)}</span>
      <span>
        Act {act} {formatDuration(Math.max(0, elapsed - actStart))}
        {cmp.best !== null && (
          <span className={elapsed <= cmp.best ? "ok" : "warn"}> (best to Act {act + 1}: {formatDuration(cmp.best)})</span>
        )}
      </span>
      {t.deaths > 0 && <span>{t.deaths} {t.deaths === 1 ? "death" : "deaths"}</span>}
      {levelsPerHour !== null && <span>{levelsPerHour.toFixed(1)} levels/hour</span>}
    </div>
  );
}

export function MapsChecklist({ items }: { items: string[] }) {
  return (
    <div className="maps-list">
      <div className="next-zone">Campaign done. Before mapping:</div>
      <ul className="tasks">
        {items.map((i) => (
          <li key={i} className="task">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
