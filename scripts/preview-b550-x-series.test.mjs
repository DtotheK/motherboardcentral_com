/**
 * Tests for the GIGABYTE B550 X Series pre-release preview page (issue #28).
 *
 * A preview article is a promise about what we DON'T say: the boards are
 * announced, not released, so any price, release date, SKU name or per-board
 * spec on the page would be invention (CLAUDE.md rules 1 and 2). These tests
 * encode the issue's "do not publish" list as machine-checkable guards so a
 * later edit cannot quietly reintroduce a fabricated spec.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, getTitle, getDescription, stripTags } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'preview-gigabyte-b550-x-series.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);

/* The prose only -- nav, scripts and markup attributes are not claims. */
const prose = () => stripTags(html());

/* ============================================================ existence == */

test('the preview page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a unique-looking title naming the series', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /B550 X Series/i);
});

test('has a non-empty meta description', () => {
  const desc = getDescription(html());
  assert.ok(desc && desc.length > 50, `weak meta description: ${desc}`);
});

test('canonical URL points at this page', () => {
  const tag = html().match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  assert.ok(tag, 'no rel=canonical');
  assert.ok(tag[0].includes(CANONICAL), `canonical is not ${CANONICAL}`);
});

/* ====================================================== pre-release framing == */

test('flags itself as pre-release above the fold', () => {
  // "Above the fold" = before the first <h2>, i.e. in the hero/intro region.
  const aboveFold = stripTags(html().split(/<h2\b/i)[0]);
  assert.match(aboveFold, /pre-?release/i, 'no pre-release marker before the first section');
  assert.match(aboveFold, /announced/i, 'does not say the boards are announced');
  assert.match(
    aboveFold,
    /not (?:yet )?(?:been )?(?:released|on sale|shipping)/i,
    'does not say the boards are not released',
  );
});

test('states we have not tested a board', () => {
  assert.match(prose(), /(?:not|never)\s+(?:\w+\s+){0,3}(?:tested|seen|hands-on)/i);
});

/* ================================================= what we must not say == */

test('makes no benchmark or hands-on performance claim', () => {
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

test('quotes no price', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\b\d+\s?(?:USD|EUR|GBP)\b/i, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

test('gives no release or on-sale date', () => {
  const text = prose();
  // The announcement date (31 July 2026) is confirmed and allowed; a *future*
  // availability date is not.
  const claims = [
    /(?:ships?|shipping|available|on sale|launch(?:es|ing)?|release[sd]?|arrives?)\s+(?:in|on|from|by|during)\s+(?:early |mid-?|late )?(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|20\d\d)/i,
    /(?:availability|release date)\s*:/i,
  ];
  for (const re of claims) {
    assert.doesNotMatch(text, re, `availability date claim matching ${re}`);
  }
});

test('publishes no per-board specification', () => {
  const text = prose();
  const specClaims = {
    'VRM phase count': /\b\d{1,2}\s*\+\s*\d{1,2}\b|\b\d{1,2}[- ]phase\b/i,
    'M.2 count': /\b\d+\s*x?\s*M\.2\b/i,
    'LAN speed': /\b\d+(?:\.\d+)?\s*(?:GbE\b|(?:G|Gigabit)\s+(?:Ethernet|LAN))/i,
    'WiFi generation': /\bwi-?fi\s*(?:7|6e|6|5)\b/i,
    'memory speed': /\bDDR[45]-\d{4}\b/i,
    'audio codec': /\bALC\d{3,4}\b/i,
    'SATA count': /\b\d+\s*x?\s*SATA\b/i,
    'USB port count': /\b\d+\s*x\s*USB\b/i,
  };
  for (const [label, re] of Object.entries(specClaims)) {
    assert.doesNotMatch(text, re, `${label} published (matched ${re})`);
  }
});

test('names no individual board SKU beyond the three announced families', () => {
  const text = prose();
  // A SKU name would look like "B550 X AORUS Elite AX" / "B550 X Gaming X V2":
  // the series name followed by a family and a trailing model suffix.
  assert.doesNotMatch(
    text,
    /B550 X\s+(?:AORUS Elite|Eagle|Gaming)\s+(?:AX|AC|WIFI|V2|X\b|Plus)/i,
    'an invented SKU name appears',
  );
});

test('carries no Amazon link of any kind', () => {
  const amazon = extractRefs(html()).filter((r) => /amazon\./i.test(r));
  assert.deepEqual(amazon, [], 'the boards are not on sale; no affiliate link belongs here');
});

/* ============================================================= sources == */

test('cites all three sources from the issue', () => {
  const refs = extractRefs(html()).join(' ');
  for (const src of [
    'https://www.gigabyte.com/press/news/2440',
    'https://www.techpowerup.com/351252/',
    'https://videocardz.com/newz/gigabyte-introduces-new-b550-x-motherboards-for-amds-aging-am4-platform',
  ]) {
    assert.ok(refs.includes(src), `source not linked: ${src}`);
  }
});

test('records the announcement date', () => {
  assert.match(prose(), /31 July 2026/);
});

/* ======================================================== discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
