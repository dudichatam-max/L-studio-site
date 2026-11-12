/**
 * Isolate Latin product names and English lists inside RTL copy (Hebrew,
 * Arabic) so punctuation and runs like "FX 1" / "Rock (Classic, Hard, …)"
 * do not get visually reordered by the Unicode bidi algorithm.
 *
 * Content strings stay plain. The helper marks Latin runs at render time.
 * Trailing punctuation after a Latin run stays in a nowrap wrapper with the
 * run (it is not put inside the LTR bdi), so a comma after Exclusive cannot
 * wrap alone to the other end of the next line.
 */
export type LatinRunPart = { text: string; ltr: boolean; trailing?: string };

const ATOM =
  "(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+[xX]|[A-Za-z][A-Za-z0-9]*(?:[/'’\\-][A-Za-z][A-Za-z0-9]*)*)";
// Short trailing numbers belong to names (FX 1, Factory 64, Sound FX / 8).
// Do not swallow a following count after a comma ("Exclusive, 152 kits").
const NAME_NUM = "\\d{1,2}(?!\\d)";
const AFTER_COMMA = "[ \\u00A0]*,[ \\u00A0]*";
const AFTER_SLASH = "[ \\u00A0]*/[ \\u00A0]*";
const AFTER_SPACE = "[ \\u00A0]+";
const CONTINUE =
  `(?:${AFTER_COMMA}(?:${ATOM})|${AFTER_SLASH}(?:${ATOM}|${NAME_NUM})|${AFTER_SPACE}(?:${ATOM}|${NAME_NUM}))`;
const INNER = `${ATOM}(?:${CONTINUE})*`;
const PAREN = `\\(${INNER}\\)`;
const LATIN_RUN = new RegExp(
  `${ATOM}(?:${CONTINUE}|${AFTER_COMMA}${PAREN}|[ \\u00A0]*${PAREN})*`,
  "g"
);
// Comma, period, and the Arabic comma/semicolon/question mark, kept with the
// preceding Latin run but left outside the LTR bdi so they follow RTL rules.
const TRAILING_PUNCT = /^[.,:;!?…،؛؟]+/;

export function shouldIsolateLatin(language: string, isRtl?: boolean): boolean {
  if (isRtl === true) return true;
  return language === "he" || language === "ar";
}

/** Multi-word or multi-item Latin lists wrap as a unit; short names stay inline. */
export function isLatinList(text: string): boolean {
  return (
    /[A-Za-z][A-Za-z0-9]*\s+[A-Za-z]/.test(text) ||
    /[A-Za-z].*,\s*[A-Za-z]/.test(text)
  );
}

export function splitLatinRuns(text: string): LatinRunPart[] {
  if (!text) return [];
  const parts: LatinRunPart[] = [];
  let last = 0;
  LATIN_RUN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LATIN_RUN.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), ltr: false });
    }
    const afterIndex = match.index + match[0].length;
    const punct = text.slice(afterIndex).match(TRAILING_PUNCT);
    const trailing = punct ? punct[0] : undefined;
    parts.push(
      trailing
        ? { text: match[0], ltr: true, trailing }
        : { text: match[0], ltr: true }
    );
    last = afterIndex + (trailing ? trailing.length : 0);
    LATIN_RUN.lastIndex = last;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), ltr: false });
  }
  return parts;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function latinRunHtml(part: LatinRunPart): string {
  const listClass = isLatinList(part.text) ? ' class="bdi-list"' : "";
  const bdi = `<bdi dir="ltr"${listClass}>${escapeHtml(part.text)}</bdi>`;
  if (part.trailing) {
    return `<span class="bdi-attach">${bdi}${escapeHtml(part.trailing)}</span>`;
  }
  return bdi;
}

/** Escaped HTML, with Latin runs wrapped in <bdi dir="ltr"> when isolate is on. */
export function bidiHtml(text: string, isolate: boolean): string {
  if (!isolate) return escapeHtml(text);
  return splitLatinRuns(text)
    .map(part => (part.ltr ? latinRunHtml(part) : escapeHtml(part.text)))
    .join("");
}
