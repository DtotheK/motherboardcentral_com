/**
 * (e) Spec-table values must not be contradicted by body prose.
 *
 * SITE-SPECIFIC, and the most tightly bound rule in the validator. It knows
 * what a LAN speed, a WiFi generation and a CPU socket look like in both terse
 * spec cells and verbose prose. A site about anything else shares the IDEA --
 * structured data versus the words around it -- but none of the vocabulary.
 *
 * This rule enforces CLAUDE.md's first hard content rule, and drove the entire
 * 55-page LAN template defect (#2) to zero.
 */

import { stripTags, parseSpecTable } from '../core/extract.mjs';
import { config, re } from '../core/config.mjs';

/* Spec cells are terse ("2.5G"); prose is verbose ("2.5 Gigabit Ethernet").
 * Body extraction is deliberately stricter so unrelated numbers -- 128GB of
 * RAM, a 6GHz band, 20 Gbps USB -- can never be read as a LAN claim. */
const SPEC_TOKENS = {
  LAN: (s) => [...s.matchAll(/(\d+(?:\.\d+)?)\s*G(?:bE)?\b/gi)].map((m) => `${parseFloat(m[1])}g`),
  WiFi: (s) => [...s.matchAll(/wi-?fi\s*(7|6e|6|5)\b/gi)].map((m) => `wifi${m[1].toLowerCase()}`),
  Socket: (s) => [
    ...[...s.matchAll(/\bAM(\d)\b/gi)].map((m) => `am${m[1]}`),
    ...[...s.matchAll(/\bLGA\s*(\d{3,4})\b/gi)].map((m) => `lga${m[1]}`),
  ],
};

const BODY_TOKENS = {
  LAN: (s) => [
    ...s.matchAll(/(\d+(?:\.\d+)?)\s*(?:GbE\b|(?:G|Gigabit)\s+(?:Ethernet|LAN))/gi),
  ].map((m) => `${parseFloat(m[1])}g`),
  WiFi: SPEC_TOKENS.WiFi,
  Socket: SPEC_TOKENS.Socket,
};

// WHICH fields are cross-checked is a config slot; HOW each tokenises is the
// code above, and stays here. A new site replaces this module, not the list.
const FIELDS = config.validator.specFields;

/** Heading id that ends the region counting as claims about this board. */
const ROW_RE = re(config.validator.pageShape.specTableRowPattern, 'gi');

const RELATED_SECTION_RE = re(
  `<h[1-6][^>]*id=["']${config.validator.pageShape.relatedSectionId}["']`,
  'i',
);

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function checkSpecContradictions(page) {
  const specs = parseSpecTable(page.html, ROW_RE);
  if (specs.size === 0) return [];

  // Only prose *after* the spec table counts; nav and intro copy are not claims.
  // The "Related Boards" grid is cut too: it lists OTHER boards' names and
  // specs (e.g. "...AORUS ELITE WIFI7", "LGA 1851"), which are not claims
  // about this board and would otherwise read as contradictions.
  const afterTable = page.html.split(/<\/table>/i).slice(1).join(' ');
  const contentRegion = afterTable.split(RELATED_SECTION_RE)[0];
  const body = stripTags(contentRegion);
  if (!body) return [];

  const findings = [];

  for (const field of FIELDS) {
    const specValue = specs.get(field);
    if (!specValue) continue;

    const specTokens = new Set(SPEC_TOKENS[field](specValue));
    if (specTokens.size === 0) continue; // e.g. "No WiFi" -- nothing to compare

    const conflicts = new Map();
    for (const sentence of sentences(body)) {
      const found = new Set(BODY_TOKENS[field](sentence));
      if (found.size === 0) continue;
      // A sentence that also names the correct value is a comparison
      // ("AM5 retains the AM4 mounting holes"), not a contradiction.
      if ([...found].some((t) => specTokens.has(t))) continue;
      for (const t of found) {
        if (!conflicts.has(t)) conflicts.set(t, sentence.trim().slice(0, 100));
      }
    }

    if (conflicts.size > 0) {
      const claims = [...conflicts.keys()].join(', ');
      const quote = [...conflicts.values()][0];
      findings.push({
        file: page.file,
        rule: 'spec-contradiction',
        detail: `${field}: spec table says "${specValue}" but body text claims ${claims} — "${quote}"`,
      });
    }
  }
  return findings;
}

export const rule = {
  id: 'spec-contradiction',
  scope: 'page',
  labels: { 'spec-contradiction': 'Spec contradicts body text' },
  run: (page) => checkSpecContradictions(page),
};
