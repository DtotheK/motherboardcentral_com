// Issue #46 — Affiliate batch 3/12: B860.
// Locks in the search-URL -> direct-product-link conversion for this batch.
// Scoped to this batch's four boards on purpose: no repo-wide tag snapshot, so
// later batches can land without editing this file.
//
// Two of the four boards were deliberately NOT converted, and the UNCONVERTED
// table below pins that decision so a later run cannot quietly "fix" it:
//   - GIGABYTE B860 AORUS Elite WiFi7 is UNVERIFIED (every Amazon listing found
//     is the "ICE" revision, which the recipe's reject list excludes).
//   - ASRock B860M Pro RS WiFi is PENDING-HUMAN (ASRock's own spec page says
//     Wi-Fi 6E, our table says WiFi 7; WiFi variant is in the comparison set).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
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
    board: 'ASUS TUF Gaming B860-Plus WiFi',
    search: 'ASUS+TUF+Gaming+B860-Plus+WiFi+motherboard',
    asin: 'B0DFPNHCMX',
    pages: [
      'best-motherboard-for-core-ultra-5-245k.html',
      'review-asus-tuf-gaming-b860-plus-wifi.html',
      'reviews.html',
    ],
  },
  {
    board: 'MSI MAG B860 Tomahawk WiFi',
    search: 'MSI+MAG+B860+Tomahawk+WiFi+motherboard',
    asin: 'B0DQBJ64KH',
    pages: [
      'best-motherboard-for-core-ultra-5-245k.html',
      'review-msi-mag-b860-tomahawk-wifi.html',
      'reviews.html',
    ],
  },
];

// Boards whose links must stay as search URLs. The recipe requires the button
// to be left untouched, not deleted, when a board cannot be confidently verified.
const UNCONVERTED = [
  {
    board: 'GIGABYTE B860 AORUS Elite WiFi7',
    status: 'UNVERIFIED',
    search: 'GIGABYTE+B860+AORUS+Elite+WiFi7+motherboard',
    pages: [
      'best-motherboard-for-core-ultra-5-245k.html',
      'review-gigabyte-b860-aorus-elite-wifi7.html',
      'reviews.html',
    ],
  },
  {
    board: 'ASRock B860M Pro RS WiFi',
    status: 'PENDING-HUMAN',
    search: 'ASRock+B860M+Pro+RS+WiFi+motherboard',
    pages: ['review-asrock-b860m-pro-rs-wifi.html', 'reviews.html'],
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

test('unconverted boards keep their search URLs on exactly their own pages', () => {
  for (const { board, search, pages } of UNCONVERTED) {
    assert.deepEqual(
      filesContaining(`s?k=${search}`),
      pages.slice().sort(),
      `${board}: search URL must be left untouched on exactly its own pages`,
    );
  }
});

test('unconverted boards are recorded in the ledger with their status', () => {
  const ledger = readFileSync(join(ROOT, 'docs/affiliate-asins.md'), 'utf8');
  for (const { board, status } of UNCONVERTED) {
    assert.ok(ledger.includes(board), `${board}: missing from the ledger`);
    const row = ledger.split('\n').find((line) => line.includes(board) && line.includes(status));
    assert.ok(row, `${board}: no ledger row records it as ${status}`);
  }
});

test('the rejected GIGABYTE "ICE" revision is never linked as this board', () => {
  // B0DQ2773J1 / B0DQLH4ZTR are the B860 AORUS Elite WIFI7 ICE listings. ICE is
  // a revision token, so linking either from our non-ICE page would be the exact
  // substitution the recipe forbids.
  for (const asin of ['B0DQ2773J1', 'B0DQLH4ZTR']) {
    assert.deepEqual(filesContaining(asin), [], `rejected ICE listing ${asin} must not be linked`);
  }
});
