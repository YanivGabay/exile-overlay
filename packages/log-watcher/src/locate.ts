import { execFile } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, win32 } from "node:path";

export type Game = "poe1" | "poe2";

export interface LocateResult {
  /** Client.txt (or LatestClient.txt) to tail, or null if none was found. */
  logPath: string | null;
  /** Game executables seen running (may be empty or contain nulls when access is denied). */
  processes: { name: string; path: string | null }[];
  /** Human-readable explanation for diagnostics. */
  detail: string;
  /** Install folders checked for a logs folder. */
  searched?: string[];
  /** Where we looked, in a few plain lines for the player. */
  looked?: string[];
}

/** Process names used by the standalone, Steam, Epic and Kakao clients. */
const PROCESS_FILTER = "Name LIKE 'PathOfExile%'";

/**
 * Lists running game processes with their executable paths via PowerShell
 * (no native module needed). Path is null when the game runs elevated and we
 * don't — the diagnostics screen explains that case.
 */
export function listGameProcesses(): Promise<{ name: string; path: string | null }[]> {
  if (process.platform !== "win32") return Promise.resolve([]);
  const script = `Get-CimInstance Win32_Process -Filter "${PROCESS_FILTER}" | ForEach-Object { $_.Name + '|' + $_.ExecutablePath }`;
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { windowsHide: true, timeout: 10_000 },
      (err, stdout) => {
        if (err) return resolve([]);
        resolve(
          stdout
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => {
              const [name, path] = l.split("|");
              return { name, path: path ? path : null };
            }),
        );
      },
    );
  });
}

/** PoE2 installs live in a folder named "Path of Exile 2". */
export function gameOfExecutable(exePath: string): Game {
  return /path of exile 2/i.test(win32.dirname(exePath)) ? "poe2" : "poe1";
}

/** Prefer LatestClient.txt (current session only, small) when the client writes it. */
export function logFileInInstall(installDir: string, exists: (p: string) => boolean = existsSync): string | null {
  for (const name of ["LatestClient.txt", "Client.txt", "KakaoClient.txt"]) {
    const p = join(installDir, "logs", name);
    if (exists(p)) return p;
  }
  return null;
}

/** Install folder names (Steam, standalone and Epic all use them). */
const STEAM_FOLDER = { poe1: "Path of Exile", poe2: "Path of Exile 2" } as const;

/** Library folders from Steam's steamapps/libraryfolders.vdf (every drive Steam installs games on). */
export function parseSteamLibraries(vdf: string): string[] {
  const out: string[] = [];
  for (const m of vdf.matchAll(/"path"\s+"((?:[^"\\]|\\.)*)"/g)) out.push(m[1].replace(/\\\\/g, "\\"));
  return out;
}

/** Where the registry says the game and Steam are; injectable for tests. */
export interface InstallHints {
  /** Standalone client's InstallLocation (GrindingGearGames registry key). */
  standalone: string[];
  /** Steam's own folder (SteamPath). */
  steamRoot: string | null;
  /** Contents of steamapps/libraryfolders.vdf, if readable. */
  steamLibrariesVdf: string | null;
  /**
   * Local fixed disks ("C", "D", …). Only these get the folder scan: checking a
   * folder on a disconnected network drive can block for seconds, and the
   * search repeats every few seconds until the game is found.
   */
  drives?: string[] | null;
}

/** Local fixed disks via PowerShell (DriveType 3); null if unknown. */
export function listFixedDrives(): Promise<string[] | null> {
  if (process.platform !== "win32") return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", `Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object { $_.DeviceID }`],
      { windowsHide: true, timeout: 10_000 },
      (err, stdout) => {
        if (err) return resolve(null);
        const drives = [...stdout.matchAll(/^([A-Z]):\s*$/gim)].map((m) => m[1].toUpperCase());
        resolve(drives.length ? drives : null);
      },
    );
  });
}

/** Reads one registry value with reg.exe (no native module). Null if missing. */
export function readRegistryValue(key: string, value: string): Promise<string | null> {
  if (process.platform !== "win32") return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile("reg.exe", ["query", key, "/v", value], { windowsHide: true, timeout: 5000 }, (err, stdout) => {
      if (err) return resolve(null);
      const m = new RegExp(`${value}\\s+REG_\\w+\\s+(.+)`).exec(stdout);
      resolve(m ? m[1].trim() : null);
    });
  });
}

// The log search retries every few seconds until the game shows up; the registry
// doesn't change that fast, so ask it at most once a minute.
const hintCache = new Map<Game, { at: number; hints: Promise<InstallHints> }>();

export function readInstallHints(game: Game): Promise<InstallHints> {
  const hit = hintCache.get(game);
  if (hit && Date.now() - hit.at < 60_000) return hit.hints;
  const hints = queryInstallHints(game);
  hintCache.set(game, { at: Date.now(), hints });
  return hints;
}

async function queryInstallHints(game: Game): Promise<InstallHints> {
  const name = STEAM_FOLDER[game];
  const standalone = (
    await Promise.all([
      readRegistryValue(`HKCU\\Software\\GrindingGearGames\\${name}`, "InstallLocation"),
      readRegistryValue(`HKLM\\SOFTWARE\\WOW6432Node\\GrindingGearGames\\${name}`, "InstallLocation"),
    ])
  ).filter((d): d is string => !!d);
  const steamRoot =
    (await readRegistryValue("HKCU\\Software\\Valve\\Steam", "SteamPath")) ??
    (await readRegistryValue("HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam", "InstallPath"));
  let steamLibrariesVdf: string | null = null;
  if (steamRoot) {
    try {
      steamLibrariesVdf = readFileSync(win32.join(win32.normalize(steamRoot), "steamapps", "libraryfolders.vdf"), "utf8");
    } catch {
      /* Steam installed but never ran, or no access */
    }
  }
  return { standalone, steamRoot, steamLibrariesVdf, drives: await listFixedDrives() };
}

