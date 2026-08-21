/**
 * Tests for the chipset comparison guide (issue #37).
 *
 * The risk on this page is not a typo -- it is laundering a vendor-optional
 * feature into a chipset guarantee. Neither AMD's nor Intel's own chipset
 * pages were reachable when this page was written (both time out or return
 * HTTP 403 to automated fetching), so every chipset-level value here rests on
 * two independent third-party sources that agree. Where they disagreed, the
 * cell carries no number at all.
 *
 * These tests encode that discipline so a later edit cannot quietly turn
 * "PCIe 4.0 minimum" into "PCIe 5.0". The load-bearing ones are:
 *
 *   - the cell-vocabulary test, which forbids a bare "PCIe 5.0" in any
 *     board-dependent column;
 *   - the two-cell-row test, which keeps scripts/validate.mjs from reading
 *     this page as a board spec sheet (see below);
 *   - the chipset-filter test, which stops us linking reviews.html?chipset=X
 *     for an X the filter cannot honour.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkMeta,
  collectHtmlFiles,
  extractRefs,
  getDescription,
  getTitle,
  stripTags,
} from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'guide-chipsets.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'guide-am5-slow-boot.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);
const prose = () => stripTags(html());

/** Pull a block out of a page by its delimiting tags, whitespace preserved. */
const block = (page, open, close) => {
  const start = page.indexOf(open);
  const end = page.indexOf(close, start);
  assert.ok(start !== -1 && end !== -1, `block ${open} not found`);
  return page.slice(start, end + close.length);
};

/** Everything from an <h2 id="..."> up to the next <h2>. */
const section = (id) => {
  const page = html();
  const start = page.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `no section #${id}`);
  const rest = page.slice(start);
  const next = rest.slice(1).search(/<h2\b/i);
  return next === -1 ? rest : rest.slice(0, next + 1);
};

/* ------------------------------------------------------------- tables -- */

const TABLE_IDS = [
  'amd-guaranteed',
  'amd-board-dependent',
  'intel-guaranteed',
  'intel-board-dependent',
  'amd-previous',
  'intel-previous',
];

const BOARD_DEPENDENT_TABLES = ['amd-board-dependent', 'intel-board-dependent'];

const decode = (s) =>
  s
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** The <table id="..."> element, markup intact. */
const table = (id) => {
  const page = html();
  const start = page.indexOf(`<table class="spec-table" id="${id}">`);
  assert.notEqual(start, -1, `no table #${id}`);
  const end = page.indexOf('</table>', start);
  assert.notEqual(end, -1, `table #${id} is not closed`);
  return page.slice(start, end + '</table>'.length);
};

/** Body rows of a table as arrays of decoded cell text. */
const rows = (id) =>
  [...table(id).matchAll(/<tr>([\s\S]*?)<\/tr>/gi)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(stripTags(c[1]))))
    .filter((cells) => cells.length > 0);

/* ============================================================ existence == */

test('the guide page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming the chipset comparison', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /Chipset/i);
});

test('has a non-empty meta description', () => {
  const desc = getDescription(html());
  assert.ok(desc && desc.length > 50, `weak meta description: ${desc}`);
});

test('title and description are unique across the whole site', () => {
  const pages = collectHtmlFiles(ROOT).map((file) => ({ file, html: read(file) }));
  const dupes = checkMeta(pages).filter((f) => f.file === PAGE);
  assert.deepEqual(dupes, [], `meta collisions: ${JSON.stringify(dupes, null, 2)}`);
});

test('canonical URL points at this page', () => {
  const tag = html().match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  assert.ok(tag, 'no rel=canonical');
  assert.ok(tag[0].includes(CANONICAL), `canonical is not ${CANONICAL}`);
});

test('carries the og: tags the other guide pages carry', () => {
  const page = html();
  for (const prop of ['og:title', 'og:description', 'og:type', 'og:url']) {
    assert.match(page, new RegExp(`<meta[^>]*property=["']${prop}["']`, 'i'), `missing ${prop}`);
  }
  assert.match(page, new RegExp(`property=["']og:url["'][^>]*content=["']${CANONICAL}["']`, 'i'));
});

/* ================================== shared markup copied, never rewritten == */

test('nav markup is copied unchanged from the existing guide template', () => {
  assert.equal(
    block(html(), '<nav class="navbar">', '</nav>'),
    block(read(TEMPLATE), '<nav class="navbar">', '</nav>'),
  );
});

test('footer markup is copied unchanged from the existing guide template', () => {
  assert.equal(
    block(html(), '<footer class="footer">', '</footer>'),
    block(read(TEMPLATE), '<footer class="footer">', '</footer>'),
  );
});

/* =========================================================== structure == */

test('covers every section the plan specifies', () => {
  const page = html();
  for (const id of [
    'how-to-read',
    'amd-current',
    'intel-current',
    'previous-gen',
    'which-one',
    'what-the-chipset-does-not-decide',
    'related-guides',
  ]) {
    assert.match(page, new RegExp(`<h2[^>]*id="${id}"`), `missing section #${id}`);
  }
});

