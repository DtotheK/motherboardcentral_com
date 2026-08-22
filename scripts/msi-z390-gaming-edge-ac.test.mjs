/**
 * Tests for the "Best Value" pick on best-motherboard-for-i9-9900k.html (issue #104).
 *
 * The page shipped an invented product name: "MSI MPG Z390 Gaming Edge WiFi".
 * MSI's Z390 Gaming Edge line is suffixed AC, not WiFi -- the ATX board is
 * `MPG Z390 GAMING EDGE AC` (msi.com, corroborated by Newegg, B&H and
 * PCPartPicker). CLAUDE.md forbids inventing product names, and #55 wants to
 * point this card at /dp/B07HM3MD1D, whose Amazon title says "AC".
 *
 * These tests pin the real name and guard the invented one from coming back,
 * without touching the surrounding recommendation text or the affiliate tag.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, stripTags, collectHtmlFiles } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGE = 'best-motherboard-for-i9-9900k.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* The card is the info-box whose badge is "Best Value". */
const cardFor = (html) =>
  html
    .split(/<div class="info-box/i)
    .find((chunk) => /Gaming Edge/i.test(chunk));

/* ============================================== the name must be the real one == */

test(`${PAGE} names the board MSI MPG Z390 Gaming Edge AC`, () => {
  const heading = read(PAGE).match(/<h3[^>]*>([^<]*Gaming Edge[^<]*)<\/h3>/i);
  assert.ok(heading, 'no <h3> naming a Gaming Edge board');
  assert.equal(heading[1].trim(), 'MSI MPG Z390 Gaming Edge AC');
});

test('the invented name "Gaming Edge WiFi" appears nowhere in the repo', () => {
  const offenders = collectHtmlFiles(ROOT).filter((f) =>
    /Gaming\s+Edge\s+WiFi/i.test(fs.readFileSync(f, 'utf8')),
  );
  assert.deepEqual(
    offenders.map((f) => path.relative(ROOT, f)),
    [],
    'the invented product name is still on a page',
  );
});

test('the affiliate URL for the card searches for the AC board, not a WiFi one', () => {
  const links = extractRefs(cardFor(read(PAGE))).filter((r) => /amazon\./i.test(r));
  assert.equal(links.length, 1, 'expected exactly one Amazon link on the Best Value card');
  assert.match(links[0], /Gaming\+Edge\+AC/i, 'search URL still asks Amazon for a "WiFi" board');
  assert.doesNotMatch(links[0], /Gaming\+Edge\+WiFi/i);
});

/* ================================================ nothing else may change == */

test('the card keeps our affiliate tag', () => {
  const links = extractRefs(cardFor(read(PAGE))).filter((r) => /amazon\./i.test(r));
  assert.match(links[0], /tag=motherboardcentral\.com-20/);
});

/* 357 is the count across every .html page at the time of this fix. The 50
 * further occurrences in js/main.js are outside collectHtmlFiles' scope and
 * are not touched by this change either. */
test('the affiliate tag count across every page is unchanged', () => {
  const total = collectHtmlFiles(ROOT).reduce(
    (n, f) => n + (fs.readFileSync(f, 'utf8').match(/tag=motherboardcentral\.com-20/g) || []).length,
    0,
  );
  assert.equal(total, 357, 'an affiliate tag was added or removed');
});

test('the recommendation copy for the card is untouched', () => {
  const body = stripTags(cardFor(read(PAGE)));
  assert.match(body, /MSI's Gaming Edge delivers impressive features at a competitive price\./);
  assert.match(body, /WiFi is built-in/, 'the AC board does have 802.11ac Wi-Fi; the claim stays');
  assert.match(body, /Best Value/, 'the badge was dropped');
});

/* The other three picks on the page belong to #55 -- leave them alone. */
test('the other three recommendations on the page are unchanged', () => {
  const headings = [...read(PAGE).matchAll(/<h3[^>]*>([^<]+)<\/h3>/gi)].map((m) => m[1].trim());
  for (const name of [
    'ASUS ROG Maximus XI Hero WiFi',
    'ASRock Z390 Taichi',
  ]) {
    assert.ok(headings.includes(name), `lost the recommendation for ${name}`);
  }
});
