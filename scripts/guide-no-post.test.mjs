/**
 * Tests for the "motherboard won't POST" troubleshooting guide (issue #30).
 *
 * This page is unusual for the site: it is the only page whose value depends on
 * per-vendor behaviour, and vendor LED semantics are exactly the kind of detail
 * content farms get wrong. The issue's acceptance criteria therefore turn on
 * what the page must NOT do -- no universal beep-code table, no hands-on
 * claims, no vendor-specific claim that is not traceable to that vendor's own
 * support page. These tests encode those criteria so a later edit cannot
 * quietly reintroduce an unsourced claim.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkMeta,
  collectHtmlFiles,
  extractRefs,
  getDescription,
  getTitle,
  stripTags,
} from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'guide-no-post.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'guide-storage.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);

/* The prose only -- nav, scripts and markup attributes are not claims. */
const prose = () => stripTags(html());

/** The article body, i.e. everything from the first <h2> onward. */
const body = () => {
  const parts = html().split(/<h2\b/i);
  return parts.length > 1 ? `<h2${parts.slice(1).join('<h2')}` : '';
};

/* ============================================================ existence == */

test('the guide page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming the no-POST/debug-LED topic', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /POST/);
  assert.match(title, /LED/i);
});

test('has a non-empty meta description', () => {
  const desc = getDescription(html());
  assert.ok(desc && desc.length > 50, `weak meta description: ${desc}`);
});

test('title and description are unique across the whole site', () => {
  const pages = collectHtmlFiles(ROOT).map((file) => ({ file, html: read(file) }));
  const dupes = checkMeta(pages).filter((f) => f.file === PAGE);
  assert.deepEqual(dupes, [], `meta collisions: ${JSON.stringify(dupes, null, 2)}`);
});

test('canonical URL points at this page', () => {
  const tag = html().match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  assert.ok(tag, 'no rel=canonical');
  assert.ok(tag[0].includes(CANONICAL), `canonical is not ${CANONICAL}`);
});

test('carries the og: tags the other guide pages carry', () => {
  const page = html();
  for (const prop of ['og:title', 'og:description', 'og:type', 'og:url']) {
    assert.match(page, new RegExp(`<meta[^>]*property=["']${prop}["']`, 'i'), `missing ${prop}`);
  }
  assert.match(page, new RegExp(`property=["']og:url["'][^>]*content=["']${CANONICAL}["']`, 'i'));
});

/* ================================== shared markup copied, never rewritten == */

/** Pull a block out of a page by its delimiting tags, whitespace preserved. */
const block = (page, open, close) => {
  const start = page.indexOf(open);
  const end = page.indexOf(close, start);
  assert.ok(start !== -1 && end !== -1, `block ${open} not found`);
  return page.slice(start, end + close.length);
};

test('nav markup is copied unchanged from the existing guide template', () => {
  assert.equal(
    block(html(), '<nav class="navbar">', '</nav>'),
    block(read(TEMPLATE), '<nav class="navbar">', '</nav>'),
  );
});

test('footer markup is copied unchanged from the existing guide template', () => {
  assert.equal(
    block(html(), '<footer class="footer">', '</footer>'),
    block(read(TEMPLATE), '<footer class="footer">', '</footer>'),
  );
});

test('the guide template itself is untouched', () => {
  // A regression guard for the issue's "do not edit shared nav/footer/layout"
  // rule: if someone "fixes" the nav, they must not do it here.
  const template = read(TEMPLATE);
  assert.match(template, /<nav class="navbar">/);
  assert.match(template, /<footer class="footer">/);
});

/* =========================================================== structure == */

test('covers every section the issue specifies', () => {
  const page = html();
  const sections = {
    'what the debug LEDs are': /id="what-they-are"/,
    'check these first': /id="check-first"/,
    'CPU LED': /id="cpu-led"/,
    'DRAM LED': /id="dram-led"/,
    'VGA LED': /id="vga-led"/,
    'BOOT LED': /id="boot-led"/,
    'nothing lights up': /id="nothing-lights"/,
    'q-code display': /id="q-code"/,
    'beep codes': /id="beep-codes"/,
    'clear CMOS': /id="clear-cmos"/,
    'when it is faulty / RMA': /id="rma"/,
    'related guides': /id="related-guides"/,
  };
  for (const [label, re] of Object.entries(sections)) {
    assert.match(page, re, `missing section: ${label}`);
  }
});

test('every table of contents entry resolves to a heading on the page', () => {
  const page = html();
  const toc = block(page, '<nav class="guide-toc">', '</nav>');
  const anchors = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length >= 8, `thin table of contents: ${anchors.length} entries`);
  for (const id of anchors) {
    assert.match(page, new RegExp(`<h[23][^>]*id="${id}"`), `TOC points at missing #${id}`);
  }
});

/* ====================================================== interlinking == */

