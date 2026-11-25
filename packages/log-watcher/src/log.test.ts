import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

describe("log formats of the last five patches (3.26 to 3.30)", () => {
  // One real line per event type from each patch, names and dates anonymized.
  const fixtures = JSON.parse(readFileSync(new URL("../test-fixtures/patch-lines.json", import.meta.url), "utf8")) as Record<
    string,
    { expect: string | null; line: string }[]
  >;

  it("covers 3.26, 3.27, 3.28, 3.29 and 3.30", () => {
    expect(Object.keys(fixtures).map((v) => v.split(".").slice(0, 2).join("."))).toEqual(
      expect.arrayContaining(["3.26", "3.27", "3.28", "3.29", "3.30"]),
    );
  });

  for (const [version, lines] of Object.entries(fixtures)) {
    it(`parses every event line from ${version}`, () => {
      for (const { expect: type, line } of lines) expect(parseLine(line)?.type ?? null, line).toBe(type);
    });
  }

  it("recognises other players joining and leaving your area", () => {
    expect(parseLine(`${P} [INFO Client 1] : Friend_One has joined the area.`)).toMatchObject({ type: "otherPlayer", character: "Friend_One" });
    expect(parseLine(`${P} [INFO Client 1] : Friend_One has left the area.`)).toMatchObject({ type: "otherPlayer", character: "Friend_One" });
    expect(parseLine(`${P} [INFO Client 1] #Bob: Friend_One has joined the area.`)).toBeNull();
  });

  it("treats a disconnect as leaving the game", () => {
    for (const why of ["An unexpected disconnection occurred.", "The realm is currently down for maintenance. Try again later.", "Game server lost contact with the realm."])
      expect(parseLine(`${P} [INFO Client 1] Abnormal disconnect: ${why}`)).toMatchObject({ type: "outOfGame", reason: "disconnect" });
    expect(parseLine(`${P} [INFO Client 1] #Bob: Abnormal disconnect: lol`)).toBeNull();
  });
});

describe("LogTailer under load", () => {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it("reads a big burst over several polls, in order, without one huge buffer", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-log-"));
    const file = join(dir, "Client.txt");
    writeFileSync(file, "");
    const tailer = new LogTailer(file, { pollMs: 5, maxReadBytes: 1000 });
    const batches: string[][] = [];
    tailer.on("lines", (l) => batches.push(l));
    await tailer.start();
    const lines = Array.from({ length: 2000 }, (_, i) => `line ${i}`);
    appendFileSync(file, lines.join("\r\n") + "\r\n");
    for (let i = 0; i < 200 && batches.flat().length < lines.length; i++) await wait(5);
    tailer.stop();
    expect(batches.flat()).toEqual(lines);
    expect(batches.length).toBeGreaterThan(10);
    expect(Math.max(...batches.map((b) => b.join("\n").length))).toBeLessThanOrEqual(1000);
  });

  it("drops a runaway line with no newline and keeps going", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-log-"));
    const file = join(dir, "Client.txt");
    writeFileSync(file, "");
    const tailer = new LogTailer(file, { pollMs: 5 });
    const got: string[] = [];
    tailer.on("lines", (l) => got.push(...l));
    await tailer.start();
    appendFileSync(file, "\0".repeat(100 * 1024));
    await wait(30);
    appendFileSync(file, "\nreal line\n");
    await wait(30);
    tailer.stop();
    expect(got.at(-1)).toBe("real line");
    expect(got.every((l) => l.length < 64 * 1024)).toBe(true);
  });

  it("emits nothing after stop()", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-log-"));
    const file = join(dir, "Client.txt");
    writeFileSync(file, "");
    const tailer = new LogTailer(file, { pollMs: 5 });
    const got: string[] = [];
    tailer.on("lines", (l) => got.push(...l));
    await tailer.start();
    tailer.stop();
    appendFileSync(file, "late\n");
    await wait(30);
    expect(got).toEqual([]);
  });
});
