import { inflateSync } from "node:zlib";

/**
 * Turn whatever the user pasted (a PoB export code or a share link) into a
 * PoB export code, and check that it decodes. Links are fetched directly
 * from the main process, so no CORS proxy is needed.
 */
const LINK_REWRITES: [RegExp, (m: RegExpExecArray) => string][] = [
  [/pobb\.in\/([\w-]+)/, (m) => `https://pobb.in/${m[1]}/raw`],
  [/pastebin\.com\/(?:raw\/)?(\w+)/, (m) => `https://pastebin.com/raw/${m[1]}`],
  [/poe\.ninja\/pob\/(?:raw\/)?([\w-]+)/, (m) => `https://poe.ninja/pob/raw/${m[1]}`],
  [/maxroll\.gg\/poe\/pob\/([\w-]+)/, (m) => `https://maxroll.gg/poe/api/pob/${m[1]}`],
];

export function decodePobCode(code: string): string {
  const b64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  const xml = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
  if (!xml.includes("<PathOfBuilding")) throw new Error("This is not a Path of Building code.");
  return xml;
}

export function linkToRawUrl(input: string): string | null {
  for (const [re, toUrl] of LINK_REWRITES) {
    const m = re.exec(input);
    if (m) return toUrl(m);
  }
  return null;
}

export type PobImportResult = { ok: true; code: string } | { ok: false; error: string };

export async function importPob(input: string): Promise<PobImportResult> {
  const text = input.trim();
  if (!text) return { ok: false, error: "Paste a Path of Building code or link first." };
  let code = text;
  const url = linkToRawUrl(text);
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return { ok: false, error: `Could not download the build (${res.status}).` };
      const body = (await res.text()).trim();
      // maxroll answers with JSON { data: "<code>" }; the others with the raw code.
      code = body.startsWith("{") ? String((JSON.parse(body) as { data?: unknown }).data ?? "") : body;
    } catch {
      return { ok: false, error: "Could not download the build. Check the link and your connection." };
    }
  } else if (/^https?:\/\//.test(text)) {
    return { ok: false, error: "Unsupported link. Use pobb.in, pastebin, poe.ninja or maxroll, or paste the code." };
  }
  try {
    decodePobCode(code);
    return { ok: true, code };
  } catch {
    return { ok: false, error: "That doesn't look like a Path of Building code." };
  }
}
