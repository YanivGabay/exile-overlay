# exile-leveling (heartofphos/exile-leveling): research notes

MIT, 218 stars / 45 forks, created 2022-06-01, last push 2026-08-02. Live at https://heartofphos.github.io/exile-leveling/ (GitHub Pages, HashRouter, PWA).
Repo root used below: `src/exile-leveling/` (shallow clone at HEAD `b7b2dd0`, "more graceful POB import failures, update 3.29 gems").

npm workspaces, 3 packages:
- `common/`: route DSL parser, gem-step logic, types, seeded JSON data, route text files. Pure TS, no DOM. **This is the part you can reuse.**
- `seeding/`: offline scripts that build `common/data/json/*.json` and the passive-tree JSON.
- `web/`: React 19 + Vite 8 + jotai state. Deps: pako (inflate), d3 + handlebars (tree SVG), prismjs + react-simple-code-editor (route editor), react-use-websocket-lite (auto-progress).

---

## 1. Web app features

| Feature | Where | Notes |
|---|---|---|
| **Route view** | `web/src/containers/Routes/index.tsx`, `components/TaskList`, `components/FragmentStep` | Sections (one per act) as collapsible lists. Click a step to toggle it completed. Collapse state is persisted (`state/section-collapse.ts`). Each step that changes area gets an "edge" marker (circle / play icon). Click it to set the "current" location. The view auto-scrolls to the active edge (`state/route.ts` `scrollToActiveEdgeEffect`). |
| **Fragment rendering** | `components/FragmentStep/Fragment/index.tsx` | Typed inline tokens: kill / arena / area / enter / logout / waypoint (shows destination name + act) / portal set/use / quest (NPC + quest name) / quest_text / generic / reward_quest / reward_vendor (with currency cost) / trial / ascend / crafting recipe / dir (8-way arrow) / copy (clipboard button). Icons in `Fragment/images/` (crafting, portal, quest, town, trial, waypoint). |
| **Lab** | `Fragment/index.tsx:186-220` | `{ascend|normal…}` renders a "Daily Layout" link to fixed poelab.com short URLs per difficulty. The app does not include any lab images. |
| **Sub-steps / hints** | `#sub` lines | Shown or hidden with the "Show All Hints" config option (`config.showSubsteps`). |
| **PoB import** | `components/BuildImportForm`, `state/pob/` | Accepts a raw code or a URL. URLs are rewritten for pastebin (`/raw/`), poe.ninja/pob (`/pob/raw/`), pobb.in (`/raw`), maxroll.gg/poe/pob (`/poe/api/pob/`) and YouTube redirect links. Fetches go through a CORS proxy (`web/src/utility/index.tsx:161`, `cors-proxy-weld-sigma.vercel.app`). |
| **Gem steps (quest/vendor rewards)** | `common/src/route-processing/gems.ts`, `state/route.ts` | After import, a "Take X" (quest reward) or "Buy X" (vendor, with a wisdom/transmute/alt/chance/alch cost icon from `components/GemCost`) step is inserted after each matching `{quest}` hand-in. The gem is checked against the class's allowed rewards. Starting gems and Act 1 chest gems are skipped (`findCharacterGems`). Each quest-reward gem is assigned once. Vendor count = required count − 1 if the gem was also taken as the quest reward. |
| **Per-quest gem regex** | `state/route.ts` (routeSelector) | Every quest step that has gem rewards gets a `{copy}` fragment with `"Gem A|Gem B"`, ready to paste into the vendor search. Added 2026-03 (issue #111). |
| **Gem edit** | `components/GemEditForm`, `GemEdit` | Lists the imported gems. You can change each gem's count and reorder or delete gems. |
| **Gem links sidebar** | `components/GemLinkViewer`, `state/gem-links.ts` | Link groups taken from each PoB skill set or label (primary and support gems), with the quests where each gem can be bought for your class. |
| **Passive tree viewer** | `components/SkillTreeViewer`, `state/tree/*` | Renders each PoB `<Spec>` as an SVG (d3 zoom). `url-tree-delta.ts` highlights the nodes added or removed between consecutive specs. Tooltips on nodes. Tree JSON is built per version (3.18–3.29 + alternate/Phrecia). |
| **Search strings** | `components/SearchStringsEditor`, `components/SearchStrings`, `state/search-strings.ts` | Free-text list of user regexes, one per line. A `# alias` line above a regex labels it. Shown in the sidebar with copy buttons. Links to poe.re. |
| **Config toggles** | `components/BuildInfoForm`, `components/ConfigForm` | Build data: Class (from PoB), Bandit (from PoB: None→"Kill All"/Oak/Kraityn/Alira), **League Start**, **Library**. Config: **Gems Only** (hide steps without gem rewards), **Show All Hints**. There is no "skip optional" toggle. Optional content is gated by `#ifdef LEAGUE_START` only. |
| **Route editor** | `containers/EditRoute`, `components/RouteEditor` (+`Workspace`, `CodeEditor`) | Code editor with one tab per `#section` file. Changed files are marked dirty. Ctrl+S saves. Import accepts pasted text or a pastebin URL. Export copies the concatenated source to the clipboard. Reset restores the bundled route. There is an in-app help modal generated from `FragmentDescriptionLookup` (`common/src/route-processing/fragment/language.ts`). Parse warnings and errors go only to `console` (`ScopedLogger`). |
| **Auto-progress** | `components/AutoProgress/index.tsx`, `state/route.ts` `activeEdgeAtom` | Connects over WebSocket to `ws://localhost:6754`, served by the companion Rust app **heartofphos/exile-log-api** (MIT). That app finds the PoE process cwd → `logs/LatestClient.txt`, tails it and broadcasts lines that match `Generating level \d+ area`. The web app only advances if the area id equals `edges[active+1]`, so it moves strictly one edge at a time and never jumps ahead. Added 2026-07 (PR #112). |
| **3rd-Party Export** | `components/Navbar/index.tsx:51-56` | Copies `JSON.stringify([...route.sections, "pob-code:<code or none>"])` to the clipboard. This is the format LLK-UI / Exile UI used to import (see §4). |
| **Section nav** | Navbar "Sections" accordion | Jumps to `#section-<name>`. |
| **Persistence** | `web/src/state/index.ts` `persistentAtom` | Everything is in `localStorage` as versioned JSON entries `{version, value}`. If the version doesn't match, the stored value is dropped. Keys: `pob-code`, `build-data`, `required-gems`, `build-trees`, `gem-links`, `config`, `route-files` (custom route; `null` = bundled), `search-strings`, `active-edge`, plus toggle sets for route progress, gem progress and section collapse (`state/toggle-state.ts`). A PoB import or reset clears progress. There is no cloud sync and no profiles: one build per browser. |
| **Not present** | | Zone layout images, maps, act/zone timers, level/XP advice beyond `#sub Recommended Level: N` text, localization (issues #31/#88 open), PoE2. |

---

## 2. Route data format

### 2.1 DSL (line-oriented, `common/src/route-processing/index.ts` + `fragment/index.ts`)

Line kinds, matched in this order (`ROUTE_PATTERNS`):
- `#section <Name>`: starts a new section/file (`getRouteFiles` splits on these).
- `#ifdef X` / `#ifndef X` / `#endif`: preprocessor checked against `RouteState.preprocessorDefinitions`. Indentation is **enforced at 4 spaces per nesting level**; a wrong indent only produces a warning.
- `#sub <text>`: sub-step (hint) attached to the previous step, indented one level deeper.
- Any other line is a step: free text mixed with `{fragment|arg|arg}` tokens. `#…` at the end of a line is a comment, used as a human-readable area or quest name.

Fragment vocabulary (`Language.Fragment`, 18 kinds): `kill|Name`, `arena|Name`, `area|areaId`, `enter|areaId`, `logout`, `waypoint` / `waypoint|areaId` (use), `waypoint_get`, `portal|set` / `portal|use`, `quest|questId[|rewardOfferId…]`, `quest_text|Text`, `generic|Text`, `reward_quest|Item`, `reward_vendor|Item[|cost]`, `trial`, `ascend|normal|cruel|merciless|eternal`, `crafting[|areaId]`, `dir|degrees` (multiple of 45), `copy|text`.

Example (`common/data/routes/act-1.txt`):
```
#section Act 1
Find and kill {kill|Hillock}
➞ {enter|1_1_town} #Lioneye's Watch
Hand in {quest|a1q1} #Enemy at the Gate
➞ {enter|1_1_2} #The Coast
#ifdef LEAGUE_START
    Get {waypoint_get}
#endif
➞ {enter|1_1_3} #The Mud Flats
Find 3x{quest_text|Glyph}
    #sub Little streams connect the 3 Rhoa nests
➞ {enter|1_1_4_1} #The Submerged Passage
#ifdef LEAGUE_START
    {waypoint|1_1_2} #The Coast
    ➞ {enter|1_1_2a} #The Tidal Island
    Find and kill {kill|Hailrake}, take {quest_text|Medicine Chest}
        #sub Go {dir|270}
    {logout}
    Hand in {quest|a1q4} #Breaking Some Eggs
#endif
Hand in {quest|a1q2|a1q2b} #The Caged Brute
```

**The parser simulates game state as it goes.** `RouteState` holds the current area, the last town, the portal area, and the sets of implicit/explicit/used waypoints and crafting areas. On top of syntax checks it validates semantics:
- `enter` must target an area connected to the current one.
- `waypoint|X` requires that X's waypoint was already obtained, either explicitly via `waypoint_get`, implicitly by visiting a town, or by killing a boss listed in `kill-waypoints.json`. The current area must also have a waypoint.
- `portal` validity, `ascend` only in `Labyrinth_Airlock`, unused waypoints, and a warning for any area that has a crafting recipe but no `{crafting}` step.

Each step that changes area records an **edge** (`route.edges[]` = ordered list of area ids). Auto-progress matches against these edges.

Preprocessor defines are set in `web/src/state/route.ts`:
- `LEAGUE_START` (22 uses in the routes) and `LIBRARY` (1 use) come from the build-data checkboxes.
- `BANDIT_KILL` / `BANDIT_OAK` / `BANDIT_KRAITYN` / `BANDIT_ALIRA` come from the PoB bandit attribute; they select different Act 2 routing and the Act 10 passive count.

Output type, `RouteData.Route` (`common/src/types.d.ts`):
```ts
{ sections: { name, steps: (FragmentStep | GemStep)[] }[], edges: areaId[] }
FragmentStep = { type:"fragment_step", parts:(string|Fragment)[], subSteps:FragmentStep[], edgeIndex:number|null }
GemStep      = { type:"gem_step", requiredGem:{id,note,count}, rewardType:"quest"|"vendor", count }
```

Bundled route: `common/data/routes/act-1.txt` … `act-10.txt`, about 28 KB of text in total, Acts 1–10, speedrun-oriented. The README says the author does not accept route PRs ("keep in line with current speedrunning strategies"); users are pointed to the editor for changes.

### 2.2 Seeded data and its sources (`seeding/src/`)

| Output (`common/data/json/`) | Size | Count | Source | Shape |
|---|---|---|---|---|
| `areas.json` | 53 KB | 163 | GGG `.dat` exports: `WorldAreas`, `MapPins`, `RecipeUnlockDisplay` (`seeding/src/seeding/areas.ts`). BFS over `Connections_WorldAreasKeys` from seed ids `1_1_1` + the 4 lab boss areas | `{id,name,map_name,act,level,has_waypoint,is_town_area,parent_town_area_id,connection_ids[],crafting_recipes[]}` |
| `quests.json` | 304 KB | 94 | dat: `Quest`, `QuestRewardOffers`, `QuestRewards`, `NPCTalk`, `NPCs`, `Characters`, `BaseItemTypes`. Vendor rewards come from the **poewiki.net Cargo API** (`vendor_rewards` ⋈ `items`, `seeding/src/wiki.ts`) because `QuestVendorRewards.dat` no longer exists | `{id,name,act,reward_offers:{[offerId]:{quest_npc, quest:{[itemId]:{classes[]}}, vendor:{[itemId]:{classes[],npc}}}}}`. Hand-written hacks: `a1q2b` / `a1q4b` split offers, skip `a2q9`, NPC overrides for `a2q7` / `a9q2` |
| `gems.json` | 196 KB | 846 | dat: `SkillGems`, `BaseItemTypes`, `GemEffects`, `GrantedEffects`, `GrantedEffectsPerLevel` | `{id:"Metadata/Items/Gems/…", name, primary_attribute, required_level, is_support}` |
| `vaal-gem-lookup.json`, `awakened-gem-lookup.json` | ~5 KB each | | same | variant id → base gem id |
| `characters.json` | 1 KB | 7 | dat `Characters` + hardcoded chest-gem map | `{start_gem_id, chest_gem_id}` |
| `kill-waypoints.json`, `gem-colours.json` | tiny | | **hand-maintained** | boss name → waypoint area ids unlocked; attribute → hex colour |
| `common/data/tree/<ver>.json` (gitignored, built in CI) | | 3.18–3.29 + `3_27_alternate` | GGG `grindinggear/skilltree-export` raw `data.json` pinned per commit (`seeding/src/build-tree/index.ts`), with ascendancy offsets copied from PoB | compact graph used to render the SVG |

Pipeline:
1. Run **heartofphos/exile-export** (Docker data-mining tool, TypeScript) locally to dump `.datc64.json` files into `seeding/exports/data/` (gitignored). The list of 14 tables is in `seeding/src/data/index.ts`.
2. `npm run seed data -w seeding` writes the JSON files above.
3. CI (`.github/workflows/build-and-deploy.yml`) only runs `seed tree` and the web build. The data JSON is committed, so data refreshes are manual.

No RePoE and no poedb. Sources are GGG dat files, poewiki Cargo, and GGG's skilltree-export.

### 2.3 Custom routes
A custom route is just the DSL text. It is stored in `localStorage["route-files"]` as `[{name, contents}]` split per `#section`. Import accepts pasted text or a pastebin URL; export copies the text to the clipboard. The route is re-parsed in the browser against the bundled game data on every change. Defines and gem-step injection apply to custom routes exactly as they do to the default route. You can't share a route by URL, and there's no library or catalog of routes.

---

## 3. PoB import (`web/src/state/pob/process.ts`)
1. Code → `decodeBase64Url` → `pako.inflate` → UTF-8 → `DOMParser` XML.
2. `<Build className bandit>` gives the class and the bandit; `leagueStart` and `library` are forced to `true`.
3. Gems:
   - Walk `<SkillSet title>` elements, or `<Skill>` elements at the root if there are no skill sets. Only `enabled="true"` skills are used.
   - Each `<Gem gemId>` is mapped through `GEM_ID_REMAP` (PoB quirks such as `Metadata/Items/Gems/Smite`→`SkillGemSmite`, plus NewPhaseRun / NewArcticArmour), then the Vaal and Awakened lookups to get the base gem.
   - Result: a deduplicated `requiredGems[]` (`note` = skill set title or the label of the most recent empty skill, with PoB `^xRRGGBB` colour codes stripped) and `gemLinks[]` (title, primary and support gems, and for each gem the vendor quests where your class can buy it).
4. Trees: each `<Spec title treeVersion>` with its `<URL>` gives `buildTrees[]` (name, version, url); the tree viewer decodes the URL itself (`state/tree/url-tree.ts`).
5. Not extracted: items/uniques, configuration, ascendancy as a field (it is in the tree URL), notes, gem levels/quality, `<Skill>` slots, mastery choices beyond what the URL encodes.

Known failure modes: issues #107, #109 and #113 (pobb.in imports failing, often a proxy or format change). The latest commit makes failures fail softly instead of throwing.

---

## 4. How Exile UI imports it (`src/Exile-UI/modules/leveling tracker.ahk`)

**Today, Exile UI does not consume exile-leveling routes at runtime.**
- History: in Jan 2023, LLK-UI imported the web app's **"3rd-Party Export"** JSON (issue #38, fixed with LLK-UI PRs #185 and #187).
- Present: Exile UI ships its **own fork of the guide**, `data/english/[leveltracker] default guide.json` (44 KB, PoE1) and `… default guide 2.json` (32 KB, PoE2). The README credits it as "originally derived from exile-leveling" plus "cyclondefinitiv's guide" (`data/english/help tooltips.json:596`).
- Leftover: the UI string `lvltracker_importerror = ""gems only" guides are not supported"` (`data/english/UI.txt:525`) still refers to exile-leveling's Gems Only mode.

Current import flow: `Leveltracker_Import()` at line 1478, triggered from the settings menu (`modules/settings menu.ahk:3303`). It reads the **clipboard**:
- If the clipboard does **not** contain `" areaid"`, it is treated as a PoB code. A `pobb.in` URL is fetched with `/raw` appended. `Leveltracker_PobImport()` (line 2515) runs: AHK `Base64Dec` + `zlib_Decompress`, then **string-scrapes** the lower-cased XML (no XML parser). It checks for `<PathOfBuilding>` or `<PathOfBuilding2>` and extracts:
  - `classname`, `bandit`, and the ascendancy (`ascendclassid` mapped to a name through a hardcoded class table, PoE1 and PoE2);
  - every `<Spec>`: `treeVersion`, `nodes`, `masteryEffects`, title (only supported tree versions are kept; trees with no allocated nodes are dropped);
  - skill sets and gem groups, which feed gem pickups, gem links, gem-cutting (PoE2) and a vendor search string.
  
  The result is saved to `ini[2]\leveling guide<profile>.ini` under `[PoB]`.
- If the clipboard contains `" areaid"`, it is treated as Exile UI's own guide JSON (produced by its in-app guide editor, `Leveltracker_GuideEditor`, line 860). The format is an array per act (10 for PoE1, 7 for PoE2). Each act is a list of pages; a page is either an array of lines, or `{condition:["league-start","yes"|"no"], lines:[…]}`. Lines are plain text with inline markup: `areaid1_1_2 ;; the coast`, `(img:quest)`, `(img:waypoint)`, `<quest_key>`, `(quest:…)`, `(hint)__`, `(color:hex)`, `(lvl:4)`. Each act is written into the ini `[Guide] act1..actN` as a JSON string, and progress is reset to 0.

Fields that matter: the `areaid<id>` tokens. Ids are the same GGG `WorldAreas` ids exile-leveling uses, e.g. `1_1_town`. Quest keys are looked up in Exile UI's own `[leveltracker] gems.json` `_quests` table.

How the tracker advances (`modules/client log.ahk:389-451`, `Leveltracker_Progress()` at line 3160):
- On each render, `guide.target_area` is set to the last `areaid` token on the current page, skipping lines that are league-start-only or twink-only.
- When Client.txt reports an area change and `vars.log.areaID == target_area`, and the user hasn't paged manually in the last 2 s, it calls `Leveltracker("+")`. That moves to the next page whose condition holds.
- Holding `+` for 1 s fast-forwards to the next page that mentions the current area id.
- Hideout and town changes, and level changes, trigger a redraw. The overlay hides in lab, sanctum and `g3_10`.
- Progress is persisted in the ini as `[Progress] pages`.

Takeaway for us: both tools key everything on **GGG area ids taken from Client.txt `Generating level N area "<id>"`**. That is the integration contract to keep.

---

## 5. PoE2, cadence, issues

- **PoE2: none, and the author says no plans** (issue #104, open; the author "doesn't enjoy the game" and points people to Exile UI). The data pipeline is PoE1-only (`Characters`, `Quest` tables, 10 acts, seed area `1_1_1`, bandits, lab). In the ecosystem, only Exile UI has a PoE2 guide.
- **Cadence** (540 commits): heavy development Jun–Aug 2022. Since then, maintenance bursts around league launches:
  - 3.20 Dec-2022; 3.21 Apr-2023; 3.22 Aug-2023; 3.23 Dec-2023; 3.24 Mar-2024; gem/act updates Jul-2024; 3.26 tree Jun-2025; 3.27 Oct/Nov-2025; Phrecia 3.27 Jan-2026; 3.28 Mar/May-2026 (tree, Reliquarian, gems); 3.29 (Allflame) Jul/Aug-2026.
  - 2024-10 → 2025-06 had almost no commits.
  - Jul-2026 refactor: jotai migration, `common` became a module, auto-progress, maxroll import.
  - Typical lag: the tree lands at league launch; gems and route updates follow days to weeks later and are sometimes partial (e.g. "3.20 partial update").
- **Issues** (≈90 total, 10 open). Open: #104 PoE2, #96 gem-swap step, #88/#31 localization, #86 mules, #64 gem wiki links, #58 compact mode, #53 simplified route, #22 show data version, #17 single-click next/prev. Recurring closed themes:
  - PoB import breakage: #21, #49, #107, #109, #113.
  - Wrong quest/vendor gem data after patches: #59, #65, #73, #83, #87, because wiki vendor data lags.
  - Route corrections from users: #91, #92, #93, #98, #101.
  - Out of scope by design: post-Act-10 / atlas / uniques (#110 "can never be a better build tool than PoB").

---

## 6. What we can reuse (MIT) vs. weak or missing

**Reuse**
1. **`common/` as a library, nearly drop-in.** It is pure TS with no DOM: `parseRoute`, `getRouteFiles`, `buildGemSteps`, `findCharacterGems`, the types, and `FragmentDescriptionLookup`. It runs in Node, Electron, a Tauri webview, or a worker. The game-state-simulating validator (connectivity, waypoint availability, portals, crafting coverage) is the most valuable piece, and neither Exile UI nor most guides have one.
2. **The route DSL** as an authoring format. It is human-diffable, has `#ifdef` profiles, typed fragments, and computes area edges that map directly to Client.txt events. We could extend it with `#ifdef OPTIONAL`, `PoE2`, and new fragments for layout images or level gates.
3. **The seeded JSON** (`areas`, `quests` with class-gated quest and vendor rewards, `gems`, variant lookups) and the **seeding scripts**: dat table list, BFS area graph, wiki Cargo vendor-reward query, hand-written quest hacks. Pair them with exile-export, or swap in pathofexile-dat / poe-dat-viewer exports for PoE2 tables.
4. **The PoB decoder** (`web/src/state/pob/process.ts`). It's small; it needs `DOMParser`, so use a polyfill or an XML library in Node. It includes the `GEM_ID_REMAP` PoB-quirk table and the URL rewriters for pastebin, poe.ninja, pobb.in and maxroll.
5. **The auto-progress model.** `exile-log-api` (Rust, MIT) does Client.txt discovery via the process cwd and a WebSocket broadcast. "Advance only if the area equals the next edge" is a safe rule. We would do the tailing in-process.
6. **The passive-tree SVG builder and URL-tree delta** (`seeding/src/build-tree/tree.ts`, `web/src/state/tree/svg.ts`, `SkillTreeViewer/url-tree-delta.ts`), for showing "next N points" overlays.

**Weak or missing**
- PoE1 only; no PoE2 data, route, or classes. All the hacks are hardcoded PoE1 quest ids.
- Data refresh is manual and depends on a local Docker dat export plus poewiki, so it is fragile and lags patches. Vendor-reward correctness depends on the wiki.
- Auto-progress is strictly linear. It can't resync if you skip or backtrack, and it can't detect optional branches or the current page from an arbitrary area. Exile UI's 1 s-hold fast-forward is a crude version of this.
- Parse diagnostics only go to the browser console. The editor shows no inline errors.
- Only two config axes (league start, library) plus bandits. There's no "skip optional", "twink/mule" (#86), "gem swap" step (#96), or compact/simplified mode (#53, #58).
- No zone layout images, layout tips (#78 was closed without them), minimap or level/XP penalty guidance. Lab support is a link to poelab only.
- No localization (#31, #88); everything is keyed on English names.
- One build and one route per browser. No profiles, sync, or shareable route URLs; persistence is `localStorage` only.
- PoB parsing ignores items, uniques, gem levels/quality and the ascendancy order. The tree is used only for display.
- The web app can't sit over the game; that's why Exile UI forked the guide instead of importing it live. For an overlay, take `common/` and the data, not the React UI.
- Single maintainer, who declines route PRs and has scoped the project tightly (#110). Plan to fork the data and route rather than depend on upstream.
