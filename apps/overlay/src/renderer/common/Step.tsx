import { DIRECTION_ARROWS, DIRECTION_WORDS, type Fragments, type GuideStep, type RouteData } from "@exile-overlay/route-engine";
import type { GuideRender } from "../../shared/guide-render.js";
import { api } from "./api.js";
import { Interactive } from "../overlay/Navigation.js";
import { IconGo, IconKill, IconPortal, IconQuest, IconTown, IconTrial, IconWaypoint } from "./Icons.js";

/**
 * Renders one route step as readable text with small inline "chips" for the
 * structured parts (areas, quests, waypoints, directions). Every chip has a
 * text label, so nothing depends on recognising an icon or a colour.
 */
export function StepText({ step, guide }: { step: RouteData.FragmentStep; guide: GuideRender }) {
  return (
    <>
      {step.parts.map((part, i) => (
        <Fragment key={i} part={part} guide={guide} />
      ))}
    </>
  );
}

function Fragment({ part, guide }: { part: Fragments.AnyFragment; guide: GuideRender }) {
  // The route writes "➞" before zone changes; the enter glyph replaces it.
  if (typeof part === "string") return <>{part.replace(/➞\s*/g, "")}</>;
  const area = (id: string) => guide.areas[id]?.name ?? id;
  const zone = (id: string) => (
    <span className={`tk ${guide.areas[id]?.isTown ? "tk-town" : "tk-area"}`}>{area(id)}</span>
  );
  switch (part.type) {
    case "kill":
      return (
        <span className="tk tk-kill">
          <IconKill /> {part.value}
        </span>
      );
    case "arena":
      return <span className="tk tk-area">{part.value}</span>;
    case "area":
      return zone(part.areaId);
    case "enter":
      return (
        <>
          <span className="tk-go">
            <IconGo />
          </span>{" "}
          {zone(part.areaId)}
        </>
      );
    case "logout":
      return (
        <span className="tk tk-town">
          <IconTown /> Log out to {area(part.areaId)}
        </span>
      );
    case "waypoint":
      return (
        <span className="tk tk-wp">
          <IconWaypoint /> waypoint
        </span>
      );
    case "waypoint_use":
      return (
        <span className="tk tk-wp">
          <IconWaypoint /> Waypoint to {area(part.dstAreaId)}
        </span>
      );
    case "waypoint_get":
      return (
        <span className="tk tk-wp">
          <IconWaypoint /> waypoint
        </span>
      );
    case "portal_set":
      return (
        <span className="tk tk-wp">
          <IconPortal /> portal
        </span>
      );
    case "portal_use":
      return (
        <span className="tk tk-wp">
          <IconPortal /> portal to {area(part.dstAreaId)}
        </span>
      );
    case "quest":
      return (
        <span className="tk tk-quest">
          <IconQuest /> {guide.quests[part.questId]?.name ?? part.questId}
        </span>
      );
    case "quest_text":
      return <span className="tk tk-quest-item">{part.value}</span>;
    case "generic":
      return <span className="tk tk-generic">{part.value}</span>;
    case "reward_quest":
      return <span className="tk tk-reward">Take {part.item}</span>;
    case "reward_vendor":
      return (
        <span className="tk tk-reward">
          Buy {part.item}
          {part.cost ? ` (${part.cost})` : ""}
        </span>
      );
    case "trial":
      return (
        <span className="tk tk-trial">
          <IconTrial /> Trial of Ascendancy
        </span>
      );
    case "ascend":
      return (
        <span className="tk tk-trial">
          <IconTrial /> {part.version[0].toUpperCase() + part.version.slice(1)} Labyrinth
        </span>
      );
    case "crafting":
      return <span className="tk tk-craft">crafting recipe ({part.crafting_recipes.join(", ")})</span>;
    case "dir":
      return (
        <span className="tk tk-dir" title={DIRECTION_WORDS[part.dirIndex]}>
          {DIRECTION_ARROWS[part.dirIndex]} {DIRECTION_WORDS[part.dirIndex]}
        </span>
      );
    case "copy":
      return <CopyChip text={part.text} />;
  }
}

function CopyChip({ text }: { text: string }) {
  return (
    <Interactive className="inline">
    <button
      className="copy-btn"
      title="Copy the vendor search text"
      onClick={() => void api.send({ type: "copyText", text: text })}
    >
      copy search
    </button>
    </Interactive>
  );
}

export function GemStepText({ step, guide }: { step: RouteData.GemStep; guide: GuideRender }) {
  const gem = guide.gems[step.requiredGem.id];
  const name = gem?.name ?? step.requiredGem.id.split("/").at(-1);
  const verb = step.rewardType === "quest" ? "Take" : "Buy";
  return (
    <>
      {verb}{" "}
      <span className="tk tk-gem" style={{ color: gemColour(gem?.colour) }}>
        {name}
        {step.count > 1 ? ` ×${step.count}` : ""}
      </span>
      {step.requiredGem.note ? <span className="muted"> for {step.requiredGem.note}</span> : null}
    </>
  );
}

export function AnyStep({ entry, guide }: { entry: GuideStep; guide: GuideRender }) {
  return entry.step.type === "fragment_step" ? (
    <StepText step={entry.step} guide={guide} />
  ) : (
    <GemStepText step={entry.step} guide={guide} />
  );
}

/** Game data colours are pure RGB; soften them so they read on the dark panel. */
export function gemColour(raw: string | undefined): string {
  switch ((raw ?? "").toLowerCase()) {
    case "#ff3333":
      return "#e5705f";
    case "#33ff33":
      return "#7fcf7a";
    case "#3333ff":
      return "#7fa2ff";
    default:
      return "#d8d0c0";
  }
}
