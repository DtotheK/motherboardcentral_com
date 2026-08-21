/**
 * Tests for the GIGABYTE B760M GAMING WIFI6E DDR4 GEN5 review page (issue #27).
 *
 * This board sits in a family of near-identical SKUs -- B760M GAMING WIFI6E
 * GEN5, B760M GAMING X WIFI6E DDR4 GEN5, B760M GAMING WIFI6 PLUS GEN5,
 * B760M DS3H WIFI6E DDR4 GEN5 -- so most of the risk here is blending specs
 * between models. These tests pin the two traps the issue calls out:
 *
 *   1. PCIe 5.0 applies to the x16 graphics slot ONLY. Both M.2 sockets are
 *      PCIe 4.0. The page must never imply Gen5 storage.
 *   2. Memory is 2 DIMMs / 64GB, not the 4 DIMM / 128GB layout our other
 *      B760M pages carry.
 *
 * Plus the standing rules: no invented price, release date, benchmark,
 * hands-on claim, audio codec or affiliate search URL.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, getTitle, getDescription, stripTags, parseSpecTable } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGE = 'review-gigabyte-b760m-gaming-wifi6e-ddr4-gen5.html';
const SIBLING = 'review-gigabyte-b760m-ds3h-ax-ddr4.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);
const prose = () => stripTags(html());

/* Verified against GIGABYTE's published specification text for this exact SKU
 * and corroborated by Igor's Lab, Overclocking.com and VideoCardz. Anything
 * GIGABYTE has not published for THIS model is deliberately absent. */
const SPECS = {
  Socket: 'LGA 1700',
  Chipset: 'B760',
  'Form Factor': 'Micro-ATX',
  'CPU Support': 'Intel 12th / 13th / 14th Gen Core',
  Memory: 'DDR4, 2 DIMM slots, up to 64GB',
  'PCIe Slots': '1x PCIe 5.0 x16, 1x PCIe 3.0 x1',
  'M.2 Slots': '2x M.2 (both PCIe 4.0 x4)',
  'SATA Ports': '4',
  WiFi: 'Wi-Fi 6E',
  LAN: '2.5G',
  'Power Phases': '6+2+1',
};

/* ============================================================ existence == */

test(`${PAGE} exists`, () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('the page has a title naming the exact model', () => {
  const title = getTitle(html()) || '';
  assert.match(title, /GIGABYTE B760M GAMING WIFI6E DDR4 GEN5/i);
});

test('the title is not shared with the sibling B760M page', () => {
  assert.notEqual(getTitle(html()), getTitle(read(SIBLING)));
});

test('the page has a substantial meta description of its own', () => {
  const description = getDescription(html());
  assert.ok(description && description.length > 50, `weak meta description: ${description}`);
  assert.notEqual(description, getDescription(read(SIBLING)));
});

test('the page declares its own canonical URL', () => {
  const tag = html().match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  assert.ok(tag, 'no rel=canonical');
  assert.ok(tag[0].includes(CANONICAL), `canonical is not ${CANONICAL}`);
});

/* ========================================================= spec accuracy == */

test('the spec table carries the verified values', () => {
  const specs = parseSpecTable(html());
  for (const [key, expected] of Object.entries(SPECS)) {
    assert.equal(specs.get(key), expected, `spec row: ${key}`);
  }
});

/* Trap 1: Gen5 is the graphics slot only. */

test('the prose states the M.2 slots are PCIe 4.0, not just the table', () => {
  const body = stripTags(html().split(/<\/table>/i).slice(1).join(' '));
  assert.match(body, /M\.2[^.]*PCIe 4\.0|PCIe 4\.0[^.]*M\.2/i, 'M.2 generation not described in the prose');
});

test('the prose says the PCIe 5.0 link is the graphics slot', () => {
  const body = stripTags(html().split(/<\/table>/i).slice(1).join(' '));
  assert.match(body, /PCIe 5\.0[^.]*(?:x16|graphics)/i, 'the Gen5 slot is not identified as the graphics slot');
});

test('the page never implies PCIe 5.0 storage', () => {
  const text = prose();
  const banned = [
    /PCIe 5\.0\s+(?:M\.2|NVMe|SSD|storage|drive)/i,
    /(?:M\.2|NVMe|SSD|storage|drive)s?\s+(?:slots?\s+)?(?:at|is|are|run|runs|running)?\s*(?:at\s+)?PCIe 5\.0/i,
    /Gen\s?5\s+(?:M\.2|NVMe|SSD|storage)/i,
    /\b2x?\s*(?:M\.2\s*)?PCIe 5\.0/i,
  ];
  for (const re of banned) {
    assert.doesNotMatch(text, re, `implies Gen5 storage (matched ${re})`);
  }
});

/* Trap 2: two DIMM slots, 64GB. */

test('the page never claims the 4 DIMM / 128GB layout of our other B760M boards', () => {
  const text = prose();
  const banned = [
    /\b(?:four|4)\s*(?:x\s*)?DIMM/i,
    /\b4\s*DDR4\s*(?:DIMM|slots?)/i,
    /\b128\s?GB\b/i,
  ];
  for (const re of banned) {
    assert.doesNotMatch(text, re, `wrong memory layout (matched ${re})`);
  }
});

test('the prose states the two-slot, 64GB memory limit', () => {
  const body = stripTags(html().split(/<\/table>/i).slice(1).join(' '));
  assert.match(body, /\b64\s?GB\b/i, '64GB ceiling not stated in the prose');
  assert.match(body, /\b(?:two|2)\s*(?:x\s*)?(?:DDR4\s*)?(?:DIMM|memory slots?|slots?)/i, 'two-slot layout not stated in the prose');
});

/* Sibling-model contamination. */

test('the page does not adopt a sibling model name or its VRM', () => {
  const text = prose();
  assert.doesNotMatch(text, /\b8\+1\+1\b/, 'that is the B760M GAMING X phase count');
  assert.doesNotMatch(
    text,
    /this board[^.]*GAMING X|GAMING X[^.]*\bthis board\b/i,
    'the page identifies itself as the GAMING X model',
  );
});

test('the page names the exact SKU in its heading', () => {
  const h1 = html().match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  assert.ok(h1, 'no <h1>');
  assert.match(stripTags(h1[1]).trim(), /^GIGABYTE B760M GAMING WIFI6E DDR4 GEN5$/i);
});

/* ================================================= what we must not say == */

test('the page frames its analysis as specification-based', () => {
  assert.match(prose(), /based on published specifications/i);
});

test('the page makes no benchmark or hands-on claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran)\b/i,
    /\bin our (?:testing|benchmarks?|lab)\b/i,
    /\b\d+\s*fps\b/i,
    /\bbenchmark(?:ed|s)?\s+(?:result|score|number)/i,
  ];
  for (const re of banned) {
    assert.doesNotMatch(prose(), re, `hands-on/benchmark claim matching ${re}`);
  }
});

