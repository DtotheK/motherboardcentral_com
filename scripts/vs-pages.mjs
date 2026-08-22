#!/usr/bin/env node
/**
 * Board-vs-board comparison page generator (issue #39, Phase 1).
 *
 * Zero dependencies, run on demand, nothing at deploy time -- the same
 * category as scripts/validate.mjs. The deploy is still "push static HTML".
 *
 * The point of generating these pages rather than hand-writing them is
 * CLAUDE.md rule 1: a spec value can only reach a vs page by being read out of
 * `motherboardDatabase`, so a vs page can never contradict the compare tool or
 * the review it sits between. Hand-written prose is checked for spec-shaped
 * literals and rejected, so the constraint is mechanical rather than a habit.
 *
 * Usage:
 *   node scripts/vs-pages.mjs --report   # eligibility + spec cross-check report
 *   node scripts/vs-pages.mjs --build    # write compare-<a>-vs-<b>.html
 *   node scripts/vs-pages.mjs --check    # committed pages match a fresh render
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

/* ======================================================= 1. database == */

const DB_MARKER = 'const motherboardDatabase = [';

/**
 * Slice the `motherboardDatabase` array literal out of js/main.js and evaluate
 * it. The database is a `const` inside the compare-page closure, so it cannot
 * be imported; moving it out would touch shared JS and compare.html for a
 * generator's convenience. If the markers ever move this throws rather than
 * emitting a page -- fail closed, matching validate.mjs.
 */
export function extractDatabase(mainJsSource) {
  const start = mainJsSource.indexOf(DB_MARKER);
  if (start === -1) throw new Error('motherboardDatabase markers not found in js/main.js');

  const open = start + DB_MARKER.length - 1; // index of the `[`
  const end = matchBracket(mainJsSource, open);
  if (end === -1) throw new Error('motherboardDatabase markers not found in js/main.js');

  const literal = mainJsSource.slice(open, end + 1);
  // structuredClone re-homes the result: values built inside the vm context
  // carry that realm's Array/Object prototypes, which makes deepStrictEqual
  // and instanceof lie about perfectly ordinary data.
  return structuredClone(vm.runInNewContext(`(${literal})`));
}

