import { useMemo, useState } from "react";
import {
  activeReminders,
  campaignStatus,
  trialStatus,
  isMovementStep,
  recommendedLevel,
  visitedSet,
  zoneCard,
  type GuideStep,
  type RouteData,
} from "@exile-overlay/route-engine";
import { activeProfile, api } from "../common/api.js";
import { AnyStep, StepText } from "../common/Step.js";
import { IconGo, IconPassive, IconWarn } from "../common/Icons.js";
import type { AppState } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { Interactive, NavBar, RouteMap } from "./Navigation.js";
import { TrackingBanner, CharacterPicker, ReportBox } from "./Banners.js";
import { MapsChecklist, Reminders, TimerStrip, TrialsLine } from "./Extras.js";

const TRAVEL = { waypoint: "Waypoint to", portal: "Portal to", logout: "Log out to", walk: "" } as const;

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export function GuideCard({ state, guide }: { state: AppState; guide: GuideRender | null }) {
  const profile = activeProfile(state);
  const { view: mode, showHints, options } = state.settings.guide;
  const [reporting, setReporting] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const card = useMemo(
    () => (guide ? zoneCard(guide, profile.progress, mode === "compact" ? 1 : 2) : null),
    [guide, profile.progress, mode],
  );
  const campaign = useMemo(
    () =>
      guide?.campaign
        ? campaignStatus(guide, profile.progress, guide.campaign, {
            actOf: (id) => guide.areas[id]?.act,
            questName: (id) => guide.quests[id]?.name ?? id,
            killAllBandits: options.bandit === "None",
          })
        : null,
    [guide, profile.progress, options.bandit],
  );

  const actOf = (id: string) => guide?.areas[id]?.act;
  const reminders = useMemo(
    () =>
      guide && card && guide.campaign?.reminders
        ? activeReminders(guide, profile.progress, guide.campaign.reminders, {
            level: profile.level ?? state.game.character?.level ?? null,
            actOf,
            upcoming: [card.areaId, ...card.path],
            dismissed: new Set(profile.dismissed ?? []),
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guide, card, profile.progress, profile.level, profile.dismissed],
  );
  const trials = useMemo(() => (guide ? trialStatus(guide, profile.progress, actOf) : []), [guide, profile.progress]);

  if (state.guide.state === "error") return <div className="note warn">{state.guide.message}</div>;
  if (!guide || !card) return <div className="note">Loading the guide…</div>;
  if (state.tracking?.kind === "character" && state.tracking.event === "paused")
    return (
      <div className="card">
        <TrackingBanner state={state} guide={guide} routeArea={card.areaId} />
        <CharacterPicker state={state} />
      </div>
    );

  if (mode === "minimal") return <MinimalLine guide={guide} card={card} />;

  const done = new Set(profile.progress.completed);
  const editing = state.overlay.editing;
  const area = guide.areas[card.areaId];
  const act = area?.act ?? 1;
  const level = profile.level ?? state.game.character?.level ?? null;

  const fragmentSteps = [...card.todo, ...(card.leave ? [card.leave] : [])]
    .map((s) => s.step)
    .filter((s): s is RouteData.FragmentStep => s.type === "fragment_step");
  const recLevel = recommendedLevel(fragmentSteps);

  const hints = (subs: RouteData.FragmentStep[]) =>
    showHints && mode !== "compact" && subs.length > 0 ? (
      <ul className="hints">
        {subs
          .filter((sub) => !/Recommended Level/i.test(sub.parts.map((p) => (typeof p === "string" ? p : "")).join("")))
          .map((sub, i) => (
            <li key={i}>
              <StepText step={sub} guide={guide} />
            </li>
          ))}
      </ul>
    ) : null;

  const row = (entry: GuideStep) => (
    <li
      key={entry.id}
      className={`task ${done.has(entry.id) ? "done" : ""} ${entry.step.type === "gem_step" ? "gem" : ""}`}
      onClick={editing ? () => void api.send({ type: "toggleStepDone", stepId: entry.id }) : undefined}
    >
      <AnyStep entry={entry} guide={guide} />
      {editing && (
        <button
          className="link report"
          onClick={(e) => {
            e.stopPropagation();
            setReporting(entry.id);
          }}
        >
          report
        </button>
      )}
      {entry.step.type === "fragment_step" && hints(entry.step.subSteps)}
    </li>
  );

  // The Labyrinth step is in this zone: show which lab and its area level.
  const labHere = [...card.todo, ...(card.leave ? [card.leave] : [])]
    .flatMap((s) => (s.step.type === "fragment_step" ? s.step.parts : []))
    .map((p) => (typeof p !== "string" && p.type === "ascend" && p.version !== "eternal" ? p.version : null))
    .find((v): v is "normal" | "cruel" | "merciless" => v !== null);
  const todo = mode === "compact" ? card.todo.filter((s) => !done.has(s.id)).slice(0, 3) : card.todo;
  const leaveText = card.leave && !isMovementStep(card.leave.step) ? card.leave : null;
  const notes = guide.campaign?.league?.notes ?? [];
  // Zone-specific notes (e.g. a 5-link drop) show as alerts here and on the way there.
  const zoneNotes = notes.filter((n) => n.area && (n.area === card.areaId || card.path.includes(n.area)));
  const tips = notes.filter((n) => !n.area && (n.act === undefined || n.act === act));

  return (
    <div className="card">
      <header className="card-head">
        <span className="act-num" title={`Act ${act}`}>
          {ROMAN[act] ?? act}
        </span>
        <h2 className={`zone-title ${area?.isTown ? "town" : ""}`}>{area?.name ?? card.areaId}</h2>
      </header>
      <div className="pips-row">
        <ActPips guide={guide} active={profile.progress.activeEdge} visited={visitedSet(profile.progress)} act={act} />
        <NavBar state={state} mapOpen={mapOpen} onToggleMap={() => setMapOpen(!mapOpen)} />
      </div>
      <div className="zone-meta">
        {area && !area.isTown && <span>Area level {area.level}</span>}
        {area && level !== null && !area.isTown && <LevelCheck charLevel={level} areaLevel={area.level} />}
        {recLevel !== null && level !== null && level < recLevel && (
          <span className="warn">
            Boss here: level {recLevel} recommended, you are {level}
          </span>
        )}
      </div>

      {mapOpen && <RouteMap guide={guide} active={profile.progress.activeEdge} onPick={() => setMapOpen(false)} />}
      <TrackingBanner state={state} guide={guide} routeArea={card.areaId} />

      {campaign?.resistPenalty?.fresh && (
        <div className="alert">
          <IconWarn /> {campaign.resistPenalty.text}
        </div>
      )}
      {campaign && campaign.missed.length > 0 && (
        <div className="alert">
          <IconWarn /> You skipped {campaign.missed.map((q) => q.name).join(", ")}:{" "}
          {campaign.missed.reduce((n, q) => n + q.points, 0)} passive point
          {campaign.missed.reduce((n, q) => n + q.points, 0) > 1 ? "s" : ""} not collected.
        </div>
      )}

      {zoneNotes.map((n) => (
        <div key={n.id} className="alert loot">
          {n.area === card.areaId ? "Here: " : `In ${guide.areas[n.area!]?.name ?? n.area}: `}
          {n.text}
        </div>
      ))}
      {guide.campaign?.zoneTips?.[card.areaId] && (
        <p className="zone-tip">
          {guide.campaign.zoneTips[card.areaId].text}
          {!guide.campaign.zoneTips[card.areaId].verified && <span className="unchecked"> unchecked</span>}
        </p>
      )}
      <Reminders items={reminders} />
      {labHere && guide.campaign?.labs?.[labHere] && (
        <div className="alert loot">{guide.campaign.labs[labHere]!.text}</div>
      )}
      {hints(card.arrivalHints)}
      {todo.length > 0 ? <ul className="tasks">{todo.map(row)}</ul> : <p className="quiet">Nothing to do here.</p>}

      {card.leave ? (
        <div className="next">
          <span className="next-go">
            <IconGo />
          </span>
          <div>
            <div className="next-zone">
              {card.travel !== "walk" && <span className="travel">{TRAVEL[card.travel]} </span>}
              {card.path.map((id, i) => (
                <span key={id + i}>
                  {i > 0 && <span className="via"> then </span>}
                  <span className={i < card.path.length - 1 ? "pass" : ""}>{guide.areas[id]?.name ?? id}</span>
                </span>
              ))}
            </div>
            {leaveText && (
              <ul className="tasks next-tasks">{[leaveText].map(row)}</ul>
            )}
            {mode !== "compact" && card.nextTodo.length > 0 && (
              <ul className="tasks preview">{card.nextTodo.map(row)}</ul>
            )}
          </div>
        </div>
      ) : null}
      {(profile.campaignComplete || !card.leave) && guide.campaign?.mapsChecklist && (
        <MapsChecklist items={guide.campaign.mapsChecklist.items} />
      )}

      {campaign && (
        <footer className="card-foot">
          <span className="passives" title="Passive skill points from quests on this route">
            <IconPassive /> {campaign.pointsDone} of {campaign.pointsTotal} quest passives
          </span>
          <TrialsLine trials={trials} act={act} />
          {campaign.actRemaining.length > 0 && (
            <span className="quiet" title={campaign.actRemaining.map((q) => q.name).join(", ")}>
              {campaign.actRemaining.length} more in this act
            </span>
          )}
          {tips.length > 0 && (
            <Interactive className="inline">
              <button className="link" onClick={() => setTipsOpen(!tipsOpen)}>
                League tips
              </button>
            </Interactive>
          )}
        </footer>
      )}
      <TimerStrip profile={profile} runs={state.settings.runs ?? []} act={act} level={level} />
      {tipsOpen && (
        <ul className="tips">
          {tips.map((t) => (
            <li key={t.id}>{t.text}</li>
          ))}
        </ul>
      )}
      {guide.buildError && <div className="note warn">Build import failed: {guide.buildError}</div>}
      {reporting && <ReportBox stepId={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

/** One pip per zone of the current act: done, skipped (hollow), here, ahead. */
function ActPips({ guide, active, visited, act }: { guide: GuideRender; active: number; visited: Set<number>; act: number }) {
  const pips: { edge: number; name: string; state: string }[] = [];
  guide.edges.forEach((id, i) => {
    const a = guide.areas[id];
    if (!a || a.act !== act || a.isTown) return;
    pips.push({
      edge: i,
      name: a.name,
      state: i === active ? "here" : i < active ? (visited.has(i) ? "done" : "skipped") : "ahead",
    });
  });
  if (pips.length < 2) return null;
  return (
    <div className="pips" role="img" aria-label={`Act ${act} progress`}>
      {pips.map((p) => (
        <span key={p.edge} className={`pip ${p.state}`} title={p.name} />
      ))}
    </div>
  );
}

/** PoE1 experience penalty: none while |player - area| <= 3 + floor(player / 16). */
function LevelCheck({ charLevel, areaLevel }: { charLevel: number; areaLevel: number }) {
  const safe = 3 + Math.floor(charLevel / 16);
  const diff = charLevel - areaLevel;
  if (Math.abs(diff) <= safe) return <span className="ok">You are level {charLevel}</span>;
  return diff > 0 ? (
    <span className="warn">You are {diff} levels above: less experience, move on</span>
  ) : (
    <span className="warn">You are {-diff} levels below: monsters hit hard</span>
  );
}


/** One line: where you are → where to go, with the first thing to do there. */
function MinimalLine({ guide, card }: { guide: GuideRender; card: NonNullable<ReturnType<typeof zoneCard>> }) {
  const here = guide.areas[card.areaId]?.name ?? card.areaId;
  const nextId = card.path.at(-1);
  const first = card.todo[0] ?? card.nextTodo[0];
  return (
    <div className="minimal">
      <span className="zone-mini">{here}</span>
      {nextId && (
        <>
          <span className="next-go">
            <IconGo />
          </span>
          <span className="next-zone">{guide.areas[nextId]?.name ?? nextId}</span>
        </>
      )}
      {first && (
        <span className="mini-task">
          <AnyStep entry={first} guide={guide} />
        </span>
      )}
    </div>
  );
}
