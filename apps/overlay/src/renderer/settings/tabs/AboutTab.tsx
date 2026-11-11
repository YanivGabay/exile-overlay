import { api } from "../../common/api.js";
import type { AppState } from "../../../shared/types.js";
import { Credits } from "../components/Credits.js";
import { UpdateBox } from "../components/UpdateBox.js";

export function AboutTab({ state }: { state: AppState }) {
  return (
    <section>
      <h1>About</h1>
      <UpdateBox state={state} />
      <p>Exile Overlay is free and open source (MIT).</p>
      <h2>What it reads and sends</h2>
      <ul className="small">
        <li>Reads the game's log file (Client.txt) to know which zone you are in, your character's name, class and level.</li>
        <li>Never reads or changes game memory or files, and never sends keys or clicks to the game.</li>
        <li>Downloads guide updates, and the build links you paste. Nothing about you is uploaded.</li>
        <li>Draws in its own window on top of the game. It never moves or resizes the game window.</li>
      </ul>
      <h2>Credits</h2>
      <p className="small">
        The route language, the initial route and game data come from{" "}
        <button className="link" onClick={() => void api.send({ type: "openExternal", url: "https://github.com/HeartofPhos/exile-leveling" })}>
          exile-leveling
        </button>{" "}
        by HeartofPhos (MIT).
      </p>
      <h2>Sources for tips and route</h2>
      <p className="small muted">Tips are written in our own words from these public guides. The creators don't endorse Exile Overlay.</p>
      <Credits />
      <p className="muted small">This product isn't affiliated with or endorsed by Grinding Gear Games in any way.</p>
    </section>
  );
}