/**
 * Install folders to look in when no game process is running yet, most likely
 * first: the standalone client's registry entry, every Steam library, then the
 * usual folders on every drive letter.
 */
export function candidateInstallDirs(game: Game, hints: InstallHints | null = null): string[] {
  const name = STEAM_FOLDER[game];
  const dirs: string[] = [];
  const add = (d: string) => dirs.push(win32.normalize(d).replace(/\\+$/, ""));
  for (const d of hints?.standalone ?? []) add(d);
  const libraries = [
    ...(hints?.steamRoot ? [hints.steamRoot] : []),
    ...(hints?.steamLibrariesVdf ? parseSteamLibraries(hints.steamLibrariesVdf) : []),
  ];
  for (const lib of libraries) add(win32.join(win32.normalize(lib), "steamapps", "common", name));
  // Unknown disks (PowerShell failed): the usual game drives only.
  const drives = hints?.drives?.length ? hints.drives : ["C", "D", "E"];
  for (const drive of drives) {
    const roots = drive === "C" ? ["C:\\Program Files (x86)", "C:\\Program Files", "C:\\"] : [`${drive}:\\`, `${drive}:\\Program Files (x86)`, `${drive}:\\Program Files`, `${drive}:\\Games`];
    for (const root of roots) {
      add(win32.join(root, "Steam", "steamapps", "common", name));
      add(win32.join(root, "SteamLibrary", "steamapps", "common", name));
      add(win32.join(root, "Grinding Gear Games", name));
      add(win32.join(root, name));
      add(win32.join(root, "Epic Games", name.replaceAll(" ", "")));
    }
  }
  const seen = new Set<string>();
  return dirs.filter((d) => {
    const k = d.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** @deprecated kept for callers; use candidateInstallDirs. */
export function defaultInstallDirs(game: Game): string[] {
  return candidateInstallDirs(game);
}

export interface LocateDeps {
  listProcesses: () => Promise<{ name: string; path: string | null }[]>;
  hints: (game: Game) => Promise<InstallHints>;
  exists: (p: string) => boolean;
  /** Last write time (ms) of a file; 0 if unknown. */
  mtime: (p: string) => number;
}

const realDeps: LocateDeps = {
  listProcesses: listGameProcesses,
  hints: readInstallHints,
  exists: existsSync,
  mtime: (p) => {
    try {
      return statSync(p).mtimeMs;
    } catch {
      return 0;
    }
  },
};

export async function locateClientLog(game: Game, manualPath: string | null, deps: LocateDeps = realDeps): Promise<LocateResult> {
  if (manualPath) {
    return deps.exists(manualPath)
      ? { logPath: manualPath, processes: [], detail: "Using the log file chosen in settings." }
      : { logPath: null, processes: [], detail: `The log file chosen in settings does not exist: ${manualPath}` };
  }

  const processes = await deps.listProcesses();
  const forGame = processes.filter((p) => p.path && gameOfExecutable(p.path) === game);
  for (const p of forGame) {
    const log = logFileInInstall(win32.dirname(p.path!), deps.exists);
    if (log) return { logPath: log, processes, detail: `Found the running game at ${win32.dirname(p.path!)}.` };
  }
  if (processes.some((p) => p.path === null)) {
    return {
      logPath: null,
      processes,
      detail:
        "The game is running but Windows hides its location from us. This happens when the game runs as administrator. Run Exile Overlay as administrator too, or pick the log file by hand.",
    };
  }
  const hints = await deps.hints(game).catch(() => null);
  const searched = candidateInstallDirs(game, hints);
  // Windows paths ignore case: Steam's registry entry is often lower case, the vdf isn't (keep the vdf's).
  const libraries: string[] = [];
  for (const l of [...(hints?.steamLibrariesVdf ? parseSteamLibraries(hints.steamLibrariesVdf) : []), ...(hints?.steamRoot ? [hints.steamRoot] : [])]) {
    const n = win32.normalize(l);
    if (!libraries.some((x) => x.toLowerCase() === n.toLowerCase())) libraries.push(n);
  }
  const looked = [
    hints?.standalone.length ? `The standalone client's folder from Windows: ${hints.standalone.join(", ")}` : "No standalone client registered in Windows",
    libraries.length ? `Steam libraries: ${libraries.join(", ")}` : "No Steam install found",
    `The usual game folders on ${(hints?.drives?.length ? hints.drives : ["C", "D", "E"]).map((d) => `${d}:`).join(", ")}`,
  ];
  // Several installs (say Steam and standalone): the one written to most recently is the one you play.
  const found = searched
    .map((dir) => ({ dir, log: logFileInInstall(dir, deps.exists) }))
    .filter((f): f is { dir: string; log: string } => !!f.log)
    .sort((a, b) => deps.mtime(b.log) - deps.mtime(a.log));
  if (found.length) {
    const more = found.length > 1 ? ` (the most recently played of ${found.length} installs)` : "";
    return { logPath: found[0].log, processes, detail: `Found an install at ${found[0].dir}${more}.`, searched, looked };
  }
  return {
    logPath: null,
    processes,
    searched,
    looked,
    detail: processes.length
      ? "The game is running, but its logs folder was not found."
      : "Start the game and the log file is found automatically.",
  };
}
