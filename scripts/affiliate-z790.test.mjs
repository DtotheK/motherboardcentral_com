// Issue #47 — Affiliate batch 4/12: Z790.
// Locks in the search-URL -> direct-product-link conversion for the Z790 batch.
// Scoped to this batch's boards on purpose: no repo-wide tag snapshot, so later
// batches can land without editing this file.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Built by concatenation so this file does not itself count as an occurrence
// of the affiliate tag when the tag-count invariant is checked across the repo.
const TAG = ['tag=motherboardcentral', 'com-20'].join('.');
const DP_URL = /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=motherboardcentral\.com-20$/;

const htmlFiles = readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .map((f) => ({ name: f, text: readFileSync(join(ROOT, f), 'utf8') }));

// board -> the search-URL query string it used before conversion, and its ASIN.
const CONVERTED = [
  { board: 'ASRock Z790 Steel Legend WiFi', search: 'ASRock+Z790+Steel+Legend+WiFi+motherboard', asin: 'B0BJF1RS19' },
  { board: 'ASUS Prime Z790-A WiFi', search: 'ASUS+Prime+Z790-A+WiFi+motherboard', asin: 'B0BG6NVPVG' },
  { board: 'ASUS ROG Strix Z790-A Gaming WiFi', search: 'ASUS+ROG+Strix+Z790-A+Gaming+WiFi+motherboard', asin: 'B0BSP5MPC5' },
  { board: 'ASUS ROG Strix Z790-I Gaming WiFi', search: 'ASUS+ROG+Strix+Z790-I+Gaming+WiFi+motherboard', asin: 'B0BHXS6HLH' },
  { board: 'ASUS TUF Gaming Z790-Plus WiFi', search: 'ASUS+TUF+Gaming+Z790-Plus+WiFi+motherboard', asin: 'B0BPHCPSCM' },
  { board: 'GIGABYTE Z790 AORUS Elite AX', search: 'GIGABYTE+Z790+AORUS+Elite+AX+motherboard', asin: 'B0BH9DXY38' },
  { board: 'MSI MPG Z790 Carbon WiFi', search: 'MSI+MPG+Z790+Carbon+WiFi+motherboard', asin: 'B0BHCJ1QK8' },
  { board: 'MSI MPG Z790 Edge WiFi', search: 'MSI+MPG+Z790+Edge+WiFi+motherboard', asin: 'B0BL92SPJQ' },
  { board: 'MSI MPG Z790I Edge WiFi', search: 'MSI+MPG+Z790I+Edge+WiFi+motherboard', asin: 'B0BHCJ6KQ2' },
];

// Left on its search URL deliberately: ASUS's own spec page reports Wi-Fi 7 for
// this board while our spec table says WiFi 6E. PENDING-HUMAN.
const NOT_CONVERTED = [
  {
    board: 'ASUS ROG Strix Z790-E Gaming WiFi II',
    search: 'ASUS+ROG+Strix+Z790-E+Gaming+WiFi+II+motherboard',
    pages: [
      'best-motherboard-for-i7-14700k.html',
      'review-asus-rog-strix-z790-e-gaming-wifi-ii.html',
      'reviews.html',
    ],
  },
];

const countOf = (text, needle) => text.split(needle).length - 1;
const filesContaining = (needle) =>
  htmlFiles.filter((f) => f.text.includes(needle)).map((f) => f.name).sort();

test('every converted board has no search URL left anywhere', () => {
  for (const { board, search } of CONVERTED) {
    assert.deepEqual(filesContaining(`s?k=${search}`), [], `${board}: search URL still present`);
  }
});

test('every converted board links to its direct product URL', () => {
  for (const { board, asin } of CONVERTED) {
    const url = `https://www.amazon.com/dp/${asin}?${TAG}`;
    assert.ok(DP_URL.test(url), `${board}: URL shape is wrong`);
    assert.ok(filesContaining(url).length > 0, `${board}: no page links to ${asin}`);
  }
});

test('each ASIN maps to exactly one board and each board to one ASIN', () => {
  const asins = CONVERTED.map((c) => c.asin);
  assert.equal(new Set(asins).size, asins.length, 'duplicate ASIN across boards');
});

test('converted links carry the affiliate tag and appear only inside href attributes', () => {
  for (const { board, asin } of CONVERTED) {
    const url = `https://www.amazon.com/dp/${asin}?${TAG}`;
    for (const file of htmlFiles) {
      const total = countOf(file.text, url);
      if (total === 0) continue;
      const inHref = countOf(file.text, `href="${url}"`);
      assert.equal(inHref, total, `${board}: ${file.name} has ${asin} outside an href`);
    }
  }
});

// Other batches still hold search URLs on reviews.html; this batch only owns
// the Z790 boards, so the sweep is scoped to Z790 query strings.
test('no Z790 search URL survives except the PENDING-HUMAN board', () => {
  const pending = NOT_CONVERTED.map((n) => `s?k=${n.search}`);
  const survivors = [];
  for (const file of htmlFiles) {
    for (const match of file.text.match(/s\?k=[^"&]*/g) ?? []) {
      if (!/Z790/i.test(match)) continue;
      if (pending.some((p) => p.startsWith(match))) continue;
      survivors.push(`${file.name}: ${match}`);
    }
  }
  assert.deepEqual([...new Set(survivors)], [], 'Z790 search URLs left behind');
});

test('the PENDING-HUMAN board keeps its search URL on exactly the same pages', () => {
  for (const { board, search, pages } of NOT_CONVERTED) {
    assert.deepEqual(filesContaining(`s?k=${search}`), pages.slice().sort(), `${board}: must be untouched`);
  }
});

test('the ledger records every converted ASIN exactly once', () => {
  const ledger = readFileSync(join(ROOT, 'docs/affiliate-asins.md'), 'utf8');
  for (const { board, asin } of CONVERTED) {
    assert.equal(countOf(ledger, asin), 1, `${board}: ${asin} not recorded exactly once`);
    assert.ok(ledger.includes(board), `${board}: missing from the ledger`);
  }
});
