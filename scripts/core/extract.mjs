/**
 * Text extraction primitives.
 *
 * Nothing here knows what the site is about: these pull refs, tags, meta and
 * two-column tables out of HTML and stop. Site vocabulary -- what a LAN value
 * looks like, which affiliate tag is ours -- lives in ../rules.site/.
 *
 * Zero dependencies by design: CLAUDE.md forbids introducing frameworks or
 * build tooling, so this uses regex extraction rather than a DOM parser. The
 * markup is machine-generated and uniform, which makes that tractable; where
 * extraction finds nothing the caller reports `extraction-failed` rather than
 * passing silently, because a validator that fails open is worse than none.
 */

const REF_RE = /(?:href|src)\s*=\s*"([^"]*)"/gi;

export function extractRefs(html) {
  return [...html.matchAll(REF_RE)].map((m) => m[1]);
}

/** 1-based line number of the first occurrence of `needle`, or undefined. */
export function lineOf(html, needle) {
  const idx = html.indexOf(needle);
  if (idx === -1) return undefined;
  return html.slice(0, idx).split('\n').length;
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

export function getDescription(html) {
  const m = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/content=["']([\s\S]*?)["']/i);
  return c ? c[1].trim() : null;
}

/**
 * A `<tr><td>key</td><td>value</td></tr>` table as a Map, first key winning.
 *
 * The row shape is a site fact, so callers pass it in: rules.site/ supplies
 * harness.config.json's validator.pageShape.specTableRowPattern. The default
 * keeps the twelve payload tests that call this with one argument working.
 */
export const DEFAULT_ROW_RE = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi;

export function parseSpecTable(html, rowRe = DEFAULT_ROW_RE) {
  const map = new Map();
  for (const m of html.matchAll(rowRe)) {
    const key = m[1].replace(/&amp;/g, '&').trim();
    if (!map.has(key)) map.set(key, m[2].trim());
  }
  return map;
}