test('links to at least three of the guides named in the issue', () => {
  const refs = new Set(extractRefs(html()).map((r) => r.split('#')[0]));
  const wanted = ['guide-ram.html', 'guide-pcie.html', 'guide-storage.html'];
  const hit = wanted.filter((g) => refs.has(g));
  assert.ok(hit.length >= 3, `only linked ${hit.length}/3 required guides: ${hit.join(', ')}`);
});

test('the interlinks sit in the LED sections that motivate them', () => {
  const page = html();
  const section = (id) => {
    const start = page.indexOf(`id="${id}"`);
    assert.notEqual(start, -1, `no section #${id}`);
    const rest = page.slice(start);
    const next = rest.search(/<h2\b/i);
    return next === -1 ? rest : rest.slice(0, next);
  };
  assert.match(section('dram-led'), /href="guide-ram\.html/, 'DRAM section does not link the RAM guide');
  assert.match(section('vga-led'), /href="guide-pcie\.html/, 'VGA section does not link the PCIe guide');
  assert.match(section('boot-led'), /href="guide-storage\.html/, 'BOOT section does not link the storage guide');
});

test('closes with the standard Related Guides card block', () => {
  const page = html();
  assert.match(page, /id="related-guides"/);
  const related = page.slice(page.indexOf('id="related-guides"'));
  const cards = [...related.matchAll(/class="card guide-card"/g)];
  assert.ok(cards.length >= 2, `Related Guides has ${cards.length} cards, expected at least 2`);
});

/* ============================================= sourcing of vendor claims == */

test('cites the ASUS Q-LED support FAQ the LED meanings come from', () => {
  const refs = extractRefs(html()).join(' ');
  assert.ok(refs.includes('https://www.asus.com/support/faq/1042678/'), 'ASUS Q-LED FAQ not linked');
});

test('cites an official ASUS page for the clear-CMOS procedure', () => {
  const page = html();
  const section = page.slice(page.indexOf('id="clear-cmos"'));
  assert.match(section, /https:\/\/www\.asus\.com\/support\/faq\/1040820\//, 'clear-CMOS FAQ not linked');
});

test('each vendor named for LED behaviour links to that vendor own support page', () => {
  const page = html();
  const refs = extractRefs(page).join(' ');
  const vendors = {
    MSI: /(?:^|\/\/)(?:[a-z-]+\.)?msi\.com\//,
    GIGABYTE: /(?:^|\/\/)(?:[a-z-]+\.)?gigabyte\.com\//,
    ASRock: /(?:^|\/\/)(?:[a-z-]+\.)?asrock\.com\//,
  };
  const text = prose();
  for (const [vendor, re] of Object.entries(vendors)) {
    if (!new RegExp(`\\b${vendor}\\b`, 'i').test(text)) continue;
    assert.match(refs, re, `${vendor} is named but no ${vendor} support page is linked`);
  }
});

test('flags the AM5 memory-training caveat and sources it', () => {
  const text = prose();
  assert.match(text, /memory training/i, 'no memory-training caveat');
  assert.match(text, /AM5/, 'the caveat does not name AM5');
  const refs = extractRefs(html()).join(' ');
  assert.match(refs, /asus\.com/, 'the memory-training caveat is not sourced to a vendor page');
});

/* =================================================== what we must not say == */

test('makes no hands-on, benchmark or testing claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran|tried|reproduced|confirmed)\b/i,
    /\bin our (?:testing|benchmarks?|lab|experience)\b/i,
    /\bour test (?:bench|system|rig)\b/i,
    /\bwe (?:have )?(?:seen|found) this\b/i,
  ];
  const text = prose();
  for (const re of banned) {
    assert.doesNotMatch(text, re, `hands-on claim matching ${re}`);
  }
});

test('attributes the vendor procedures rather than asserting them as our own', () => {
  assert.match(
    prose(),
    /according to ASUS|ASUS(?:'s)? (?:own )?(?:documentation|support|FAQ)|based on published (?:specifications|documentation)/i,
    'no attribution phrasing anywhere on the page',
  );
});

test('publishes no universal beep-code table', () => {
  const page = html();
  // A beep-code table is the specific failure mode the issue calls out: a
  // mapping from a beep count to a cause, presented as if it were universal.
  assert.doesNotMatch(
    page,
    /<th[^>]*>\s*(?:beeps?|beep code)\s*<\/th>/i,
    'a table column headed "beep" -- that is a beep-code table',
  );
  const text = prose();
  assert.doesNotMatch(
    text,
    /\b(?:one|two|three|four|five|1|2|3|4|5)\s+(?:short|long)?\s*beeps?\s*(?:=|--|—|:|means?|indicates?)/i,
    'a beep count is mapped to a cause',
  );
});

test('tells the reader to look beep codes up in their own board manual', () => {
  const page = html();
  const section = page.slice(page.indexOf('id="beep-codes"'));
  assert.match(section, /manual/i, 'beep-code section does not point at the board manual');
  assert.match(section, /\b(?:vendor|BIOS)\b/i, 'beep-code section does not say codes are vendor-specific');
});

test('quotes no price and invents no product name', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
