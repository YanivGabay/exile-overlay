import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LogTailer, baseClassOf, candidateInstallDirs, gameOfExecutable, locateClientLog, logFileInInstall, parseLine, parseSteamLibraries, type InstallHints, type LocateDeps } from "./index.js";

const P = "2026/11/02 20:01:02 123456789 cff94598";

describe("parseLine", () => {
  it("parses area generation", () => {
    expect(parseLine(`${P} [DEBUG Client 1234] Generating level 2 area "1_1_2" with seed 1234567`)).toEqual({
      type: "areaGenerated",
      time: "2026/11/02 20:01:02",
      areaId: "1_1_2",
      areaLevel: 2,
      seed: 1234567,
    });
  });

  it("parses level-ups including ascendancy names", () => {
    expect(parseLine(`${P} [INFO Client 1234] : Fancy_Name (Juggernaut) is now level 72`)).toMatchObject({
      type: "levelUp",
      character: "Fancy_Name",
      className: "Juggernaut",
      level: 72,
    });
    expect(baseClassOf("Juggernaut")).toBe("Marauder");
    expect(baseClassOf("Witch")).toBe("Witch");
  });

  it("ignores chat that looks like a level-up", () => {
    expect(parseLine(`${P} [INFO Client 1234] #Someone: Bob (Witch) is now level 5`)).toBeNull();
    expect(parseLine("garbage")).toBeNull();
  });

  it("detects the login screen and character select", () => {
    expect(parseLine("2026/11/02 20:11:51 ***** LOG FILE OPENING *****")).toMatchObject({ type: "outOfGame", reason: "clientStart" });
    expect(parseLine(`${P} [INFO Client 29352] Async connecting to lon.login.pathofexile.com:20487`)).toMatchObject({
      type: "outOfGame",
      reason: "loginServer",
    });
    // Zone changes connect to the instance server, not the login server.
    expect(parseLine(`${P} [INFO Client 29352] Connecting to instance server at 1.2.3.4:6112`)).toBeNull();
  });

  it("parses Kitava's penalty, the end of the campaign and deaths", () => {
    expect(
      parseLine(`${P} [INFO Client 1] : You have been permanently weakened by Kitava's cruel affliction. You now have -30% to all Resistances.`),
    ).toMatchObject({ type: "resistPenalty", total: -30 });
    expect(parseLine(`${P} [INFO Client 1] Sin: May a new dawn arise!`)).toMatchObject({ type: "campaignComplete" });
    expect(parseLine(`${P} [INFO Client 1] : Tester_One has been slain.`)).toMatchObject({ type: "death", character: "Tester_One" });
    // Someone else's chat line must not count.
    expect(parseLine(`${P} [INFO Client 1] #Bob: Tester_One has been slain.`)).toBeNull();
  });

  it("parses the English 'entered' line", () => {
    expect(parseLine(`${P} [INFO Client 1234] : You have entered The Coast.`)).toMatchObject({
      type: "areaEntered",
      areaName: "The Coast",
    });
  });
});

describe("locate helpers", () => {
  it("tells PoE1 and PoE2 apart by install folder", () => {
    expect(gameOfExecutable("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\PathOfExileSteam.exe")).toBe("poe1");
    expect(gameOfExecutable("D:\\Games\\Path of Exile 2\\PathOfExile.exe")).toBe("poe2");
  });

  it("prefers LatestClient.txt", () => {
    const latest = join("/g", "logs", "LatestClient.txt");
    const files = new Set([join("/g", "logs", "Client.txt"), latest]);
    expect(logFileInInstall("/g", (p) => files.has(p.toString()))).toBe(latest);
  });
});

describe("LogTailer", () => {
  it("replays the tail, then emits appended lines", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-log-"));
    const file = join(dir, "Client.txt");
    writeFileSync(file, "old line 1\nold line 2\n");
    const tailer = new LogTailer(file, { pollMs: 10 });
    const batches: [string[], boolean][] = [];
    tailer.on("lines", (lines, replay) => batches.push([lines, replay]));
    await tailer.start();
    appendFileSync(file, "new line ");
    appendFileSync(file, "complete\n");
    await new Promise((r) => setTimeout(r, 60));
    writeFileSync(file, "after truncate\n");
    await new Promise((r) => setTimeout(r, 60));
    tailer.stop();
    expect(batches[0]).toEqual([["old line 1", "old line 2"], true]);
    const live = batches.slice(1).flatMap(([l]) => l);
    expect(live).toEqual(["new line complete", "after truncate"]);
  });

  it("drops the partial first line when starting mid-file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-log-"));
    const file = join(dir, "Client.txt");
    writeFileSync(file, "aaaaaaaaaa\nbbb\nccc\n");
    const tailer = new LogTailer(file, { pollMs: 10, replayBytes: 10 });
    const got: string[] = [];
    tailer.on("lines", (l) => got.push(...l));
    await tailer.start();
    tailer.stop();
    expect(got).toEqual(["bbb", "ccc"]);
  });
});

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
