import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LogTailer, baseClassOf, gameOfExecutable, logFileInInstall, parseLine } from "./index.js";

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
