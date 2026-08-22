/**
 * Tests for the board-vs-board page generator (issue #39, Phase 1).
 *
 * Every exported function is pure and takes its inputs as arguments, so no
 * test here needs a temp directory or a network call. The two exceptions read
 * real repo files (js/main.js, a review page) on purpose: the generator's
 * whole job is to stay welded to those, and a fixture copy would hide drift.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SOURCING_SENTENCE,
  SPEC_ROWS,
  buildContext,
  checkPages,
  eligibilityReport,
  formatReport,
  listGeneratedPages,
  main,
  pageFilename,
  renderPage,
  countDifferences,
  crossCheck,
  diffRows,
  extractDatabase,
  extractDpLink,
  extractReviewSpecs,
  slugify,
  substitute,
  validatePair,
} from './vs-pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_JS = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

const DB_KEYS = [
  'name', 'brand', 'socket', 'chipset', 'formFactor', 'ramType', 'ramSlots',
  'maxRam', 'pcieSlots', 'm2Slots', 'sataPortsCount', 'usbRearPorts', 'wifi',
  'bluetooth', 'lan', 'audioCodec', 'powerPhases', 'rating', 'amazonSearch',
];

/* ================================================== 1. DB extraction == */

test('extractDatabase reads every board out of the real js/main.js', () => {
  const db = extractDatabase(MAIN_JS);
  assert.equal(db.length, 70);
  assert.equal(db[0].name, 'ASUS ROG Maximus Z790 Hero');
});

test('every extracted board carries all 19 spec keys', () => {
  for (const board of extractDatabase(MAIN_JS)) {
    assert.deepEqual(Object.keys(board).sort(), [...DB_KEYS].sort(), board.name);
  }
});

test('extractDatabase throws when the opening marker is gone', () => {
  assert.throws(
    () => extractDatabase('const somethingElse = [];'),
    /motherboardDatabase markers not found/,
  );
});

test('extractDatabase throws when the array is never closed', () => {
  assert.throws(
    () => extractDatabase('const motherboardDatabase = [ { name: "x" },'),
    /motherboardDatabase markers not found/,
  );
});

/* ========================================================= slugify == */

test('slugify matches the compare tool on the awkward board name', () => {
  assert.equal(slugify('ASRock A620M-HDV/M.2+'), 'asrock-a620m-hdv-m2-plus');
});

test('slugify of every board name matches its review-page filename', () => {
  const db = extractDatabase(MAIN_JS);
  const missing = db
    .map((b) => slugify(b.name))
    .filter((slug) => !fs.existsSync(path.join(ROOT, `review-${slug}.html`)));
  assert.deepEqual(missing, []);
});

/* ============================ 2. review-page extraction + cross-check == */

const TOMAHAWK = 'msi-mag-b650-tomahawk-wifi';
const TOMAHAWK_HTML = fs.readFileSync(path.join(ROOT, `review-${TOMAHAWK}.html`), 'utf8');

function boardNamed(name) {
  const row = extractDatabase(MAIN_JS).find((b) => b.name === name);
  assert.ok(row, `no database row named ${name}`);
  return row;
}

test('extractDpLink returns null for a page that still links to a search URL', () => {
  const html = '<a href="https://www.amazon.com/s?k=MSI+B650&tag=motherboardcentral.com-20">Buy</a>';
  assert.equal(extractDpLink(html), null);
});

test('extractDpLink returns the direct product URL verbatim', () => {
  assert.equal(
    extractDpLink(TOMAHAWK_HTML),
    'https://www.amazon.com/dp/B0BHCCNSRH?tag=motherboardcentral.com-20',
  );
});

test('extractDpLink ignores a product URL that is missing our tag', () => {
  assert.equal(extractDpLink('<a href="https://www.amazon.com/dp/B0BHCCNSRH">Buy</a>'), null);
});

