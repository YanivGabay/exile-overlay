import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AppStateStore } from "../state/app-state.js";
import { GameLog } from "./game-log.js";
import { SettingsStore } from "../state/settings-store.js";
import { DEFAULT_SETTINGS } from "../../shared/defaults.js";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("GameLog", () => {
  it("knows when the player is at character select and when in a zone", async () => {
    const dir = mkdtempSync(join(tmpdir(), "eo-gamelog-"));
    const log = join(dir, "Client.txt");
    // Same shape as a real session: in town, then logged out to character select.
    writeFileSync(
      log,
      [
        "2026/11/02 20:11:51 ***** LOG FILE OPENING *****",
        '2026/11/02 20:12:05 1 a [DEBUG Client 1] Generating level 13 area "1_1_town" with seed 1',
        "2026/11/02 20:12:06 1 a [INFO Client 1] : You have entered Lioneye's Watch.",
        "2026/11/02 20:27:23 1 a [INFO Client 1] Async connecting to lon.login.pathofexile.com:20487",
        "",
      ].join("\r\n"),
    );
    const settings = { ...structuredClone(DEFAULT_SETTINGS), game: { ...DEFAULT_SETTINGS.game, clientLogPath: log } };
    const state = new AppStateStore(
      {
        appVersion: "t",
        settings,
        overlay: { attached: true, targetFocused: true, bounds: null, editing: false, hidden: false },
        game: { logStatus: { kind: "searching" }, inGame: null, area: null, character: null },
        guide: { state: "loading", source: null, version: null, gameVersion: null, title: null, message: null },
        tracking: null,
      },
      SettingsStore.inDir(dir),
    );
    const gl = new GameLog(state);
    const live: string[] = [];
    gl.on("event", (e, replay) => !replay && live.push(e.type));
    await gl.start();
    expect(state.get().game.logStatus.kind).toBe("watching");
    expect(state.get().game.inGame).toBe(false);
    expect(state.get().game.area?.id).toBe("1_1_town");

    appendFileSync(log, '2026/11/02 20:27:26 1 a [DEBUG Client 1] Generating level 2 area "1_1_2" with seed 5\r\n');
    await wait(600);
    expect(state.get().game.inGame).toBe(true);
    expect(state.get().game.area?.id).toBe("1_1_2");
    expect(live).toEqual(["areaGenerated"]);
    gl.stop();
  });
});
