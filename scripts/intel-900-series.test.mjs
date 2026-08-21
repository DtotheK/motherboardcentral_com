/**
 * Tests for the Intel 900-series / LGA 1954 platform hub page (issue #29).
 *
 * Per the approved plan on #29, this page's subject is *the state of the
 * information*, not the hardware. Intel has published no Nova Lake platform
 * material, and every 900-series spec table in circulation traces back to a
 * single leaker's February 2026 post. So the page is defined by what it
 * refuses to print, and these tests encode that refusal as machine-checkable
 * guards -- a later edit cannot quietly reintroduce a leaked number.
 *
 * Same pattern as scripts/preview-b550-x-series.test.mjs.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, getTitle, getDescription, stripTags } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'guide-intel-900-series.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);

/* The prose only -- nav, scripts and markup attributes are not claims. */
const prose = () => stripTags(html());

/* ============================================================ existence == */

test('the 900-series hub page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming the 900-series', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /900[- ]series/i);
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
  // "Above the fold" = before the first <h2>, i.e. the hero + status box.
  const aboveFold = stripTags(html().split(/<h2\b/i)[0]);
  assert.match(
    aboveFold,
    /not (?:been )?(?:officially )?confirmed|pre-?release|unreleased/i,
    'no pre-release / unconfirmed marker before the first section',
  );
});

test('states we have not tested or seen anything', () => {
  assert.match(prose(), /(?:not|never)\s+(?:\w+\s+){0,3}(?:tested|seen|hands-on)/i);
});

/* ================================================= what we must not say == */

test('publishes no leaked platform number', () => {
  const text = prose();
  const banned = {
    'PCIe lane count': /\b\d+\s*PCIe\s*lanes?\b/i,
    'PCIe slot width': /\bPCIe\s*(?:Gen\s*)?5(?:\.0)?\s*x\s*\d+\b/i,
    'DMI generation': /\bDMI\s*[45](?:\.\d)?\b/i,
    'link bandwidth': /\b\d+\s*Gbps\b/i,
    'Thunderbolt generation': /\bThunderbolt\s*[45]\b/i,
    'SATA port count': /\b\d+\s*x?\s*SATA\b/i,
    'USB port count': /\b\d+\s*x\s*USB\b/i,
    'memory speed': /\bDDR5-\d{4}\b/i,
  };
  for (const [label, re] of Object.entries(banned)) {
    assert.doesNotMatch(text, re, `${label} published (matched ${re})`);
  }
});

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

test('gives no retail availability date', () => {
  const text = prose();
  const claims = [
    /(?:ships?|shipping|available|on sale|launch(?:es|ing)?|release[sd]?|arrives?)\s+(?:in|on|from|by|during)\s+(?:early |mid-?|late )?(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|20\d\d)/i,
    /(?:availability|release date)\s*:/i,
  ];
  for (const re of claims) {
    assert.doesNotMatch(text, re, `availability date claim matching ${re}`);
  }
});

test('carries no Amazon link of any kind', () => {
  const amazon = extractRefs(html()).filter((r) => /amazon\./i.test(r));
  assert.deepEqual(amazon, [], 'nothing on this platform is on sale; no affiliate link belongs here');
});

/* ======================================================= what it must say == */

test('names all five reported chipset tiers', () => {
  const text = prose();
  for (const tier of ['Z990', 'Z970', 'W980', 'Q970', 'B960']) {
    assert.match(text, new RegExp(`\\b${tier}\\b`), `chipset tier not named: ${tier}`);
  }
});

test('names the socket', () => {
  assert.match(prose(), /LGA\s?1954/i);
});

test('states the one-source rule', () => {
  assert.match(
    prose(),
    /single (?:source|leaker)|one (?:source|leaker)|same (?:single )?source/i,
    'the page does not state that repetition across outlets is not corroboration',
  );
});

test('separates what Intel confirmed from what is only reported', () => {
  const h = html();
  assert.match(h, /<h2\b[^>]*\bid=["']confirmed["']/i, 'no #confirmed section');
  assert.match(h, /<h2\b[^>]*\bid=["']reported["']/i, 'no #reported section');
  assert.match(h, /<h2\b[^>]*\bid=["']not-printing["']/i, 'no #not-printing section');
});

test('every table of contents entry points at a real section id', () => {
  const h = html();
  const ids = new Set([...h.matchAll(/<h2\b[^>]*\bid=["']([^"']+)["']/gi)].map((m) => m[1]));
  const tocLinks = [...h.matchAll(/<nav class="guide-toc">[\s\S]*?<\/nav>/gi)]
    .flatMap((block) => [...block[0].matchAll(/href="#([^"]+)"/gi)].map((m) => m[1]));
  assert.ok(tocLinks.length > 0, 'no table of contents links found');
  for (const link of tocLinks) {
    assert.ok(ids.has(link), `TOC links #${link} but no <h2 id="${link}"> exists`);
  }
  assert.equal(tocLinks.length, ids.size, 'TOC and <h2> sections are not one-to-one');
});

/* ============================================================= sources == */

test('cites every source named in the issue', () => {
  const refs = extractRefs(html()).join(' ');
  for (const src of [
    'https://www.tomshardware.com/pc-components/chipsets/intels-new-platform-for-nova-lake-chips-leaked-up-to-48-pcie-lanes-and-all-new-chipset-900-series-motherboards-with-lga1954-socket-arrive-in-late-2026',
    'https://www.igorslab.de/en/intel-nova-lake-reveals-first-platform-details-lga1954-900-series-chipsets-and-a-hint-of-ddr5-8000-from-the-oem-sector/',
    'https://wccftech.com/intel-900-series-chipset-specs-leak-z990-z970-w980-q970-b960-next-gen-nova-lake/',
    'https://overclock3d.net/news/cpu_mainboard/intel-900-series-nova-lake-cpu-chipset-specs-leak/',
    'https://www.tweaktown.com/news/110086/intels-new-900-series-chipset-z990-z970-w980-q970-b960-for-next-gen-nova-lake-desktop-cpu/index.html',
    'https://en.wikipedia.org/wiki/LGA_1954',
  ]) {
    assert.ok(refs.includes(src), `source not linked: ${src}`);
  }
});

test('cites the Intel first-party material the confirmed section rests on', () => {
  const refs = extractRefs(html()).join(' ');
  assert.ok(
    refs.includes('https://newsroom.intel.com/corporate/lip-bu-tan-steps-in-the-right-direction'),
    'the confirmed section must link the Intel newsroom post it quotes',
  );
});

test('dates the status line honestly', () => {
  assert.match(prose(), /Status as of 21 August 2026/);
});

/* ======================================================== discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});

test('is linked from the sockets guide', () => {
  assert.ok(
    extractRefs(read('guide-sockets.html')).includes(PAGE),
    `guide-sockets.html does not link to ${PAGE}`,
  );
});

test('LGA 1954 is kept out of the sockets guide compatibility table', () => {
  // That table is guide-sockets.html's factual spec table. An unreleased,
  // unconfirmed socket does not belong in it.
  const tables = read('guide-sockets.html').match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const table of tables) {
    assert.doesNotMatch(stripTags(table), /LGA\s?1954/i, 'LGA 1954 added to a spec table');
  }
});
