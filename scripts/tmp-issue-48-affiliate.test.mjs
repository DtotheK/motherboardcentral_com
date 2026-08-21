/**
 * Acceptance checks for issue #48 (Affiliate batch 5/12: B760).
 * Temporary: encodes the issue's acceptance criteria so they can be proven
 * before and after the edit. Not part of the shipped suite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

/** Boards converted in this batch: every URL spelling -> one ASIN. */
const CONVERTED = [
  {
    board: 'ASRock B760M Pro RS/D4',
    asin: 'B0BQWR37J4',
    searches: ['ASRock+B760M+Pro+RS+D4', 'ASRock+B760M+Pro+RS%2FD4'],
    pages: ['review-asrock-b760m-pro-rs-d4.html', 'reviews.html'],
  },
  {
    board: 'ASRock B760M Steel Legend WiFi',
    asin: 'B0BQWPLY57',
    searches: ['ASRock+B760M+Steel+Legend+WiFi'],
    pages: ['review-asrock-b760m-steel-legend-wifi.html', 'reviews.html'],
  },
  {
    board: 'MSI MAG B760M Mortar WiFi',
    asin: 'B0BRQSXRB2',
    searches: ['MSI+MAG+B760M+Mortar+WiFi'],
    pages: [
      'review-msi-mag-b760m-mortar-wifi.html',
      'reviews.html',
      'best-motherboard-for-i5-12400f.html',
    ],
  },
];

/**
 * Left on search URLs on purpose. Each entry lists every page that must still
 * hold the untouched search URL, so an accidental edit is caught too.
 */
const NOT_CONVERTED = [
  {
    board: 'ASRock B760M-ITX/D4 WiFi',
    searches: ['ASRock+B760M-ITX+D4+WiFi', 'ASRock+B760M-ITX%2FD4+WiFi', 'ASRock+B760M-ITX/D4+WiFi'],
    pages: [
      'best-motherboard-for-i5-12400f.html',
      'review-asrock-b760m-itx-d4-wifi.html',
      'reviews.html',
    ],
  },
  {
    board: 'ASUS Prime B760M-A WiFi D4',
    searches: ['ASUS+Prime+B760M-A+WiFi+D4'],
    pages: [
      'best-motherboard-for-i5-12400f.html',
      'review-asus-prime-b760m-a-wifi-d4.html',
      'reviews.html',
    ],
  },
  {
    board: 'ASUS TUF Gaming B760-PLUS WiFi D4',
    searches: ['ASUS+TUF+Gaming+B760-PLUS+WiFi+D4'],
    pages: ['review-asus-tuf-gaming-b760-plus-wifi-d4.html', 'reviews.html'],
  },
  {
    board: 'GIGABYTE B760 AORUS Elite AX DDR4',
    searches: ['GIGABYTE+B760+AORUS+Elite+AX+DDR4'],
    pages: ['review-gigabyte-b760-aorus-elite-ax-ddr4.html', 'reviews.html'],
  },
  {
    board: 'GIGABYTE B760M DS3H AX DDR4',
    searches: ['GIGABYTE+B760M+DS3H+AX+DDR4'],
    pages: [
      'best-motherboard-for-i5-12400f.html',
      'review-gigabyte-b760m-ds3h-ax-ddr4.html',
      'reviews.html',
    ],
  },
];

/** Total `tag=` occurrences across the HTML corpus on `main`. Must not change. */
const TAG_COUNT_BEFORE = 336;

/** Baseline `count` on `main`, and the (page, URL) pairs this batch removes. */
const BASELINE_COUNT_BEFORE = 127;
const BASELINE_PAIRS_CONVERTED = 7;

const TAG = 'tag=motherboardcentral.com-20';
const DP_URL = /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=motherboardcentral\.com-20$/;

const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const corpus = htmlFiles.map((f) => ({ file: f, html: readFileSync(ROOT + f, 'utf8') }));
const allHtml = corpus.map((p) => p.html).join('\n');

const countOf = (haystack, needle) => haystack.split(needle).length - 1;
const filesWith = (needle) => corpus.filter((p) => p.html.includes(needle)).map((p) => p.file).sort();

test('converted boards have zero remaining Amazon search URLs', () => {
  for (const { board, searches } of CONVERTED) {
    for (const search of searches) {
      assert.deepEqual(filesWith(`s?k=${search}`), [], `${board}: "${search}" still present`);
    }
  }
});

test('every converted board links to its ASIN on every page that referenced it', () => {
  for (const { board, asin, pages } of CONVERTED) {
    const url = `https://www.amazon.com/dp/${asin}?${TAG}`;
    for (const page of pages) {
      const html = readFileSync(ROOT + page, 'utf8');
      assert.ok(html.includes(url), `${board}: ${asin} missing from ${page}`);
    }
  }
});

test('every Amazon /dp/ href matches the exact required URL format', () => {
  for (const { file, html } of corpus) {
    for (const [, href] of html.matchAll(/href="([^"]*amazon\.com\/dp\/[^"]*)"/g)) {
      assert.match(href, DP_URL, `${file}: malformed product URL ${href}`);
    }
  }
});

test('tag count across the HTML corpus is unchanged', () => {
  assert.equal(countOf(allHtml, TAG), TAG_COUNT_BEFORE);
});

test('unconverted boards keep their search URLs on exactly the same pages', () => {
  for (const { board, searches, pages } of NOT_CONVERTED) {
    const seen = new Set();
    for (const search of searches) {
      for (const f of filesWith(`s?k=${search}`)) seen.add(f);
    }
    assert.deepEqual([...seen].sort(), pages.slice().sort(), `${board}: links must be untouched`);
  }
});

test('each ASIN appears in the ledger exactly once, mapped to its board', () => {
  const ledger = readFileSync(ROOT + 'docs/affiliate-asins.md', 'utf8');
  for (const { board, asin } of CONVERTED) {
    assert.equal(countOf(ledger, asin), 1, `${asin} must appear exactly once in the ledger`);
    const row = ledger.split('\n').find((l) => l.includes(asin));
    assert.ok(row.includes(board), `${asin} row must name ${board}, got: ${row}`);
  }
});

test('no ASIN is reused across two different ledger rows', () => {
  const ledger = readFileSync(ROOT + 'docs/affiliate-asins.md', 'utf8');
  const asins = [...ledger.matchAll(/\|\s*(B0[A-Z0-9]{8})\s*\|/g)].map((m) => m[1]);
  assert.equal(new Set(asins).size, asins.length, 'duplicate ASIN in ledger');
});

test('baseline shrinks by exactly the pairs converted, and stays affiliate-only', () => {
  const baseline = JSON.parse(readFileSync(ROOT + 'validation-baseline.json', 'utf8'));
  assert.equal(baseline.count, BASELINE_COUNT_BEFORE - BASELINE_PAIRS_CONVERTED);
  assert.equal(baseline.violations.length, baseline.count);
  for (const v of baseline.violations) {
    assert.ok(v.includes(':: affiliate-search-url ::'), `non-affiliate rule in baseline: ${v}`);
  }
});