/** Index of the `]` closing the `[` at `open`, or -1. String-aware. */
function matchBracket(src, open) {
  let depth = 0;
  let quote = null;

  for (let i = open; i < src.length; i += 1) {
    const c = src[i];

    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '[') depth += 1;
    else if (c === ']') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Board slug. Copied verbatim from js/main.js (the `slugify` used by the
 * compare tool's ?boards= state), including the "." and "+" special cases, so
 * a vs page filename and a ?boards= link always name a board the same way.
 */
export const slugify = (name) => String(name)
  .toLowerCase()
  .replace(/\./g, '')       // "M.2" -> "m2"
  .replace(/\+/g, ' plus ') // "M.2+" -> "m2 plus"
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ================================================= 2. review pages == */

const AFFILIATE_TAG = 'motherboardcentral.com-20';

const DP_RE = new RegExp(
  `href="(https://www\\.amazon\\.com/dp/[A-Z0-9]{10}\\?tag=${AFFILIATE_TAG.replace(/\./g, '\\.')})"`,
  'i',
);

/**
 * The board's direct Amazon product link, taken from its own review page so
 * the vs page and the review can never carry different links or tags. A board
 * whose review still uses a `/s?k=` search URL returns null and is therefore
 * ineligible for a vs page (CLAUDE.md rule 3, tracked in #4).
 */
export function extractDpLink(reviewHtml) {
  const m = reviewHtml.match(DP_RE);
  return m ? m[1] : null;
}

/** Same row regex validate.mjs uses, so both read a spec table identically. */
const ROW_RE = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi;

export function extractReviewSpecs(reviewHtml) {
  const map = new Map();
  for (const m of reviewHtml.matchAll(ROW_RE)) {
    const key = m[1].replace(/&amp;/g, '&').trim();
    if (!map.has(key)) map.set(key, m[2].trim());
  }
  return map;
}

/* Review tables label the codec row "Audio"; a few pages spell it out. The
 * memory row is one cell on a review page and three fields in the database. */
const CROSS_CHECK_FIELDS = [
  { field: 'Socket', labels: ['Socket'], of: (b) => b.socket },
  { field: 'Chipset', labels: ['Chipset'], of: (b) => b.chipset },
  { field: 'Form Factor', labels: ['Form Factor'], of: (b) => b.formFactor },
  {
    field: 'Memory',
    labels: ['Memory'],
    of: (b) => `${b.ramType}, ${b.ramSlots} DIMM slots, up to ${b.maxRam}`,
  },
  { field: 'PCIe Slots', labels: ['PCIe Slots'], of: (b) => b.pcieSlots },
  { field: 'M.2 Slots', labels: ['M.2 Slots'], of: (b) => b.m2Slots },
  { field: 'SATA Ports', labels: ['SATA Ports'], of: (b) => b.sataPortsCount },
  { field: 'Rear USB', labels: ['Rear USB'], of: (b) => b.usbRearPorts },
  { field: 'WiFi', labels: ['WiFi'], of: (b) => b.wifi },
  { field: 'Bluetooth', labels: ['Bluetooth'], of: (b) => b.bluetooth },
  { field: 'LAN', labels: ['LAN'], of: (b) => b.lan },
  { field: 'Audio', labels: ['Audio', 'Audio Codec'], of: (b) => b.audioCodec },
  { field: 'Power Phases', labels: ['Power Phases'], of: (b) => b.powerPhases },
];

/**
 * Every field where the database and the board's own review page disagree.
 * A spec the review never publishes counts as a disagreement: we cannot show a
 * reader a difference we are unable to check against the page it came from.
 *
 * This is necessary but NOT sufficient for publication -- the database and the
 * review page are the same numbers typed once, so they can agree and both be
 * wrong. See the D14 gate in docs/vs-pages.md.
 */
export function crossCheck(dbRow, reviewSpecs) {
  const problems = [];
  for (const spec of CROSS_CHECK_FIELDS) {
    const label = spec.labels.find((l) => reviewSpecs.has(l));
    const review = label === undefined ? null : reviewSpecs.get(label);
    const db = String(spec.of(dbRow));
    if (review !== db) problems.push({ field: spec.field, db, review });
  }
  return problems;
}

/* ==================================================== 3. spec diff == */

/**
 * The compare tool's `specRows`, same labels in the same order, so a reader
 * moving between compare.html and a vs page never sees a different table.
 * No better/worse marking: the tool's comparators live inside its closure, and
 * a second copy of the ranking logic here would drift from it. Superiority
 * claims belong in hand-written prose, where a human owns them.
 */
export const SPEC_ROWS = [
  { label: 'Brand', key: 'brand' },
  { label: 'Socket', key: 'socket' },
  { label: 'Chipset', key: 'chipset' },
  { label: 'Form Factor', key: 'formFactor' },
  { label: 'RAM Type', key: 'ramType' },
  { label: 'RAM Slots', key: 'ramSlots' },
  { label: 'Max RAM', key: 'maxRam' },
  { label: 'PCIe Slots', key: 'pcieSlots' },
  { label: 'M.2 Slots', key: 'm2Slots' },
  { label: 'SATA Ports', key: 'sataPortsCount' },
  { label: 'Rear USB', key: 'usbRearPorts' },
  { label: 'WiFi', key: 'wifi' },
  { label: 'Bluetooth', key: 'bluetooth' },
  { label: 'LAN', key: 'lan' },
  { label: 'Audio Codec', key: 'audioCodec' },
  { label: 'Power Phases', key: 'powerPhases' },
  { label: 'Rating', key: 'rating', format: (v) => `${v} / 5.0` },
];

/** Rows that say nothing about which board suits the reader better. */
const NOT_A_DIFFERENCE = new Set(['Brand', 'Rating']);

export function diffRows(a, b) {
  return SPEC_ROWS.map((row) => {
    const show = (board) => String(row.format ? row.format(board[row.key]) : board[row.key]);
    const aValue = show(a);
    const bValue = show(b);
    return { label: row.label, aValue, bValue, same: aValue === bValue };
  });
}

/**
 * How many differences a reader is actually choosing between. Brand is never
 * a spec, and our own rating is an opinion rather than a difference in the
 * hardware -- a pair separated only by 0.1 of a star is not a head-to-head.
 */
export function countDifferences(rows) {
  return rows.filter((r) => !r.same && !NOT_A_DIFFERENCE.has(r.label)).length;
}

/* ============================================== 4. pair validation == */

/** Everything a pair is validated and rendered against, keyed by slug. */
export function buildContext(root) {
  const mainJs = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');

  const db = new Map();
  for (const board of extractDatabase(mainJs)) db.set(slugify(board.name), board);

  const reviews = new Map();
  for (const slug of db.keys()) {
    const file = path.join(root, `review-${slug}.html`);
    if (fs.existsSync(file)) reviews.set(slug, fs.readFileSync(file, 'utf8'));
  }
  return { db, reviews };
}

const PLACEHOLDER_RE = /\{([ab])\.([A-Za-z0-9_]+)\}/g;

/** Fill `{a.m2Slots}`-style placeholders from the two database rows. */
export function substitute(text, a, b) {
  return String(text).replace(PLACEHOLDER_RE, (whole, side, key) => {
    const board = side === 'a' ? a : b;
    return Object.hasOwn(board, key) ? String(board[key]) : whole;
  });
}

/* A hand-written field may not contain a spec value: the moment a human types
 * "3x M.2" into prose it can drift from the database, and criterion 2 of #39
 * is that it cannot. These are checked BEFORE substitution -- `{a.socket}` is
 * how you write AM5 here. */
const HAND_TYPED_SPEC_RES = [
  /\b\d+\s*x?\s*M\.?2\b/i,
  /\bWi-?Fi\s*(?:5|6E|6|7)\b/i,
  /\bBT\s*\d\.\d\b/i,
  /\b\d+(?:\.\d+)?\s*G(?:bE)?\b/i,
  /\bALC\s*\d{3,4}\b/i,
  /\b\d+\+\d+(?:\+\d+)?\b/,
  /\bDDR[45]\b/i,
  /\bPCIe\s*\d\.\d\b/i,
  /\bLGA\s*\d{3,4}\b/i,
  /\bAM[45]\b/i,
  /\bSATA\b/i,
];

const PRICE_RE = /\$\d[\d,]*(?:\.\d+)?/; // "$1,299.99", but not the full stop after "$40."
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MIN_DIFFERENCES = 2;
const MIN_WORDS = 250;
const MAX_WORDS = 450;

/** The hand-written fields, in the order they appear on the page. */
function handWritten(pair) {
  return [
    ['intro', pair.intro],
    ...(pair.glance || []).map((text, i) => [`glance[${i}]`, text]),
    ['body', pair.body],
    ['verdictA', pair.verdictA],
    ['verdictB', pair.verdictB],
  ];
}

const wordCount = (text) => (String(text).trim().match(/\S+/g) || []).length;

const rowWord = (n) => `differing spec row${n === 1 ? '' : 's'}`;

/**
 * Every reason this pair may not become a page. The builder refuses to render
 * while this is non-empty, so a vs page cannot exist in a state these rules
 * would have caught.
 */
export function validatePair(pair, ctx) {
  const problems = [];
  const slugs = [pair.a, pair.b];

  for (const slug of slugs) {
    if (!ctx.db.has(slug)) problems.push(`unknown board slug: ${slug}`);
  }
  if (problems.length) return problems; // nothing else can be checked

  const a = ctx.db.get(pair.a);
  const b = ctx.db.get(pair.b);

  // D3: the filename sorts the two slugs, so A-vs-B and B-vs-A can never both
  // exist. Requiring the data file to match that order keeps the page's own
  // "A vs B" reading the same way round as its URL.
  if (pair.b < pair.a) {
    problems.push(
      `pair is out of order: list ${pair.b} first, because the filename is alphabetical (D3)`,
    );
  }

  for (const slug of slugs) {
    const html = ctx.reviews.get(slug);
    if (html === undefined) {
      problems.push(`missing review page: review-${slug}.html`);
      continue;
    }
    if (extractDpLink(html) === null) {
      problems.push(`no direct Amazon product link on review-${slug}.html`);
    }
    for (const { field, db, review } of crossCheck(ctx.db.get(slug), extractReviewSpecs(html))) {
      problems.push(
        `review-${slug}.html disagrees with the database on ${field}: `
        + `database "${db}", review "${review === null ? '(no row)' : review}"`,
      );
    }
  }

  // D14: agreeing with our own review page is not verification -- both are the
  // same numbers typed once. A page ships only against the manufacturer.
  for (const slug of slugs) {
    const record = (pair.verified || {})[slug];
    const ok = record
      && typeof record.source === 'string' && record.source.startsWith('https://')
      && typeof record.date === 'string' && ISO_DATE_RE.test(record.date);
    if (!ok) {
      problems.push(
        `unverified specs for ${slug}: needs an https:// manufacturer source and an ISO date (D14)`,
      );
    }
  }

  const differences = countDifferences(diffRows(a, b));
  if (differences < MIN_DIFFERENCES) {
    problems.push(
      `only ${differences} ${rowWord(differences)}: a head-to-head needs at least ${MIN_DIFFERENCES}`,
    );
  }

  for (const [field, text] of handWritten(pair)) {
    for (const re of HAND_TYPED_SPEC_RES) {
      const m = String(text).match(re);
      if (m) {
        problems.push(
          `hand-typed spec in ${field}: "${m[0]}" — read it from the database with a {a.key} placeholder`,
        );
        break;
      }
    }

    const price = String(text).match(PRICE_RE);
    if (price) problems.push(`price in ${field}: "${price[0]}" — we publish no prices`);

    for (const [whole, side, key] of String(text).matchAll(PLACEHOLDER_RE)) {
      if (!Object.hasOwn(side === 'a' ? a : b, key)) {
        problems.push(`unknown placeholder in ${field}: ${whole}`);
      }
    }
  }

  const words = handWritten(pair)
    .reduce((total, [, text]) => total + wordCount(substitute(text, a, b)), 0);
  if (words < MIN_WORDS || words > MAX_WORDS) {
    problems.push(`hand-written prose is ${words} words: needs ${MIN_WORDS}-${MAX_WORDS}`);
  }

  return problems;
}

/* ===================================================== 5. rendering == */

const SITE = 'https://motherboardcentral.com';

/**
 * D11. Emitted by the generator rather than typed per page, so it cannot be
 * softened by accident. CLAUDE.md rule 2: we did not test these boards.
 */
export const SOURCING_SENTENCE =
  'This comparison is based on the manufacturers\' published specifications. '
  + 'We have not tested either board.';

export function pageFilename(pair) {
  const [first, second] = [pair.a, pair.b].sort();
  return `compare-${first}-vs-${second}.html`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** "A", "A and B", "A, B and C" -- for the meta description. */
function listWords(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* Styles are inline because the generator owns them: one template, regenerate
 * to change. Editing css/style.css to serve a new page type would put a shared
 * stylesheet on the diff, which is a CLAUDE.md tripwire. */
const S = {
  pill: 'display:inline-block;font-size:0.7rem;font-weight:600;padding:0.1rem 0.5rem;border-radius:999px;',
  different: 'background:var(--accent-orange);color:#fff;',
  same: 'background:var(--bg-secondary);color:var(--text-muted);',
  mutedRow: 'opacity:0.55;',
  diffRow: 'font-weight:600;',
};

function renderTable(pair, a, b) {
  const rows = diffRows(a, b).map((row) => {
    const pill = row.same
      ? `<span style="${S.pill}${S.same}">Same</span>`
      : `<span style="${S.pill}${S.different}">Different</span>`;
    return `                <tr style="${row.same ? S.mutedRow : S.diffRow}">`
      + `<td>${esc(row.label)}</td><td>${esc(row.aValue)}</td><td>${esc(row.bValue)}</td>`
      + `<td>${pill}</td></tr>`;
  });

  return [
    '            <table>',
    '              <thead>',
    `                <tr><th>Specification</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th></th></tr>`,
    '              </thead>',
    '              <tbody>',
    ...rows,
    '              </tbody>',
    '            </table>',
  ].join('\n');
}

function renderSiblings(pair, ctx) {
  const mine = new Set([pair.a, pair.b]);
  const siblings = (ctx.pairs || [])
    .filter((p) => pageFilename(p) !== pageFilename(pair))
    .filter((p) => mine.has(p.a) || mine.has(p.b))
    .map((p) => {
      const other = [p.a, p.b].map((slug) => ctx.db.get(slug)).filter(Boolean);
      if (other.length < 2) return null;
      return `            <li><a href="${pageFilename(p)}">${esc(other[0].name)} vs ${esc(other[1].name)}</a></li>`;
    })
    .filter(Boolean);

  if (siblings.length === 0) return '';

  return [
    '          <h2 id="more">More head-to-heads</h2>',
    '          <ul style="padding-left:1.25rem;display:flex;flex-direction:column;gap:0.5rem;">',
    ...siblings,
    '          </ul>',
    '',
  ].join('\n');
}

const buyButton = (name, href) =>
  `<a href="${href}" target="_blank" rel="nofollow noopener noreferrer" class="btn btn-primary">`
  + `Check price on Amazon: ${esc(name)}</a>`;

/**
 * The whole page. Refuses to render a pair that fails validatePair, so a vs
 * page cannot exist in a state those rules would have caught.
 */
export function renderPage(pair, ctx) {
  const problems = validatePair(pair, ctx);
  if (problems.length) {
    throw new Error(`cannot render ${pair.a} vs ${pair.b}:\n  ${problems.join('\n  ')}`);
  }

  const a = ctx.db.get(pair.a);
  const b = ctx.db.get(pair.b);
  const fill = (text) => esc(substitute(text, a, b));

  const differing = diffRows(a, b).filter((r) => !r.same && !NOT_A_DIFFERENCE.has(r.label));
  const title = `${a.name} vs ${b.name} - MotherboardCentral`;
  const description =
    `${a.name} vs ${b.name}: ${listWords(differing.slice(0, 3).map((r) => r.label))} `
    + 'compared, plus which board to buy.';
  const canonical = `${SITE}/${pageFilename(pair)}`;

  const linkA = extractDpLink(ctx.reviews.get(pair.a));
  const linkB = extractDpLink(ctx.reviews.get(pair.b));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MN6VW6GV50"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-MN6VW6GV50');
</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(description)}">
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
</head>
<body>

  <nav class="navbar">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="6" y1="2" x2="6" y2="22"/><line x1="18" y1="2" x2="18" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        Motherboard<span>Central</span>
      </a>
      <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="reviews.html">Reviews</a>
        <a href="guides.html">Guides</a>
        <a href="compare.html" class="active">Compare</a>
      </div>
      <div class="nav-search">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" class="search-input" placeholder="Search motherboards...">
      </div>
      <button class="nav-toggle"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <section class="page-hero page-hero-compact">
    <div class="container">
      <h1>${esc(a.name)} vs ${esc(b.name)}</h1>
      <p>${esc(a.socket)} &middot; ${esc(a.chipset)} &middot; ${esc(a.formFactor)}</p>
    </div>
  </section>

  <section class="section" style="padding-top:1.5rem;">
    <div class="container">
      <div class="guide-layout">

        <aside class="guide-sidebar">
          <nav class="guide-toc">
            <h4>On This Page</h4>
            <ul>
              <li><a href="#short-answer">The short answer</a></li>
              <li><a href="#specs">Specification differences</a></li>
              <li><a href="#meaning">What the differences mean</a></li>
              <li><a href="#verdict">Which one to get</a></li>
            </ul>
          </nav>
        </aside>

        <div class="guide-content">

          <p>${fill(pair.intro)}</p>

          <h2 id="short-answer">The short answer</h2>
          <ul style="padding-left:1.25rem;display:flex;flex-direction:column;gap:0.75rem;">
${pair.glance.map((line) => `            <li>${fill(line)}</li>`).join('\n')}
          </ul>

          <h2 id="specs">Specification differences</h2>
          <div class="spec-table" style="margin-bottom:2rem;">
${renderTable(pair, a, b)}
          </div>

          <h2 id="meaning">What the differences mean</h2>
          <p>${fill(pair.body)}</p>

          <h2 id="verdict">Which one to get</h2>
          <div class="info-box tip">
            <h4>Get the ${esc(a.name)} if&hellip;</h4>
            <p>${fill(pair.verdictA)}</p>
          </div>
          <div class="info-box tip" style="margin-top:1rem;">
            <h4>Get the ${esc(b.name)} if&hellip;</h4>
            <p>${fill(pair.verdictB)}</p>
          </div>

          <p style="margin-top:1.5rem;color:var(--text-secondary);">${esc(SOURCING_SENTENCE)}</p>

          <div style="display:flex;flex-wrap:wrap;gap:1rem;margin:1.5rem 0;">
            ${buyButton(a.name, linkA)}
            ${buyButton(b.name, linkB)}
          </div>

          <h2 id="full-reviews">The full reviews</h2>
          <ul style="padding-left:1.25rem;display:flex;flex-direction:column;gap:0.5rem;">
            <li><a href="review-${pair.a}.html">${esc(a.name)} review</a></li>
            <li><a href="review-${pair.b}.html">${esc(b.name)} review</a></li>
            <li><a href="compare.html?boards=${pair.a},${pair.b}">Open this pair in the comparison tool</a></li>
          </ul>

${renderSiblings(pair, ctx)}        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo">
            <div class="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="1.5" fill="#fff" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="#fff" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="#fff" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="#fff" stroke="none"/><line x1="8" y1="9.5" x2="8" y2="14.5"/><line x1="16" y1="9.5" x2="16" y2="14.5"/><line x1="9.5" y1="8" x2="14.5" y2="8"/><line x1="9.5" y1="16" x2="14.5" y2="16"/></svg>
            </div>
            Motherboard<span>Central</span>
          </a>
          <p>Your go-to resource for motherboard reviews, buying guides, and hardware education.</p>
        </div>
        <div class="footer-col">
          <h4>Reviews</h4>
          <ul>
            <li><a href="reviews.html">All Reviews</a></li>
            <li><a href="reviews.html?price=0-150">Budget Boards</a></li>
            <li><a href="reviews.html?socket=LGA+1700">Intel Boards</a></li>
            <li><a href="reviews.html?socket=AM5">AMD Boards</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Guides</h4>
          <ul>
            <li><a href="guide-pcie.html">PCIe Speeds &amp; Slots</a></li>
            <li><a href="guide-sockets.html">CPU Sockets Explained</a></li>
            <li><a href="guide-ram.html">RAM &amp; Memory</a></li>
            <li><a href="guide-usb.html">USB Headers &amp; Ports</a></li>
            <li><a href="guide-cooling.html">Cooling &amp; Thermals</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About</a></li>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 MotherboardCentral.com. All rights reserved.</p>
        <p>Built for PC enthusiasts</p>
      </div>
    </div>
  </footer>

  <script src="js/main.js"></script>
  <!-- Vercel Analytics -->
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

/* ========================================= 6. report, build, check == */

const GENERATED_RE = /^compare-[a-z0-9-]+-vs-[a-z0-9-]+\.html$/;

export function listGeneratedPages(root) {
  return fs.readdirSync(root).filter((f) => GENERATED_RE.test(f)).sort();
}

/**
 * Everything wrong with the committed pages: one that was never built, one
 * that no longer matches its data, and one that no pair claims. The
 * hand-edited case is the point -- a generated page edited in place would
 * otherwise drift away from the database it is supposed to be welded to.
 */
export function checkPages(pairs, ctx, disk) {
  const problems = [];
  const expected = new Set();

  for (const pair of pairs) {
    const file = pageFilename(pair);
    expected.add(file);

    const committed = disk.read(file);
    if (committed === null) {
      problems.push(`missing generated page: ${file} — run npm run vs -- --build`);
      continue;
    }
    if (committed !== renderPage(pair, { ...ctx, pairs })) {
      problems.push(
        `hand-edited generated page: ${file} — change scripts/vs-pairs.data.mjs and rebuild`,
      );
    }
  }

  for (const file of disk.files) {
    if (!expected.has(file)) {
      problems.push(`orphan generated page: ${file} — no entry in scripts/vs-pairs.data.mjs`);
    }
  }
  return problems;
}

/**
 * D8's eligibility gate, plus the evidence behind it. A pair is a real reader
 * decision only if the boards share a socket, a chipset and a form factor --
 * price tier is the honest criterion but we publish no prices, so chipset is
 * the closest thing in the data -- and differ on at least two spec rows.
 */
export function eligibilityReport(ctx) {
  const boards = [...ctx.db.entries()].map(([slug, board]) => {
    const html = ctx.reviews.get(slug);
    return {
      slug,
      name: board.name,
      review: html !== undefined,
      dpLink: html !== undefined && extractDpLink(html) !== null,
      mismatches: html === undefined ? [] : crossCheck(board, extractReviewSpecs(html)),
    };
  });

  const byStatus = new Map(boards.map((r) => [r.slug, r]));
  const slugs = [...ctx.db.keys()].sort();
  const pairs = [];

  for (let i = 0; i < slugs.length; i += 1) {
    for (let j = i + 1; j < slugs.length; j += 1) {
      const a = ctx.db.get(slugs[i]);
      const b = ctx.db.get(slugs[j]);
      if (a.socket !== b.socket || a.chipset !== b.chipset || a.formFactor !== b.formFactor) continue;

      const differences = countDifferences(diffRows(a, b));
      const blockers = [];
      if (differences < MIN_DIFFERENCES) blockers.push(`only ${differences} ${rowWord(differences)}`);
      for (const slug of [slugs[i], slugs[j]]) {
        const status = byStatus.get(slug);
        if (!status.review) blockers.push(`no review page for ${slug}`);
        else if (!status.dpLink) blockers.push(`no direct Amazon link for ${slug}`);
        if (status.mismatches.length) {
          blockers.push(`${slug} disagrees with its review on `
            + status.mismatches.map((m) => m.field).join(', '));
        }
      }

      pairs.push({
        a: slugs[i],
        b: slugs[j],
        differences,
        eligible: blockers.length === 0,
        blockers,
      });
    }
  }

  pairs.sort((x, y) => y.differences - x.differences || x.a.localeCompare(y.a));
  return { boards, pairs };
}

/** The report, printed in full: a cap here would read as "nothing to see". */
export function formatReport({ boards, pairs }) {
  const lines = [];
  const eligible = pairs.filter((p) => p.eligible);

  lines.push(`BOARDS — ${boards.length} boards in motherboardDatabase`);
  lines.push(`  direct Amazon link:  ${boards.filter((b) => b.dpLink).length}`);
  lines.push(`  agrees with its own review page: ${boards.filter((b) => !b.mismatches.length).length}`);
  lines.push('');

  for (const board of boards) {
    const notes = [];
    if (!board.review) notes.push('no review page');
    else if (!board.dpLink) notes.push('no direct Amazon link (still a /s?k= search URL)');
    for (const m of board.mismatches) {
      notes.push(`${m.field}: database "${m.db}" vs review "${m.review === null ? '(no row)' : m.review}"`);
    }
    if (notes.length) lines.push(`  ${board.slug}\n    - ${notes.join('\n    - ')}`);
  }

  lines.push('');
  lines.push(`PAIRS — ${pairs.length} same-platform pairs (same socket, chipset and form factor)`);
  lines.push(`  clear of every mechanical gate: ${eligible.length}`);
  lines.push('  none of them may be published until its specs are verified against the');
  lines.push('  manufacturer\'s own page and recorded in scripts/vs-pairs.data.mjs (D14).');
  lines.push('');

  for (const pair of pairs) {
    const status = pair.eligible ? 'gates clear' : pair.blockers.join('; ');
    lines.push(`  ${pair.differences} diff  ${pair.a} vs ${pair.b}\n    ${status}`);
  }

  return lines.join('\n');
}

/* ============================================================== CLI == */

const USAGE = `usage: node scripts/vs-pages.mjs [--report | --build | --check]

  --report  which boards and pairs could carry a vs page, and what blocks the rest
  --build   write compare-<a>-vs-<b>.html for every pair in scripts/vs-pairs.data.mjs
  --check   fail if a committed page no longer matches a fresh render`;

export async function main(argv, root, io = console) {
  const mode = argv.find((a) => ['--report', '--build', '--check'].includes(a));
  if (!mode) {
    io.log(USAGE);
    return 2;
  }

  const { pairs } = await import(`file://${path.join(root, 'scripts', 'vs-pairs.data.mjs')}`);
  const ctx = { ...buildContext(root), pairs };

  if (mode === '--report') {
    io.log(formatReport(eligibilityReport(ctx)));
    return 0;
  }

  if (mode === '--build') {
    for (const pair of pairs) {
      const file = pageFilename(pair);
      fs.writeFileSync(path.join(root, file), renderPage(pair, ctx));
      io.log(`wrote ${file}`);
    }
    io.log(`${pairs.length} page(s) written`);
    return 0;
  }

  const disk = {
    files: listGeneratedPages(root),
    read: (f) => fs.readFileSync(path.join(root, f), 'utf8'),
  };
  const problems = checkPages(pairs, ctx, disk);
  for (const problem of problems) io.error(problem);
  io.log(`${disk.files.length} generated page(s), ${problems.length} problem(s)`);
  return problems.length ? 1 : 0;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), ROOT);
}