test('extractReviewSpecs reads the review spec table into a map', () => {
  const specs = extractReviewSpecs(TOMAHAWK_HTML);
  assert.equal(specs.get('Socket'), 'AM5');
  assert.equal(specs.get('Memory'), 'DDR5, 4 DIMM slots, up to 128GB');
  assert.equal(specs.get('Power Phases'), '14+2+1');
});

test('crossCheck finds no disagreement between the database and a real review page', () => {
  const specs = extractReviewSpecs(TOMAHAWK_HTML);
  assert.deepEqual(crossCheck(boardNamed('MSI MAG B650 Tomahawk WiFi'), specs), []);
});

test('crossCheck reports the field when the review page disagrees', () => {
  const edited = TOMAHAWK_HTML.replace(
    '<tr><td>M.2 Slots</td><td>3x M.2</td></tr>',
    '<tr><td>M.2 Slots</td><td>4x M.2</td></tr>',
  );
  assert.deepEqual(crossCheck(boardNamed('MSI MAG B650 Tomahawk WiFi'), extractReviewSpecs(edited)), [
    { field: 'M.2 Slots', db: '3x M.2', review: '4x M.2' },
  ]);
});

test('crossCheck reports a spec the review page never publishes', () => {
  const stripped = TOMAHAWK_HTML.replace('<tr><td>LAN</td><td>2.5G</td></tr>', '');
  assert.deepEqual(crossCheck(boardNamed('MSI MAG B650 Tomahawk WiFi'), extractReviewSpecs(stripped)), [
    { field: 'LAN', db: '2.5G', review: null },
  ]);
});

/* ================================================ 3. the spec diff == */

const differingLabels = (aName, bName) =>
  diffRows(boardNamed(aName), boardNamed(bName)).filter((r) => !r.same).map((r) => r.label);

test('SPEC_ROWS is the compare tool row list, same labels in the same order', () => {
  const block = MAIN_JS.slice(MAIN_JS.indexOf('const specRows = ['));
  const labels = [...block.slice(0, block.indexOf('];')).matchAll(/label:\s*'([^']+)'/g)]
    .map((m) => m[1]);
  assert.deepEqual(SPEC_ROWS.map((r) => r.label), labels);
});

test('diffRows renders one row per spec and marks the identical ones', () => {
  const rows = diffRows(boardNamed('MSI MAG B650 Tomahawk WiFi'), boardNamed('GIGABYTE B650 AORUS Elite AX'));
  assert.equal(rows.length, SPEC_ROWS.length);

  const socket = rows.find((r) => r.label === 'Socket');
  assert.deepEqual(socket, { label: 'Socket', aValue: 'AM5', bValue: 'AM5', same: true });

  const m2 = rows.find((r) => r.label === 'M.2 Slots');
  assert.deepEqual(m2, { label: 'M.2 Slots', aValue: '3x M.2', bValue: '2x M.2', same: false });
});

test('diffRows formats the rating row the way the compare tool does', () => {
  const rating = diffRows(
    boardNamed('MSI MAG B650 Tomahawk WiFi'),
    boardNamed('ASUS TUF Gaming B650-Plus WiFi'),
  ).find((r) => r.label === 'Rating');
  assert.deepEqual(rating, { label: 'Rating', aValue: '4.5 / 5.0', bValue: '4.4 / 5.0', same: false });
});

test('the Tomahawk and the AORUS Elite AX differ on exactly two specs', () => {
  assert.deepEqual(
    differingLabels('MSI MAG B650 Tomahawk WiFi', 'GIGABYTE B650 AORUS Elite AX'),
    ['Brand', 'M.2 Slots', 'Power Phases'],
  );
  assert.equal(
    countDifferences(diffRows(
      boardNamed('MSI MAG B650 Tomahawk WiFi'),
      boardNamed('GIGABYTE B650 AORUS Elite AX'),
    )),
    2,
  );
});

/* ================================================ 4. pair validation == */

const AORUS = 'gigabyte-b650-aorus-elite-ax';
const CTX = buildContext(ROOT);

