// Issue #45 — Affiliate batch 2/12: Z890 mainstream.
// Locks in the search-URL -> direct-product-link conversion for this batch.
// Scoped to this batch's five boards on purpose: no repo-wide tag snapshot, so
// later batches can land without editing this file. Batch #44 (Z890 flagship)
// still holds Z890 search URLs, so the sweep below is per-board, not per-chipset.

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

// board -> the search-URL query string it used before conversion, its ASIN, and
// every page that carries the link. Page lists are asserted exactly so a link
// silently appearing on or vanishing from a page is caught.
const CONVERTED = [
  {
    board: 'ASUS Prime Z890-P WiFi',
    search: 'ASUS+Prime+Z890-P+WiFi+motherboard',
    asin: 'B0DGWTQWL3',
    pages: ['review-asus-prime-z890-p-wifi.html', 'reviews.html'],
  },
  {
    board: 'ASUS TUF Gaming Z890-Plus WiFi',
    search: 'ASUS+TUF+Gaming+Z890-Plus+WiFi+motherboard',
    asin: 'B0DGWNVCHL',
    pages: [
      'best-motherboard-for-core-ultra-9-285k.html',
      'review-asus-tuf-gaming-z890-plus-wifi.html',
      'reviews.html',
    ],
  },
  {
    board: 'MSI MPG Z890 Carbon WiFi',
    search: 'MSI+MPG+Z890+Carbon+WiFi+motherboard',
    asin: 'B0DJPTRFN6',
    pages: [
      'best-motherboard-for-core-ultra-5-245k.html',
      'review-msi-mpg-z890-carbon-wifi.html',
      'reviews.html',
    ],
  },
  {
    board: 'MSI MPG Z890 Edge TI WiFi',
    search: 'MSI+MPG+Z890+Edge+TI+WiFi+motherboard',
    asin: 'B0DK4C8GYK',
    pages: ['review-msi-mpg-z890-edge-ti-wifi.html', 'reviews.html'],
  },
  {
    board: 'MSI PRO Z890-A WiFi',
    search: 'MSI+PRO+Z890-A+WiFi+motherboard',
    asin: 'B0DH6W5M6R',
    pages: [
      'best-motherboard-for-core-ultra-5-245k.html',
      'review-msi-pro-z890-a-wifi.html',
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

test('every converted board links to its direct product URL on exactly its own pages', () => {
  for (const { board, asin, pages } of CONVERTED) {
    const url = `https://www.amazon.com/dp/${asin}?${TAG}`;
    assert.ok(DP_URL.test(url), `${board}: URL shape is wrong`);
    assert.deepEqual(filesContaining(url), pages.slice().sort(), `${board}: wrong page set for ${asin}`);
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

test('no bare ASIN link is left without the affiliate tag', () => {
  for (const { board, asin } of CONVERTED) {
    for (const file of htmlFiles) {
      for (const match of file.text.match(new RegExp(`https://www\\.amazon\\.com/dp/${asin}[^"]*`, 'g')) ?? []) {
        assert.ok(DP_URL.test(match), `${board}: ${file.name} has an untagged or malformed link: ${match}`);
      }
    }
  }
});

test('the ledger records every converted ASIN exactly once', () => {
  const ledger = readFileSync(join(ROOT, 'docs/affiliate-asins.md'), 'utf8');
  for (const { board, asin } of CONVERTED) {
    assert.equal(countOf(ledger, asin), 1, `${board}: ${asin} not recorded exactly once`);
    assert.ok(ledger.includes(board), `${board}: missing from the ledger`);
  }
});