test('every table of contents entry resolves to a heading on the page', () => {
  const page = html();
  const toc = block(page, '<nav class="guide-toc">', '</nav>');
  const anchors = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length >= 6, `thin table of contents: ${anchors.length} entries`);
  for (const id of anchors) {
    assert.match(page, new RegExp(`<h[23][^>]*id="${id}"`), `TOC points at missing #${id}`);
  }
});

test('carries all six comparison tables', () => {
  for (const id of TABLE_IDS) assert.ok(table(id).length > 0, `missing table #${id}`);
});

/* ======================================================== chipset scope == */

const EXPECTED_CHIPSETS = {
  'amd-guaranteed': ['A620', 'B650', 'B650E', 'B840', 'B850', 'X670', 'X670E', 'X870', 'X870E'],
  'amd-board-dependent': ['A620', 'B650', 'B650E', 'B840', 'B850', 'X670', 'X670E', 'X870', 'X870E'],
  'intel-guaranteed': ['H810', 'B860', 'Z890'],
  'intel-board-dependent': ['H810', 'B860', 'Z890'],
  'amd-previous': ['B450', 'B550', 'X570'],
  'intel-previous': ['H610', 'B760', 'H770', 'Z790'],
};

test('every table lists exactly the chipsets the plan scopes it to', () => {
  for (const [id, expected] of Object.entries(EXPECTED_CHIPSETS)) {
    const labels = rows(id).map((cells) => cells[0]);
    assert.deepEqual(
      [...labels].sort(),
      [...expected].sort(),
      `table #${id} lists ${labels.join(', ')}`,
    );
  }
});

test('the page covers all 19 chipsets across the four groups', () => {
  const all = new Set(TABLE_IDS.flatMap((id) => rows(id).map((cells) => cells[0])));
  assert.equal(all.size, 19, `expected 19 distinct chipsets, found ${all.size}: ${[...all].join(', ')}`);
});

/* ================================================= the cell vocabulary == */

/**
 * D4: a board-dependent cell must never read as a flat guarantee. Exactly one
 * of these five forms is allowed in the graphics-slot, primary-M.2 and USB4
 * columns. A bare "PCIe 5.0" must fail.
 */
const VOCABULARY = /\brequired\b|\bminimum\b|^Required\b|^Optional\b|^Not supported\b|^Board-dependent\b/;
const BARE_VALUE = /^(?:PCIe\s*\d\.\d(?:\s*x\d+)?|Yes|No)$/i;

test('every board-dependent spec cell uses one of the five allowed forms', () => {
  for (const id of BOARD_DEPENDENT_TABLES) {
    for (const cells of rows(id)) {
      // column 0 is the chipset, the last column is "Boards we've reviewed".
      for (const cell of cells.slice(1, -1)) {
        assert.match(cell, VOCABULARY, `table #${id}, cell "${cell}" uses no recognised form`);
      }
    }
  }
});

test('no board-dependent spec cell states a bare PCIe generation', () => {
  for (const id of BOARD_DEPENDENT_TABLES) {
    for (const cells of rows(id)) {
      for (const cell of cells.slice(1, -1)) {
        assert.doesNotMatch(cell, BARE_VALUE, `table #${id}: "${cell}" is a bare value`);
      }
    }
  }
});

test('the legend appears above both board-dependent tables', () => {
  const page = html();
  const legend = 'How to read this table.';
  const legends = [...page.matchAll(new RegExp(legend, 'g'))];
  assert.ok(legends.length >= 2, `the legend appears ${legends.length} time(s), expected 2`);
  for (const id of BOARD_DEPENDENT_TABLES) {
    const tableAt = page.indexOf(`<table class="spec-table" id="${id}">`);
    const legendBefore = legends.filter((m) => m.index < tableAt).length;
    assert.ok(legendBefore >= 1, `no legend precedes table #${id}`);
  }
});

test('the four contested cells the plan named never read as a flat guarantee', () => {
  const cellFor = (id, chipset, column) => {
    const row = rows(id).find((cells) => cells[0] === chipset);
    assert.ok(row, `no ${chipset} row in #${id}`);
    return row[column];
  };
  // B850 graphics: AMD's floor is Gen4 while shipping boards run Gen5.
  assert.match(cellFor('amd-board-dependent', 'B850', 1), /minimum/,
    'B850 graphics must read as a minimum, never a flat PCIe 5.0');
  // B840 PCIe generation: sources split between Gen3 and Gen4.
  assert.match(cellFor('amd-board-dependent', 'B840', 1), /Board-dependent/,
    'B840 graphics must carry no number');
  assert.match(cellFor('amd-board-dependent', 'B840', 2), /Board-dependent/,
    'B840 primary M.2 must carry no number');
  // USB4 across the B650 family is vendor-optional, not absent.
  assert.match(cellFor('amd-board-dependent', 'B650', 3), /^Optional/,
    'B650 USB4 must read as optional');
  assert.match(cellFor('amd-board-dependent', 'B650E', 3), /^Optional/,
    'B650E USB4 must read as optional');
});