/** n throwaway words, so a test can sit either side of the word-count gate. */
const filler = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

/** A pair that passes every rule, so each test can break exactly one thing. */
function cleanPair(overrides = {}) {
  return {
    a: AORUS,
    b: TOMAHAWK,
    verified: {
      [TOMAHAWK]: { source: 'https://www.msi.com/Motherboard/MAG-B650-TOMAHAWK-WIFI', date: '2026-08-22' },
      [AORUS]: { source: 'https://www.gigabyte.com/Motherboard/B650-AORUS-ELITE-AX', date: '2026-08-22' },
    },
    intro: 'Two boards on the same platform, close enough in specification that most readers will be choosing between them rather than between tiers.',
    glance: [
      'Storage is where they part: the {a.name} carries {a.m2Slots} against {b.m2Slots} on the {b.name}.',
      'Power delivery differs too, {a.powerPhases} against {b.powerPhases}.',
      'Every other row in the table below reads the same on both boards.',
    ],
    body: `The difference a builder will actually feel is storage headroom. ${filler(200)}`,
    verdictA: `Get the {a.name} if you want the extra drive bay from the start. ${filler(20)}`,
    verdictB: `Get the {b.name} if you never expect to fill the drives you have. ${filler(20)}`,
    ...overrides,
  };
}

test('buildContext indexes every board and its review page by slug', () => {
  assert.equal(CTX.db.size, 70);
  assert.equal(CTX.db.get(TOMAHAWK).name, 'MSI MAG B650 Tomahawk WiFi');
  assert.ok(CTX.reviews.get(TOMAHAWK).includes('<title>'));
});

test('substitute replaces placeholders with database values', () => {
  assert.equal(
    substitute('{a.name} has {a.m2Slots}, {b.name} has {b.m2Slots}', CTX.db.get(TOMAHAWK), CTX.db.get(AORUS)),
    'MSI MAG B650 Tomahawk WiFi has 3x M.2, GIGABYTE B650 AORUS Elite AX has 2x M.2',
  );
});

test('a pair that satisfies every rule reports no problems', () => {
  assert.deepEqual(validatePair(cleanPair(), CTX), []);
});

test('validatePair rejects a slug that is not in the database', () => {
  assert.deepEqual(validatePair(cleanPair({ a: 'bogus-board' }), CTX), [
    'unknown board slug: bogus-board',
  ]);
});

test('validatePair rejects a pair listed out of alphabetical order', () => {
  const pair = cleanPair({ a: TOMAHAWK, b: AORUS });
  assert.deepEqual(validatePair(pair, CTX), [
    `pair is out of order: list ${AORUS} first, because the filename is alphabetical (D3)`,
  ]);
});

test('validatePair rejects a board with no review page', () => {
  const ctx = { db: CTX.db, reviews: new Map(CTX.reviews) };
  ctx.reviews.delete(AORUS);
  assert.deepEqual(validatePair(cleanPair(), ctx), [
    `missing review page: review-${AORUS}.html`,
  ]);
});

test('validatePair rejects a board whose review page has no direct product link', () => {
  const ctx = { db: CTX.db, reviews: new Map(CTX.reviews) };
  ctx.reviews.set(AORUS, CTX.reviews.get(AORUS).replaceAll('/dp/B0BH7GTY9C', '/s?k=GIGABYTE'));
  assert.deepEqual(validatePair(cleanPair(), ctx), [
    `no direct Amazon product link on review-${AORUS}.html`,
  ]);
});

test('validatePair rejects a board whose review page disagrees with the database', () => {
  const ctx = { db: CTX.db, reviews: new Map(CTX.reviews) };
  ctx.reviews.set(
    TOMAHAWK,
    CTX.reviews.get(TOMAHAWK).replace('<tr><td>M.2 Slots</td><td>3x M.2</td></tr>', '<tr><td>M.2 Slots</td><td>4x M.2</td></tr>'),
  );
  assert.deepEqual(validatePair(cleanPair(), ctx), [
    `review-${TOMAHAWK}.html disagrees with the database on M.2 Slots: database "3x M.2", review "4x M.2"`,
  ]);
});

