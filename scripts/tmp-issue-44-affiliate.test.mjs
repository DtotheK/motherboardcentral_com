/**
 * Acceptance checks for issue #44 (Affiliate batch 1/12: Z890 flagship).
 * Temporary: encodes the issue's acceptance criteria so they can be proven
 * before and after the edit. Not part of the shipped suite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

/** Boards converted in this batch, with the ASIN each search URL becomes. */
const CONVERTED = [
  {
    board: 'ASUS ROG Maximus Z890 Hero',
    search: 'ASUS+ROG+Maximus+Z890+Hero',
    asin: 'B0DGWWRTPV',
    pages: [
      'review-asus-rog-maximus-z890-hero.html',
      'reviews.html',
      'best-motherboard-for-core-ultra-9-285k.html',
    ],
  },
  {
    board: 'ASUS ROG Strix Z890-E Gaming WiFi',
    search: 'ASUS+ROG+Strix+Z890-E+Gaming+WiFi',
    asin: 'B0DJDFY3FL',
    pages: ['review-asus-rog-strix-z890-e-gaming-wifi.html', 'reviews.html'],
  },
  {
    board: 'GIGABYTE Z890 AORUS Master',
    search: 'GIGABYTE+Z890+AORUS+Master',
    asin: 'B0DK7JMBBX',
    pages: [
      'review-gigabyte-z890-aorus-master.html',
      'reviews.html',
      'best-motherboard-for-core-ultra-9-285k.html',
    ],
  },
  {
    board: 'MSI MEG Z890 ACE',
    search: 'MSI+MEG+Z890+ACE',
    asin: 'B0DJPTRP57',
    pages: [
      'review-msi-meg-z890-ace.html',
      'reviews.html',
      'best-motherboard-for-core-ultra-9-285k.html',
    ],
  },
];

/**
 * Left on its search URL on purpose: the only exact-name Amazon candidate
 * (B0DJRNZWGN) now resolves to a different board, so test (a) fails.
 */
const UNVERIFIED_SEARCH = 'ASRock+Z890+Taichi';
const UNVERIFIED_PAGES = [
  'best-motherboard-for-core-ultra-9-285k.html',
  'review-asrock-z890-taichi.html',
  'reviews.html',
];

/** Total `tag=` occurrences on `main` before this batch. Must not change. */
const TAG_COUNT_BEFORE = 341;

/** `validation-baseline.json` count on `main`, and the pairs this batch clears. */
const BASELINE_COUNT_BEFORE = 98;
const PAIRS_CONVERTED = 11;

const TAG = 'tag=motherboardcentral.com-20';
const DP_URL = /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=motherboardcentral\.com-20$/;

const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const corpus = htmlFiles.map((f) => ({ file: f, html: readFileSync(ROOT + f, 'utf8') }));
const allHtml = corpus.map((p) => p.html).join('\n');

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

test('converted boards have zero remaining Amazon search URLs', () => {
  for (const { board, search } of CONVERTED) {
    const hits = corpus.filter((p) => p.html.includes(`s?k=${search}`)).map((p) => p.file);
    assert.deepEqual(hits, [], `${board} still has search URLs in: ${hits.join(', ')}`);
  }
});

test('every converted board links to its ASIN on each of its pages', () => {
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

test('tag count across the repo is unchanged', () => {
  assert.equal(countOf(allHtml, TAG), TAG_COUNT_BEFORE);
});

test('the UNVERIFIED board keeps its search URL untouched', () => {
  const hits = corpus.filter((p) => p.html.includes(`s?k=${UNVERIFIED_SEARCH}`)).map((p) => p.file);
  assert.deepEqual(
    hits.sort(),
    UNVERIFIED_PAGES,
    'ASRock Z890 Taichi links must be left exactly as they were',
  );
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

test('the ledger still carries the four pilot #3 backfill rows', () => {
  const ledger = readFileSync(ROOT + 'docs/affiliate-asins.md', 'utf8');
  for (const asin of ['B0BG6M53DG', 'B0BH7GTY9C', 'B0BRQV1P6M', 'B0BDTHQTJV']) {
    const row = ledger.split('\n').find((l) => l.includes(asin));
    assert.ok(row, `pilot backfill row for ${asin} is missing`);
    assert.match(row, /pilot \(#3\)/, `${asin} must be marked as a pilot #3 backfill`);
  }
});

test('baseline shrinks by exactly the pairs converted, and stays affiliate-only', () => {
  const baseline = JSON.parse(readFileSync(ROOT + 'validation-baseline.json', 'utf8'));
  assert.equal(baseline.count, BASELINE_COUNT_BEFORE - PAIRS_CONVERTED);
  assert.equal(baseline.count, baseline.violations.length);
  const otherRules = baseline.violations.filter((v) => !v.includes(':: affiliate-search-url ::'));
  assert.deepEqual(otherRules, [], 'baseline must contain only affiliate-search-url entries');
});