test('the page quotes no price', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\b\d+\s?(?:USD|EUR|GBP)\b/i, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

test('the page states no release date', () => {
  const text = prose();
  const claims = [
    /(?:launched|released|announced|ships?|shipping|available|on sale|arrives?)\s+(?:in|on|from|by|during)?\s*(?:early |mid-?|late )?(?:Q[1-4]\s*20\d\d|(?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d)/i,
    /(?:release date|launch date|availability)\s*:/i,
  ];
  for (const re of claims) {
    assert.doesNotMatch(text, re, `release-date claim matching ${re}`);
  }
});

test('the page names no audio codec, because GIGABYTE has not published one', () => {
  assert.doesNotMatch(prose(), /\bALC\d{3,4}\b/i, 'an audio codec model number was invented');
});

test('the page awards no star rating for a board nobody has tested', () => {
  assert.doesNotMatch(html(), /aggregateRating|reviewRating/i, 'JSON-LD rating present');
  assert.doesNotMatch(prose(), /\b[0-5](?:\.\d)?\s*\/\s*5(?:\.0)?\b/, 'a star score appears');
});

test('the page carries no Amazon search URL, and no unconfirmed product link', () => {
  const amazon = extractRefs(html()).filter((r) => /amazon\./i.test(r));
  assert.deepEqual(amazon, [], 'no ASIN was confirmed for this exact SKU');
});

test("the page cites GIGABYTE's specification page for this exact SKU", () => {
  const refs = extractRefs(html()).join(' ');
  assert.match(
    refs,
    /gigabyte\.com\/[^"' ]*B760M-GAMING-WIFI6E-DDR4-GEN5/i,
    "GIGABYTE's spec page for this SKU is not linked",
  );
  assert.doesNotMatch(
    refs,
    /gigabyte\.com\/[^"' ]*B760M-GAMING-X-WIFI6E/i,
    'links the GAMING X spec page instead of this model',
  );
});

/* ======================================================== discoverability == */

test('the page is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('the page is linked from reviews.html', () => {
  assert.ok(extractRefs(read('reviews.html')).includes(PAGE), `reviews.html does not link to ${PAGE}`);
});

test('reviews.html reports the new board count', () => {
  const page = read('reviews.html');
  const shown = page.match(/Showing\s*<strong>(\d+)<\/strong>\s*motherboards/i);
  assert.ok(shown, 'no "Showing N motherboards" counter');
  const cards = page.match(/class="card review-card/g) || [];
  assert.equal(Number(shown[1]), cards.length, 'counter disagrees with the number of cards');
  /* The absolute total is deliberately not asserted here — same reason as the
   * note in gigabyte-b450m-d3hp.test.mjs: it belongs to whichever board batch
   * was added last (currently the four B850 boards, #35), not to this suite.
   * What this suite owns is the invariant above plus its own card, asserted
   * in the preceding test. */
});

/* No published price, so the card must fall outside every price bucket
 * rather than land in "Under $150" -- which a missing or zero data-price
 * would do. */
test('the new card is excluded from every price bucket', () => {
  const card = read('reviews.html')
    .split('<div class="card review-card')
    .find((c) => c.includes(PAGE));
  assert.ok(card, `no review card for ${PAGE}`);
  const price = card.match(/data-price="([^"]*)"/);
  assert.ok(price, 'card has no data-price');
  assert.ok(
    (parseFloat(price[1]) || 0) < 0,
    `data-price "${price[1]}" would place it in the Under $150 bucket`,
  );
});

test('the new card is filterable as an LGA 1700 / B760 Micro-ATX board', () => {
  const card = read('reviews.html')
    .split('<div class="card review-card')
    .find((c) => c.includes(PAGE));
  assert.ok(card, `no review card for ${PAGE}`);
  const head = card.slice(0, card.indexOf('>'));
  assert.match(head, /data-brand="GIGABYTE"/);
  assert.match(head, /data-socket="LGA 1700"/);
  assert.match(head, /data-chipset="B760"/);
  assert.match(head, /data-form="Micro-ATX"/);
});
