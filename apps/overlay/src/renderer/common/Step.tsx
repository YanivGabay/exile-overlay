import { DIRECTION_ARROWS, DIRECTION_WORDS, type Fragments, type GuideStep, type RouteData } from "@exile-overlay/route-engine";
import type { GuideRender } from "../../shared/guide-render.js";
import { Interactive } from "../overlay/Navigation.js";

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
  if (typeof part === "string") return <>{part}</>;
  const area = (id: string) => guide.areas[id]?.name ?? id;
  switch (part.type) {
    case "kill":
      return <span className="chip chip-kill">{part.value}</span>;
    case "arena":
      return <span className="chip chip-area">{part.value}</span>;
    case "area":
      return <span className="chip chip-area">{area(part.areaId)}</span>;
    case "enter":
      return (
        <span className={`chip ${guide.areas[part.areaId]?.isTown ? "chip-town" : "chip-area"}`}>
          {area(part.areaId)}
        </span>
      );
    case "logout":
      return <span className="chip chip-town">Logout → {area(part.areaId)}</span>;
    case "waypoint":
      return <span className="chip chip-wp">waypoint</span>;
    case "waypoint_use":
      return <span className="chip chip-wp">Waypoint → {area(part.dstAreaId)}</span>;
    case "waypoint_get":
      return <span className="chip chip-wp">waypoint</span>;
    case "portal_set":
      return <span className="chip chip-portal">portal</span>;
    case "portal_use":
      return <span className="chip chip-portal">portal → {area(part.dstAreaId)}</span>;
    case "quest":
      return <span className="chip chip-quest">{guide.quests[part.questId]?.name ?? part.questId}</span>;
    case "quest_text":
      return <span className="chip chip-quest-item">{part.value}</span>;
    case "generic":
      return <span className="chip chip-generic">{part.value}</span>;
    case "reward_quest":
      return <span className="chip chip-reward">Take {part.item}</span>;
    case "reward_vendor":
      return (
        <span className="chip chip-reward">
          Buy {part.item}
          {part.cost ? ` (${part.cost})` : ""}
        </span>
      );
    case "trial":
      return <span className="chip chip-trial">Trial of Ascendancy</span>;
    case "ascend":
      return <span className="chip chip-trial">Labyrinth ({part.version})</span>;
    case "crafting":
      return <span className="chip chip-craft">crafting recipe: {part.crafting_recipes.join(", ")}</span>;
    case "dir":
      return (
        <span className="chip chip-dir" title={DIRECTION_WORDS[part.dirIndex]}>
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
      className="chip chip-copy"
      title="Copy the vendor search text"
      onClick={() => void navigator.clipboard.writeText(text)}
    >
      ⧉ search
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
      <span className="chip chip-gem" style={{ borderColor: gem?.colour, color: gem?.colour }}>
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