test('validatePair rejects a pair with no manufacturer verification record', () => {
  const pair = cleanPair();
  delete pair.verified[AORUS];
  assert.deepEqual(validatePair(pair, CTX), [
    `unverified specs for ${AORUS}: needs an https:// manufacturer source and an ISO date (D14)`,
  ]);
});

test('validatePair rejects a verification record without a real source URL', () => {
  const pair = cleanPair();
  pair.verified[AORUS] = { source: 'the box it came in', date: '2026-08-22' };
  assert.deepEqual(validatePair(pair, CTX), [
    `unverified specs for ${AORUS}: needs an https:// manufacturer source and an ISO date (D14)`,
  ]);
});

test('validatePair rejects a verification record without an ISO date', () => {
  const pair = cleanPair();
  pair.verified[AORUS] = { source: 'https://www.gigabyte.com/', date: 'last week' };
  assert.deepEqual(validatePair(pair, CTX), [
    `unverified specs for ${AORUS}: needs an https:// manufacturer source and an ISO date (D14)`,
  ]);
});

test('validatePair rejects a pair too alike to be a head-to-head', () => {
  const tuf = 'asus-tuf-gaming-b650-plus-wifi';
  const pair = cleanPair({ a: tuf, b: TOMAHAWK });
  pair.verified[tuf] = pair.verified[AORUS];
  assert.deepEqual(validatePair(pair, CTX), [
    'only 1 differing spec row: a head-to-head needs at least 2',
  ]);
});

test('validatePair rejects a hand-typed spec value', () => {
  assert.deepEqual(validatePair(cleanPair({ body: `Both boards ship 3x M.2. ${filler(240)}` }), CTX), [
    'hand-typed spec in body: "3x M.2" — read it from the database with a {a.key} placeholder',
  ]);
});

test('validatePair rejects a hand-typed spec value in a bullet', () => {
  const pair = cleanPair();
  pair.glance[1] = 'Power delivery differs, 14+2+1 against 12+2+1.';
  assert.deepEqual(validatePair(pair, CTX), [
    'hand-typed spec in glance[1]: "14+2+1" — read it from the database with a {a.key} placeholder',
  ]);
});

test('validatePair accepts spec words that arrive through a placeholder', () => {
  const pair = cleanPair({ intro: `The {a.socket} platform, {a.ramType} only, on {a.chipset}. ${filler(20)}` });
  assert.deepEqual(validatePair(pair, CTX), []);
});

test('validatePair rejects prose that is too short to be worth publishing', () => {
  assert.deepEqual(validatePair(cleanPair({ body: 'Storage headroom is the difference.' }), CTX), [
    'hand-written prose is 145 words: needs 250-450',
  ]);
});

test('validatePair rejects prose that has run long', () => {
  assert.deepEqual(validatePair(cleanPair({ body: filler(500) }), CTX), [
    'hand-written prose is 640 words: needs 250-450',
  ]);
});

test('validatePair rejects a price', () => {
  assert.deepEqual(validatePair(cleanPair({ verdictB: `Get it to save $40. ${filler(20)}` }), CTX), [
    'price in verdictB: "$40" — we publish no prices',
  ]);
});

test('validatePair rejects a placeholder that names nothing in the database', () => {
  assert.deepEqual(validatePair(cleanPair({ body: `It carries {a.m2Slotz}. ${filler(240)}` }), CTX), [
    'unknown placeholder in body: {a.m2Slotz}',
  ]);
});

/* ===================================================== 5. rendering == */

const PAGE = renderPage(cleanPair(), CTX);
const count = (html, needle) => html.split(needle).length - 1;

test('the page filename is the two slugs in alphabetical order', () => {
  assert.equal(pageFilename(cleanPair()), `compare-${AORUS}-vs-${TOMAHAWK}.html`);
});

