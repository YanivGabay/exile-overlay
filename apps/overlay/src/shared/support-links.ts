/**
 * Where players report problems. The issue forms live in .github/ISSUE_TEMPLATE
 * of each repo; field ids in the query string prefill the form.
 */
const APP_REPO = "https://github.com/YanivGabay/exile-overlay";
const GUIDES_REPO = "https://github.com/YanivGabay/exile-overlay-guides";

export const FAQ_URL = `${APP_REPO}#faq-and-known-issues`;

/** The app's bug form. The report itself goes on the clipboard: it's too long for a URL. */
export function bugReportUrl(): string {
  return `${APP_REPO}/issues/new?${new URLSearchParams({ template: "bug_report.yml" })}`;
}

export interface GuideErrorInfo {
  stepId: string;
  /** "Act 2, The Western Forest", or the area id when the name is unknown. */
  zone: string;
  note: string;
  guideVersion: string | null;
  gameVersion: string | null;
  options: unknown;
}

/** The guides repo's guide-error form, filled in from the step the player reported. */
export function guideErrorUrl(i: GuideErrorInfo): string {
  return `${GUIDES_REPO}/issues/new?${new URLSearchParams({
    template: "guide_error.yml",
    title: `Wrong step: ${i.stepId}`,
    zone: i.zone,
    step: i.stepId,
    details: i.note,
    guide: `${i.guideVersion ?? "unknown"} (game ${i.gameVersion ?? "unknown"})`,
    options: JSON.stringify(i.options),
  })}`;
}
