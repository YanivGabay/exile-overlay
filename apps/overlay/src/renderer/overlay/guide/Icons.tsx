/** Small line glyphs, 1em, drawn in currentColor. Each has a text equivalent nearby. */
type P = { title?: string };
const svg = (path: React.ReactNode, title?: string) => (
  <svg className="glyph" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
    {title ? <title>{title}</title> : null}
    {path}
  </svg>
);
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconGo = ({ title }: P) => svg(<path {...stroke} d="M2 8h10M8.5 4.5 12 8l-3.5 3.5" />, title);
export const IconQuest = ({ title }: P) => svg(<path {...stroke} d="M8 2.5v8M8 13.2v.3" />, title);
export const IconKill = ({ title }: P) => svg(<path {...stroke} d="M3 13 13 3M10 3h3v3M3 3l3.5 3.5M9.5 9.5 13 13" />, title);
export const IconWaypoint = ({ title }: P) => svg(<path {...stroke} d="M8 2 13 8 8 14 3 8Z M8 6v4" />, title);
export const IconPortal = ({ title }: P) => svg(<ellipse {...stroke} cx="8" cy="8" rx="4" ry="6" />, title);
export const IconTown = ({ title }: P) => svg(<path {...stroke} d="M2.5 13.5h11M4 13.5V7l4-3.5L12 7v6.5M7 13.5v-3h2v3" />, title);
export const IconGem = ({ title }: P) => svg(<path {...stroke} d="M4 3h8l2.5 3.5L8 13.5 1.5 6.5Z M1.5 6.5h13" />, title);
export const IconTrial = ({ title }: P) => svg(<path {...stroke} d="M3 13V6l5-3.5L13 6v7M6 13V9h4v4" />, title);
export const IconPassive = ({ title }: P) => svg(<circle {...stroke} cx="8" cy="8" r="4.5" />, title);
export const IconWarn = ({ title }: P) => svg(<path {...stroke} d="M8 2.5 14 13H2Z M8 6.5v3M8 11.3v.2" />, title);
export const IconBack = ({ title }: P) => svg(<path {...stroke} d="M10.5 3.5 6 8l4.5 4.5" />, title);
export const IconFwd = ({ title }: P) => svg(<path {...stroke} d="M5.5 3.5 10 8l-4.5 4.5" />, title);
export const IconHere = ({ title }: P) => svg(<path {...stroke} d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3 M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 1 0 0-5.6Z" />, title);
export const IconUndo = ({ title }: P) => svg(<path {...stroke} d="M5 4 2.5 6.5 5 9M2.5 6.5H10a3.5 3.5 0 0 1 0 7H7" />, title);
export const IconMap = ({ title }: P) => svg(<path {...stroke} d="M2 4l4-1.5 4 1.5 4-1.5v10L10 14 6 12.5 2 14Z M6 2.5v10M10 4v10" />, title);
/** Fold: a panel collapsing up into a bar. */
export const IconFold = ({ title }: P) => svg(<path {...stroke} d="M3 3.5h10M4.5 12l3.5-3.5 3.5 3.5" />, title);
