import { api, useGuide } from "../../common/api.js";

export function Credits() {
  const guide = useGuide();
  const credits = guide?.campaign?.credits ?? [];
  if (!credits.length) return null;
  return (
    <ul className="small">
      {credits.map((c) => (
        <li key={c.key}>
          <button className="link" onClick={() => void api.send({ type: "openExternal", url: c.url })}>
            {c.title}
          </button>{" "}
          by {c.creator}
          {c.license ? ` (${c.license})` : ""}
        </li>
      ))}
    </ul>
  );
}