test('the rendered page has exactly one h1, naming both boards', () => {
  assert.equal(count(PAGE, '<h1'), 1);
  assert.match(PAGE, /<h1>GIGABYTE B650 AORUS Elite AX vs MSI MAG B650 Tomahawk WiFi<\/h1>/);
});

test('the rendered page declares a unique title, description and canonical URL', () => {
  assert.equal(count(PAGE, '<link rel="canonical"'), 1);
  assert.ok(PAGE.includes(
    `<link rel="canonical" href="https://motherboardcentral.com/compare-${AORUS}-vs-${TOMAHAWK}.html">`,
  ));
  assert.ok(PAGE.includes(
    '<title>GIGABYTE B650 AORUS Elite AX vs MSI MAG B650 Tomahawk WiFi - MotherboardCentral</title>',
  ));
  assert.match(
    PAGE,
    /<meta name="description" content="GIGABYTE B650 AORUS Elite AX vs MSI MAG B650 Tomahawk WiFi: M\.2 Slots and Power Phases compared, plus which board to buy\.">/,
  );
});

test('the rendered page carries both direct product links and no search URL', () => {
  assert.ok(PAGE.includes('https://www.amazon.com/dp/B0BH7GTY9C?tag=motherboardcentral.com-20'));
  assert.ok(PAGE.includes('https://www.amazon.com/dp/B0BHCCNSRH?tag=motherboardcentral.com-20'));
  assert.equal(count(PAGE, '/s?k='), 0);
});

test('the rendered page says what its verdict is based on', () => {
  assert.equal(
    SOURCING_SENTENCE,
    'This comparison is based on the manufacturers\' published specifications. We have not tested either board.',
  );
  assert.ok(PAGE.includes(SOURCING_SENTENCE));
});

test('the rendered page quotes no price and claims no testing', () => {
  assert.doesNotMatch(PAGE, /\$\d/);
  assert.doesNotMatch(PAGE, /\b(?:we tested|benchmark|our testing|in our tests)\b/i);
});

test('the rendered page links back to both reviews and to the compare tool', () => {
  assert.ok(PAGE.includes(`href="review-${AORUS}.html"`));
  assert.ok(PAGE.includes(`href="review-${TOMAHAWK}.html"`));
  assert.ok(PAGE.includes(`href="compare.html?boards=${AORUS},${TOMAHAWK}"`));
});

test('the diff table renders every spec row, marking same and different', () => {
  const table = PAGE.slice(PAGE.indexOf('<table>'), PAGE.indexOf('</table>'));
  for (const row of SPEC_ROWS) assert.ok(table.includes(`<td>${row.label}</td>`), row.label);

  // Brand differs too -- the pill marks cells that differ, which is a wider
  // set than the differences countDifferences gates a pair on.
  assert.equal(count(table, '>Different<'), 3);
  assert.equal(count(table, '>Same<'), SPEC_ROWS.length - 3);
  assert.match(table, /<td>Socket<\/td><td>AM5<\/td><td>AM5<\/td><td><span[^>]*>Same</);
  assert.match(table, /<td>M\.2 Slots<\/td><td>2x M\.2<\/td><td>3x M\.2<\/td><td><span[^>]*>Different</);
});

test('the spec table is in the HTML source, not injected by a script', () => {
  assert.ok(PAGE.includes('<td>2x M.2</td>'));
  assert.ok(PAGE.includes('<td>3x M.2</td>'));
  const scripts = [...PAGE.matchAll(/<script[^>]*>/g)].map((m) => m[0]);
  assert.deepEqual(scripts, [
    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-MN6VW6GV50">',
    '<script>',
    '<script src="js/main.js">',
    '<script defer src="/_vercel/insights/script.js">',
  ]);
});

