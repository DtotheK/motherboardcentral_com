/**
 * Tests for the GIGABYTE B450M D3HP and B450M D3HP WIFI6E review pages (issue #26).
 *
 * These are brand-new boards we have not tested, whose price and on-sale date
 * GIGABYTE has not published. So the tests guard two things at once:
 *
 *   1. The specs we DO print are the verified ones, and the two pages never
 *      disagree with each other (CLAUDE.md rule 1). The second M.2 slot is the
 *      trap here -- it is PCIe 2.0 x2, not a second full-speed NVMe slot -- so
 *      it gets its own assertions in both the table and the prose.
 *   2. The things we must NOT print stay absent: prices, availability dates,
 *      benchmarks, hands-on claims, an invented audio codec, an invented star
 *      rating, or an Amazon search URL (rules 2 and 3).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, getTitle, getDescription, stripTags, parseSpecTable } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WIRED = 'review-gigabyte-b450m-d3hp.html';
const WIFI = 'review-gigabyte-b450m-d3hp-wifi6e.html';
const PAGES = [WIRED, WIFI];

const canonical = (page) => `https://motherboardcentral.com/${page}`;

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = (page) => read(page);
const prose = (page) => stripTags(html(page));

/* Everything the two boards share. Verified against GIGABYTE's own published
 * specification text, corroborated by Igor's Lab and ThinkComputers. */
const SHARED_SPECS = {
  Socket: 'AM4',
  Chipset: 'B450',
  'Form Factor': 'Micro-ATX',
  Memory: 'DDR4, 4 DIMM slots, up to 128GB',
  'PCIe Slots': '1x PCIe 3.0 x16',
  'M.2 Slots': '2x M.2 (1x PCIe 3.0 x4, 1x PCIe 2.0 x2)',
  'SATA Ports': '4',
  'Rear USB': '7x USB (4x USB 3.2 Gen 1, 3x USB 2.0)',
  LAN: '1G',
  'Power Phases': '4+2',
};

/* The only fields that may differ between the two models. */
const MODEL_SPECS = {
  [WIRED]: { WiFi: 'No WiFi', Bluetooth: 'No BT' },
  [WIFI]: { WiFi: 'Wi-Fi 6E', Bluetooth: 'Bluetooth 5.4' },
};

/* ============================================================ existence == */

for (const page of PAGES) {
  test(`${page} exists`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, page)), `${page} not found`);
  });
}

/* ================================================================= SEO == */

test('each page has a title naming its own model', () => {
  assert.match(getTitle(html(WIRED)) || '', /GIGABYTE B450M D3HP/i);
  assert.match(getTitle(html(WIFI)) || '', /GIGABYTE B450M D3HP WIFI6E/i);
});

test('the two titles are not identical', () => {
  assert.notEqual(getTitle(html(WIRED)), getTitle(html(WIFI)));
});

test('each page has a substantial meta description, and they differ', () => {
  const wired = getDescription(html(WIRED));
  const wifi = getDescription(html(WIFI));
  assert.ok(wired && wired.length > 50, `weak meta description on ${WIRED}: ${wired}`);
  assert.ok(wifi && wifi.length > 50, `weak meta description on ${WIFI}: ${wifi}`);
  assert.notEqual(wired, wifi);
});

for (const page of PAGES) {
  test(`${page} declares its own canonical URL`, () => {
    const tag = html(page).match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    assert.ok(tag, `no rel=canonical on ${page}`);
    assert.ok(tag[0].includes(canonical(page)), `canonical on ${page} is not ${canonical(page)}`);
  });
}

/* ========================================================= spec accuracy == */

for (const page of PAGES) {
  test(`${page} spec table carries the verified shared values`, () => {
    const specs = parseSpecTable(html(page));
    for (const [key, expected] of Object.entries(SHARED_SPECS)) {
      assert.equal(specs.get(key), expected, `${page}: ${key}`);
    }
  });

  test(`${page} spec table states the correct wireless configuration`, () => {
    const specs = parseSpecTable(html(page));
    for (const [key, expected] of Object.entries(MODEL_SPECS[page])) {
      assert.equal(specs.get(key), expected, `${page}: ${key}`);
    }
  });
}

test('the two spec tables agree on every shared field', () => {
  const wired = parseSpecTable(html(WIRED));
  const wifi = parseSpecTable(html(WIFI));
  for (const key of Object.keys(SHARED_SPECS)) {
    assert.equal(wifi.get(key), wired.get(key), `${key} differs between the two pages`);
  }
});

