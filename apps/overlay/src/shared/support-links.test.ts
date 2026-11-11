import { describe, expect, it } from "vitest";
import { bugReportUrl, guideErrorUrl } from "./support-links.js";

describe("support links", () => {
  it("opens the app's bug form", () => {
    expect(bugReportUrl()).toBe("https://github.com/YanivGabay/exile-overlay/issues/new?template=bug_report.yml");
  });

  it("prefills the guide error form by field id", () => {
    const url = new URL(
      guideErrorUrl({ stepId: "a2-17", zone: "Act 2, The Western Forest", note: "exit is north & east", guideVersion: "abc", gameVersion: "3.29", options: { bandit: "None" } }),
    );
    expect(url.origin + url.pathname).toBe("https://github.com/YanivGabay/exile-overlay-guides/issues/new");
    const q = url.searchParams;
    expect(q.get("template")).toBe("guide_error.yml");
    expect(q.get("title")).toBe("Wrong step: a2-17");
    expect(q.get("zone")).toBe("Act 2, The Western Forest");
    expect(q.get("step")).toBe("a2-17");
    expect(q.get("details")).toBe("exit is north & east");
    expect(q.get("guide")).toBe("abc (game 3.29)");
    expect(JSON.parse(q.get("options")!)).toEqual({ bandit: "None" });
  });
});