test('the rendered page reuses the sitewide nav and footer', () => {
  assert.ok(PAGE.includes('<a href="compare.html" class="active">Compare</a>'));
  assert.ok(PAGE.includes('&copy; 2026 MotherboardCentral.com. All rights reserved.'));
});

test('the rendered page carries no images', () => {
  assert.equal(count(PAGE, '<img'), 0);
});

test('every placeholder in the prose is resolved before it reaches the page', () => {
  const body = PAGE.slice(PAGE.indexOf('<h1'));
  assert.doesNotMatch(body, /\{[ab]\./);
  assert.ok(body.includes('carries 2x M.2 against 3x M.2'));
});

test('More head-to-heads is omitted when no sibling page shares a board', () => {
  assert.equal(count(PAGE, 'More head-to-heads'), 0);
});

test('More head-to-heads links the sibling pages that share a board', () => {
  const sibling = { a: 'asus-tuf-gaming-b650-plus-wifi', b: TOMAHAWK };
  const unrelated = { a: 'asrock-z890-taichi', b: 'gigabyte-z890-aorus-master' };
  const html = renderPage(cleanPair(), { ...CTX, pairs: [cleanPair(), sibling, unrelated] });

  assert.equal(count(html, 'More head-to-heads'), 1);
  assert.ok(html.includes(`href="compare-asus-tuf-gaming-b650-plus-wifi-vs-${TOMAHAWK}.html"`));
  assert.equal(count(html, 'href="compare-asrock-z890-taichi-vs-'), 0);
});

test('renderPage refuses to render a pair that fails validation', () => {
  assert.throws(
    () => renderPage(cleanPair({ b: 'bogus-board' }), CTX),
    /unknown board slug: bogus-board/,
  );
});

/* ================================= 6+8. committed pages and drift == */

const diskOf = (files) => ({
  files: [...files.keys()],
  read: (f) => (files.has(f) ? files.get(f) : null),
});

test('checkPages is happy when nothing is generated and nothing is committed', () => {
  assert.deepEqual(checkPages([], CTX, diskOf(new Map())), []);
});

test('checkPages accepts a committed page that matches a fresh render', () => {
  const pair = cleanPair();
  const disk = diskOf(new Map([[pageFilename(pair), renderPage(pair, { ...CTX, pairs: [pair] })]]));
  assert.deepEqual(checkPages([pair], CTX, disk), []);
});

test('checkPages reports a pair whose page was never built', () => {
  const pair = cleanPair();
  assert.deepEqual(checkPages([pair], CTX, diskOf(new Map())), [
    `missing generated page: ${pageFilename(pair)} — run npm run vs -- --build`,
  ]);
});

test('checkPages reports a generated page that was edited by hand', () => {
  const pair = cleanPair();
  const edited = renderPage(pair, { ...CTX, pairs: [pair] }).replace('2x M.2', '4x M.2');
  assert.deepEqual(checkPages([pair], CTX, diskOf(new Map([[pageFilename(pair), edited]]))), [
    `hand-edited generated page: ${pageFilename(pair)} — change scripts/vs-pairs.data.mjs and rebuild`,
  ]);
});

test('checkPages reports a committed page no pair claims', () => {
  const disk = diskOf(new Map([['compare-a-board-vs-b-board.html', '<html></html>']]));
  assert.deepEqual(checkPages([], CTX, disk), [
    'orphan generated page: compare-a-board-vs-b-board.html — no entry in scripts/vs-pairs.data.mjs',
  ]);
});

test('every committed vs page matches what the generator produces today', async () => {
  const { pairs } = await import('./vs-pairs.data.mjs');
  const files = listGeneratedPages(ROOT);
  const disk = {
    files,
    read: (f) => fs.readFileSync(path.join(ROOT, f), 'utf8'),
  };
  assert.deepEqual(checkPages(pairs, { ...CTX, pairs }, disk), []);
});

/* ===================================================== 6. the report == */

test('the eligibility report finds the pairs we can and cannot publish', () => {
  const rows = eligibilityReport(CTX);
  const byPair = new Map(rows.pairs.map((r) => [`${r.a} vs ${r.b}`, r]));

  const real = byPair.get(`${AORUS} vs ${TOMAHAWK}`);
  assert.equal(real.differences, 2);
  assert.equal(real.eligible, true);

  const tooAlike = byPair.get(`asus-tuf-gaming-b650-plus-wifi vs ${TOMAHAWK}`);
  assert.equal(tooAlike.differences, 1);
  assert.equal(tooAlike.eligible, false);

  // Only same socket + chipset + form factor pairs are listed at all.
  for (const row of rows.pairs) {
    const a = CTX.db.get(row.a);
    const b = CTX.db.get(row.b);
    assert.equal(a.socket, b.socket);
    assert.equal(a.chipset, b.chipset);
    assert.equal(a.formFactor, b.formFactor);
    assert.ok(row.a < row.b);
  }
});

test('the report records every board direct-link and cross-check status', () => {
  const { boards } = eligibilityReport(CTX);
  assert.equal(boards.length, 70);

  const tomahawk = boards.find((r) => r.slug === TOMAHAWK);
  assert.equal(tomahawk.dpLink, true);
  assert.deepEqual(tomahawk.mismatches, []);

  // The report is the evidence the follow-up spec audit works from, so a
  // board with no direct link has to be visible in it rather than skipped.
  assert.ok(boards.some((r) => r.dpLink === false));
});

test('the printed report counts the boards and pairs it looked at', () => {
  const report = eligibilityReport(CTX);
  const text = formatReport(report);

  assert.match(text, /70 boards/);
  assert.match(text, new RegExp(`${report.pairs.length} same-platform pairs`));
  assert.match(text, /BOARDS/);
  assert.match(text, /PAIRS/);
});

test('the printed report never hides a pair behind a cap', () => {
  const report = eligibilityReport(CTX);
  const text = formatReport(report);
  for (const pair of report.pairs) {
    assert.ok(text.includes(`${pair.a} vs ${pair.b}`), `${pair.a} vs ${pair.b} missing from report`);
  }
});

/* ============================================================ CLI == */

function captured() {
  const out = [];
  const err = [];
  return { out, err, io: { log: (m) => out.push(String(m)), error: (m) => err.push(String(m)) } };
}

test('--report prints the eligibility report and succeeds', async () => {
  const { out, io } = captured();
  assert.equal(await main(['--report'], ROOT, io), 0);
  assert.match(out.join('\n'), /BOARDS — 70 boards in motherboardDatabase/);
});

test('--check passes against the committed pages', async () => {
  const { out, err, io } = captured();
  assert.equal(await main(['--check'], ROOT, io), 0);
  assert.deepEqual(err, []);
  assert.match(out.join('\n'), /0 problem\(s\)/);
});

test('--build writes a page for every pair in the data file', async () => {
  const { out, io } = captured();
  const before = listGeneratedPages(ROOT);
  assert.equal(await main(['--build'], ROOT, io), 0);
  assert.deepEqual(listGeneratedPages(ROOT), before);
  assert.match(out.join('\n'), /0 page\(s\) written/);
});

test('an unrecognised invocation prints usage and fails', async () => {
  const { out, io } = captured();
  assert.equal(await main([], ROOT, io), 2);
  assert.match(out.join('\n'), /usage: node scripts\/vs-pages\.mjs/);
});

test('countDifferences ignores Brand and Rating, so the Tomahawk vs the TUF counts one', () => {
  assert.deepEqual(
    differingLabels('MSI MAG B650 Tomahawk WiFi', 'ASUS TUF Gaming B650-Plus WiFi'),
    ['Brand', 'Power Phases', 'Rating'],
  );
  assert.equal(
    countDifferences(diffRows(
      boardNamed('MSI MAG B650 Tomahawk WiFi'),
      boardNamed('ASUS TUF Gaming B650-Plus WiFi'),
    )),
    1,
  );
});
