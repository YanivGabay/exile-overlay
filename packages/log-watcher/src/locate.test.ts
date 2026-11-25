import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { candidateInstallDirs, locateClientLog, parseSteamLibraries, type InstallHints, type LocateDeps } from "./index.js";

describe("finding the game's log on a fresh install", () => {
  // Same shape as a real libraryfolders.vdf (Steam on C:, a second library elsewhere).
  const VDF = `"libraryfolders"
{
	"0"
	{
		"path"		"C:\\\\Program Files (x86)\\\\Steam"
		"apps"
		{
			"228980"		"215019902"
		}
	}
	"1"
	{
		"path"		"K:\\\\Games\\\\SteamLib"
		"apps"
		{
			"238960"		"40000000000"
		}
	}
}`;
  const hints = (over: Partial<InstallHints> = {}): InstallHints => ({ standalone: [], steamRoot: null, steamLibrariesVdf: null, ...over });
  const deps = (files: Record<string, number>, h = hints(), processes: { name: string; path: string | null }[] = []): LocateDeps => ({
    listProcesses: async () => processes,
    hints: async () => h,
    exists: (p) => p in files,
    mtime: (p) => files[p] ?? 0,
  });
  const logIn = (dir: string, name = "Client.txt") => join(dir, "logs", name);

  it("reads every Steam library from libraryfolders.vdf", () => {
    expect(parseSteamLibraries(VDF)).toEqual(["C:\\Program Files (x86)\\Steam", "K:\\Games\\SteamLib"]);
  });

  it("looks in the standalone install from the registry first, then Steam libraries, then common folders", () => {
    const dirs = candidateInstallDirs("poe1", hints({ standalone: ["E:\\My Games\\Path of Exile\\"], steamRoot: "c:/program files (x86)/steam", steamLibrariesVdf: VDF }));
    expect(dirs[0]).toBe("E:\\My Games\\Path of Exile");
    expect(dirs[1].toLowerCase()).toBe("c:\\program files (x86)\\steam\\steamapps\\common\\path of exile");
    expect(dirs).toContain("K:\\Games\\SteamLib\\steamapps\\common\\Path of Exile");
    expect(dirs).toContain("C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile");
    expect(dirs).toContain("F:\\SteamLibrary\\steamapps\\common\\Path of Exile");
    // No duplicates (Steam's own library appears both as SteamPath and in the vdf).
    expect(new Set(dirs.map((d) => d.toLowerCase())).size).toBe(dirs.length);
  });

  it("finds a Steam install on a drive the folder scan doesn't cover", async () => {
    const dir = "K:\\Games\\SteamLib\\steamapps\\common\\Path of Exile";
    const r = await locateClientLog("poe1", null, deps({ [logIn(dir)]: 1 }, hints({ steamRoot: "C:\\Program Files (x86)\\Steam", steamLibrariesVdf: VDF })));
    expect(r.logPath).toBe(logIn(dir));
  });

  it("picks the most recently played install when there are several", async () => {
    const steam = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile";
    const standalone = "C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile";
    const r = await locateClientLog("poe1", null, deps({ [logIn(steam)]: 100, [logIn(standalone)]: 900 }, hints({ steamRoot: "C:\\Program Files (x86)\\Steam" })));
    expect(r.logPath).toBe(logIn(standalone));
    expect(r.detail).toMatch(/most recently played of 2/);
  });

  it("prefers the running game's own folder", async () => {
    const odd = "Z:\\Odd\\Place";
    const r = await locateClientLog("poe1", null, deps({ [logIn(odd)]: 1 }, hints(), [{ name: "PathOfExile.exe", path: `${odd}\\PathOfExile.exe` }]));
    expect(r.logPath).toBe(logIn(odd));
  });

  it("says where it looked when nothing is found", async () => {
    const r = await locateClientLog("poe1", null, deps({}));
    expect(r.logPath).toBeNull();
    expect(r.searched!.length).toBeGreaterThan(20);
    expect(r.detail).toMatch(/Start the game/);
  });
});