/* The whole point of the issue's warning: the second M.2 is a slow slot. */
for (const page of PAGES) {
  test(`${page} states the second M.2 is PCIe 2.0 x2 in the prose, not just the table`, () => {
    const body = stripTags(html(page).split(/<\/table>/i).slice(1).join(' '));
    assert.match(body, /PCIe 2\.0 x2/i, 'the slow second M.2 slot is not described in the prose');
  });

  test(`${page} never sells the second M.2 as a second full-speed slot`, () => {
    const text = prose(page);
    const banned = [
      /\b(?:two|2|dual|both)\s+(?:full-?speed|fast)\s+(?:M\.2|NVMe)/i,
      /\bM\.2\s+slots?\s+(?:are|both)\s+(?:PCIe\s*3\.0|full-?speed)/i,
      /\b2x?\s*(?:M\.2\s*)?PCIe 3\.0 x4\b/i,
    ];
    for (const re of banned) {
      assert.doesNotMatch(text, re, `overstates the second M.2 (matched ${re})`);
    }
  });
}

/* ================================================= what we must not say == */

for (const page of PAGES) {
  test(`${page} frames its analysis as specification-based`, () => {
    assert.match(prose(page), /based on published specifications/i);
  });

  test(`${page} makes no benchmark or hands-on claim`, () => {
    const banned = [
      /\bwe (?:tested|benchmarked|measured|ran)\b/i,
      /\bin our (?:testing|benchmarks?|lab)\b/i,
      /\b\d+\s*fps\b/i,
      /\bbenchmark(?:ed|s)?\s+(?:result|score|number)/i,
    ];
    for (const re of banned) {
      assert.doesNotMatch(prose(page), re, `hands-on/benchmark claim matching ${re}`);
    }
  });

  test(`${page} quotes no price`, () => {
    const text = prose(page);
    assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
    assert.doesNotMatch(text, /\b\d+\s?(?:USD|EUR|GBP)\b/i, 'a currency figure appears');
    assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
  });

  test(`${page} claims no on-sale or availability date`, () => {
    const text = prose(page);
    const claims = [
      /(?:ships?|shipping|available|on sale|arrives?)\s+(?:in|on|from|by|during)\s+(?:early |mid-?|late )?(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|20\d\d)/i,
      /(?:availability|release date)\s*:/i,
    ];
    for (const re of claims) {
      assert.doesNotMatch(text, re, `availability claim matching ${re}`);
    }
  });

  test(`${page} records the announcement date GIGABYTE did publish`, () => {
    assert.match(prose(page), /14 August 2026/);
  });

  test(`${page} names no audio codec, because GIGABYTE has not published one`, () => {
    assert.doesNotMatch(prose(page), /\bALC\d{3,4}\b/i, 'an audio codec model number was invented');
  });

  test(`${page} awards no star rating for a board nobody has tested`, () => {
    assert.doesNotMatch(html(page), /aggregateRating|reviewRating/i, 'JSON-LD rating present');
    assert.doesNotMatch(prose(page), /\b[0-5](?:\.\d)?\s*\/\s*5(?:\.0)?\b/, 'a star score appears');
  });

  test(`${page} carries no Amazon link, since no listing was confirmed`, () => {
    const amazon = extractRefs(html(page)).filter((r) => /amazon\./i.test(r));
    assert.deepEqual(amazon, [], 'no confirmed ASIN exists for this board yet');
  });

  test(`${page} cites GIGABYTE's own specification page`, () => {
    const refs = extractRefs(html(page)).join(' ');
    assert.match(refs, /gigabyte\.com\/[^"' ]*B450M-D3HP/i, 'GIGABYTE spec page not linked');
  });
}

/* ======================================================== discoverability == */

for (const page of PAGES) {
  test(`${page} is listed in sitemap.xml`, () => {
    assert.ok(read('sitemap.xml').includes(canonical(page)), `sitemap.xml missing ${canonical(page)}`);
  });

  test(`${page} is linked from reviews.html`, () => {
    assert.ok(extractRefs(read('reviews.html')).includes(page), `reviews.html does not link to ${page}`);
  });
}

test('reviews.html reports the new board count', () => {
  const shown = read('reviews.html').match(/Showing\s*<strong>(\d+)<\/strong>\s*motherboards/i);
  assert.ok(shown, 'no "Showing N motherboards" counter');
  const cards = read('reviews.html').match(/class="card review-card/g) || [];
  assert.equal(Number(shown[1]), cards.length, 'counter disagrees with the number of cards');
  assert.equal(cards.length, 72, 'expected the two new B450 cards on top of the existing 70');
});

test('reviews.html can filter to the B450 chipset', () => {
  assert.match(read('reviews.html'), /<option value="B450">B450<\/option>/);
});

/* The price filter buckets on data-price. These boards have no published
 * price, so they must fall outside every bucket rather than land in
 * "Under $150" -- which is what a missing or zero data-price would do. */
test('the new cards are excluded from every price bucket', () => {
  const page = read('reviews.html');
  for (const slug of PAGES) {
    const card = page.split('<div class="card review-card').find((c) => c.includes(slug));
    assert.ok(card, `no review card for ${slug}`);
    const price = card.match(/data-price="([^"]*)"/);
    assert.ok(price, `${slug} card has no data-price`);
    const value = parseFloat(price[1]) || 0;
    assert.ok(value < 0, `${slug} data-price "${price[1]}" would place it in the Under $150 bucket`);
  }
});
