/**
 * Acceptance checks for issue #49 (Affiliate batch 6/12: X870E).
 * Temporary: encodes the issue's acceptance criteria so they can be proven
 * before and after the edit. Not part of the shipped suite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

/** Boards converted in this batch, with the ASIN each search URL becomes. */
const CONVERTED = [
  { board: 'ASUS ROG Crosshair X870E Hero', search: 'ASUS+ROG+Crosshair+X870E+Hero', asin: 'B0DDZSP2BG' },
  { board: 'ASUS ROG Strix X870E-E Gaming WiFi', search: 'ASUS+ROG+Strix+X870E-E+Gaming+WiFi', asin: 'B0DGQ7NHT2' },
  { board: 'GIGABYTE X870E AORUS Master', search: 'GIGABYTE+X870E+AORUS+Master', asin: 'B0DGVSW4FD' },
  { board: 'MSI MPG X870E Carbon WiFi', search: 'MSI+MPG+X870E+Carbon+WiFi', asin: 'B0DG3QW9TJ' },
];

/** Left on a search URL on purpose: spec disagreement, PENDING-HUMAN. */
const PENDING_HUMAN_SEARCH = 'ASRock+X870E+Taichi';

/** Total `tag=` occurrences on `main` before this batch. Must not change. */
const TAG_COUNT_BEFORE = 336;

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

test('every converted board links to its ASIN on all three pages', () => {
  const pages = ['reviews.html', 'best-motherboard-for-ryzen-9-9950x.html'];
  for (const { board, asin } of CONVERTED) {
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

test('the PENDING-HUMAN board keeps its search URL untouched', () => {
  const hits = corpus.filter((p) => p.html.includes(`s?k=${PENDING_HUMAN_SEARCH}`)).map((p) => p.file);
  assert.deepEqual(
    hits.sort(),
    ['best-motherboard-for-ryzen-9-9950x.html', 'review-asrock-x870e-taichi.html', 'reviews.html'],
    'ASRock X870E Taichi links must be left exactly as they were',
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