/* ============================== validator and glossary hazards (D11/D12) == */

test('no table row on this page has exactly two cells', () => {
  // scripts/validate.mjs:186 reads any <tr><td>k</td><td>v</td></tr> as a
  // board spec row. On a page comparing four sockets that would make every
  // later socket mention a spec-contradiction and fail the build.
  const twoCellRow = /<tr>\s*<td>[^<]*<\/td>\s*<td>[^<]*<\/td>\s*<\/tr>/i;
  assert.doesNotMatch(html(), twoCellRow, 'a two-cell <tr> would register as a spec claim');
});

test('speeds are written as Gbps, never as a bare G', () => {
  // js/main.js attaches an Ethernet-speed glossary tooltip to "10G" / "2.5G"
  // inside .spec-table cells, so a USB figure written that way gets labelled
  // as a LAN speed.
  for (const id of TABLE_IDS) {
    for (const cells of rows(id)) {
      for (const cell of cells) {
        assert.doesNotMatch(cell, /\b\d+(?:\.\d+)?G\b/, `table #${id}: "${cell}" reads as a LAN speed`);
      }
    }
  }
});

/* =================================================== what we must not say == */

test('says the page is built from published specifications', () => {
  assert.match(prose(), /based on published specifications/i);
});

test('makes no hands-on, benchmark or testing claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran|tried|reproduced|timed|confirmed)\b/i,
    /\bin our (?:testing|benchmarks?|lab|experience)\b/i,
    /\bour test (?:bench|system|rig)\b/i,
    /\bbenchmark/i,
    /\bhands-on\b/i,
  ];
  const text = prose();
  for (const re of banned) assert.doesNotMatch(text, re, `hands-on claim matching ${re}`);
});

test('quotes no price', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

test('carries no affiliate link', () => {
  // A reference page has no buy links, and a search URL here would be a NEW
  // affiliate-search-url violation that cannot be baselined away.
  assert.doesNotMatch(html(), /amazon/i, 'an Amazon link appears on a reference page');
});

/* ============================================================== sources == */

test('a sources block lists where the values came from', () => {
  const page = html();
  const idx = page.indexOf('<h4>Sources</h4>');
  assert.notEqual(idx, -1, 'no Sources block');
  const sources = page.slice(idx);
  const links = [...sources.matchAll(/<a[^>]*href="(https?:[^"]+)"[^>]*>/gi)];
  assert.ok(links.length >= 5, `only ${links.length} sources listed`);
  for (const m of links) {
    assert.match(m[1], /^https:/, `source link is not https: ${m[1]}`);
    assert.match(m[0], /rel="noopener/, `source link lacks rel=noopener: ${m[1]}`);
  }
});

test('records that the vendors own spec pages could not be reached', () => {
  assert.match(prose(), /could not (?:reach|load|open)/i,
    'the page never tells the reader we could not reach AMD or Intel directly');
});

/* ======================================================== cross-linking == */

test('only links reviews.html?chipset= for chipsets the filter can honour', () => {
  // js/main.js reads ?chipset= and matches it against the <option> values in
  // reviews.html. An unmatched value silently leaves the filter on "All
  // Chipsets", so the reader lands on the full list believing it is filtered.
  const options = new Set(
    [...read('reviews.html').matchAll(/<option value="([^"]+)">/g)].map((m) => m[1]),
  );
  const linked = [...html().matchAll(/reviews\.html\?chipset=([A-Za-z0-9]+)/g)].map((m) => m[1]);
  assert.ok(linked.length > 0, 'the page links no filtered review lists at all');
  for (const chipset of linked) {
    assert.ok(options.has(chipset), `reviews.html has no <option> for chipset ${chipset}`);
  }
});

test('chipsets we have reviewed no boards for are not linked', () => {
  for (const [id, column] of [
    ['amd-board-dependent', 4],
    ['intel-board-dependent', 4],
    ['amd-previous', 5],
    ['intel-previous', 5],
  ]) {
    for (const cells of rows(id)) {
      const cell = cells[column];
      assert.ok(cell, `table #${id}: ${cells[0]} has no "boards reviewed" cell`);
      if (/No reviews yet/i.test(cell)) {
        const row = table(id).split('<tr>').find((r) => r.includes(`<td>${cells[0]}</td>`));
        assert.doesNotMatch(row, /<a /, `${cells[0]} says "No reviews yet" but links somewhere`);
      }
    }
  }
});

test('links the sockets guide it sits alongside', () => {
  const refs = new Set(extractRefs(html()).map((r) => r.split('#')[0]));
  assert.ok(refs.has('guide-sockets.html'), 'guide-sockets.html is not linked');
});

test('closes with the standard Related Guides card block', () => {
  const related = section('related-guides');
  const cards = [...related.matchAll(/class="card guide-card"/g)];
  assert.ok(cards.length >= 2, `Related Guides has ${cards.length} cards, expected at least 2`);
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
