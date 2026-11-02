import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, win32 } from "node:path";

export type Game = "poe1" | "poe2";

export interface LocateResult {
  /** Client.txt (or LatestClient.txt) to tail, or null if none was found. */
  logPath: string | null;
  /** Game executables seen running (may be empty or contain nulls when access is denied). */
  processes: { name: string; path: string | null }[];
  /** Human-readable explanation for diagnostics. */
  detail: string;
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
export function logFileInInstall(installDir: string, exists = existsSync): string | null {
  for (const name of ["LatestClient.txt", "Client.txt", "KakaoClient.txt"]) {
    const p = join(installDir, "logs", name);
    if (exists(p)) return p;
  }
  return null;
}

/** Usual install folders, checked when no game process is running yet. */
export function defaultInstallDirs(game: Game): string[] {
  const name = game === "poe2" ? "Path of Exile 2" : "Path of Exile";
  const roots = ["C:\\Program Files (x86)", "C:\\Program Files", "D:\\", "D:\\SteamLibrary", "E:\\SteamLibrary"];
  const dirs: string[] = [];
  for (const root of roots) {
    dirs.push(win32.join(root, "Steam", "steamapps", "common", name));
    dirs.push(win32.join(root, "steamapps", "common", name));
    dirs.push(win32.join(root, "Grinding Gear Games", name));
    dirs.push(win32.join(root, "Epic Games", name.replaceAll(" ", "")));
  }
  return dirs;
}

export async function locateClientLog(game: Game, manualPath: string | null): Promise<LocateResult> {
  if (manualPath) {
    return existsSync(manualPath)
      ? { logPath: manualPath, processes: [], detail: "Using the log file chosen in settings." }
      : { logPath: null, processes: [], detail: `The log file chosen in settings does not exist: ${manualPath}` };
  }

  const processes = await listGameProcesses();
  const forGame = processes.filter((p) => p.path && gameOfExecutable(p.path) === game);
  for (const p of forGame) {
    const log = logFileInInstall(dirname(p.path!));
    if (log) return { logPath: log, processes, detail: `Found the game at ${dirname(p.path!)}.` };
  }
  if (processes.some((p) => p.path === null)) {
    return {
      logPath: null,
      processes,
      detail:
        "The game is running but Windows hides its location from us. This happens when the game runs as administrator. Run Exile Overlay as administrator too, or pick the log file by hand.",
    };
  }
  for (const dir of defaultInstallDirs(game)) {
    const log = logFileInInstall(dir);
    if (log) return { logPath: log, processes, detail: `Found an install at ${dir}.` };
  }
  return {
    logPath: null,
    processes,
    detail: processes.length
      ? "The game is running, but its logs folder was not found."
      : "Start the game and the log file is found automatically.",
  };
}
