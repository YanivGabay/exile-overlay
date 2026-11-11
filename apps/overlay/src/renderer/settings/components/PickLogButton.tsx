import { api } from "../../common/api.js";

/** "Choose Client.txt…": a file picker in main, so the player never types a path. */
export function PickLogButton({ primary }: { primary?: boolean }) {
  return (
    <button className={primary ? "primary" : ""} onClick={() => void api.send({ type: "pickClientLog" })}>
      Choose Client.txt…
    </button>
  );
}
