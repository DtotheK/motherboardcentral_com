/**
 * Tests for the AM5 slow-boot / memory-training guide (issue #32).
 *
 * The risk on this page is not that we get a spec wrong -- it is that we write
 * a performance article without having measured anything. Every number here
 * comes from someone else's machine, so the acceptance criteria are mostly
 * about attribution: no bare "usually takes X seconds", no hands-on claims,
 * and Memory Context Restore presented as a trade-off with a recovery path
 * rather than as a free win. These tests encode that so a later edit cannot
 * quietly turn a reported figure into one of ours.
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
const PAGE = 'guide-am5-slow-boot.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'guide-storage.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);

/* The prose only -- nav, scripts and markup attributes are not claims. */
const prose = () => stripTags(html());

/** Pull a block out of a page by its delimiting tags, whitespace preserved. */
const block = (page, open, close) => {
  const start = page.indexOf(open);
  const end = page.indexOf(close, start);
  assert.ok(start !== -1 && end !== -1, `block ${open} not found`);
  return page.slice(start, end + close.length);
};

/** Everything from an <h2 id="..."> up to the next <h2>. */
const section = (id) => {
  const page = html();
  const start = page.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `no section #${id}`);
  const rest = page.slice(start);
  const next = rest.search(/<h2\b/i);
  return next === -1 ? rest : rest.slice(0, next);
};

/* ============================================================ existence == */

test('the guide page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming the AM5 slow-boot topic', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /AM5/);
  assert.match(title, /boot/i);
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
  // The issue forbids editing shared nav/footer/layout markup. If someone
  // "fixes" the nav, they must not do it as part of this page.
  const template = read(TEMPLATE);
  assert.match(template, /<nav class="navbar">/);
  assert.match(template, /<footer class="footer">/);
});

/* =========================================================== structure == */

test('covers every section the issue outline specifies', () => {
  const page = html();
  const sections = {
    'the symptom': /id="symptom"/,
    'what memory training is': /id="what-is-training"/,
    'why it happens every boot with EXPO': /id="why-every-boot"/,
    'Memory Context Restore': /id="memory-context-restore"/,
    'Power Down Enable': /id="power-down-enable"/,
    'the stability trade-off': /id="trade-off"/,
    'training versus a real fault': /id="training-vs-fault"/,
    'POST code displays': /id="post-codes"/,
    'what does not fix it': /id="what-does-not-fix-it"/,
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

/* ========================================================== attribution == */

/**
 * Every sentence of every <p>, <li> and <td> in the article body.
 *
 * Sentence granularity, not paragraph: a figure must carry its own
 * attribution. Otherwise one sourced sentence launders every unsourced
 * number sitting next to it in the same paragraph.
 */
const claims = () => {
  const page = html();
  const start = page.search(/<h2\b/i);
  const body = page.slice(start === -1 ? 0 : start);
  return [...body.matchAll(/<(p|li|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .flatMap((m) => stripTags(m[2]).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
};

const ATTRIBUTED = /XDA|reported|reports|according to|documents|describes|published|users? (?:have )?(?:complained|described)|forum/i;

test('every timing figure sits in an attributed sentence', () => {
  // The issue: "no unattributed 'usually takes X seconds'".
  const timing = /\b\d+\s*(?:[-–—]\s*\d+\s*)?(?:second|minute|sec\b|min\b)/i;
  const offenders = claims().filter((c) => timing.test(c) && !ATTRIBUTED.test(c));
  assert.deepEqual(offenders, [], `unattributed timing claim(s):\n- ${offenders.join('\n- ')}`);
});

test('spelled-out timing figures are attributed too', () => {
  // The digit test below is easy to slip past by writing "ten minutes"
  // instead of "10 minutes". A reader acts on the number either way.
  const timing =
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|fifty|sixty)\s+(?:to\s+\w+\s+)?(?:seconds?|minutes?)\b/i;
  const offenders = claims().filter((c) => timing.test(c) && !ATTRIBUTED.test(c));
  assert.deepEqual(offenders, [], `unattributed timing claim(s):\n- ${offenders.join('\n- ')}`);
});

test('attributes nothing to the ROG forum post we could not read', () => {
  // The issue records that this URL returns HTTP 403 to automated fetching.
  // We never read it, so we cannot say what it documents -- neither the
  // Q-Code 15 detail nor anything else. Cite only what we verified.
  const page = html();
  assert.doesNotMatch(page, /rog-forum\.asus\.com/i, 'the unreadable ROG forum post is cited');
  assert.doesNotMatch(
    prose(),
    /ASUS[^.]{0,40}\b(?:documentation|community|forum|post)\b/i,
    'a claim is attributed to ASUS documentation we never read',
  );
});

test('names the XDA reports and their publication dates', () => {
  const text = prose();
  assert.match(text, /XDA/, 'XDA is never named as the source');
  assert.match(text, /January 2026/, 'the 25 January 2026 report is not dated');
  assert.match(text, /February 2026/, 'the February 2026 report is not dated');
});

test('links the XDA articles the figures come from', () => {
  const refs = extractRefs(html()).join(' ');
  assert.ok(
    refs.includes('https://www.xda-developers.com/this-am5-bios-change-halves-your-boot-time/'),
    'the January 2026 XDA article is not linked',
  );
  assert.ok(
    refs.includes(
      'https://www.xda-developers.com/these-two-motherboard-settings-could-halve-your-amd-pcs-boot-time/',
    ),
    'the February 2026 XDA article is not linked',
  );
});

/* =================================================== what we must not say == */

test('makes no hands-on, benchmark or testing claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran|tried|reproduced|timed|confirmed)\b/i,
    /\bin our (?:testing|benchmarks?|lab|experience)\b/i,
    /\bour test (?:bench|system|rig)\b/i,
    /\bwe (?:have )?(?:seen|found) this\b/i,
  ];
  const text = prose();
  for (const re of banned) {
    assert.doesNotMatch(text, re, `hands-on claim matching ${re}`);
  }
});

test('quotes no price and invents no product name', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

test('prints no AGESA version string', () => {
  // Same rule as issue #20: published AGESA numbers conflict and none is
  // verified per board, so no version string belongs on a page.
  assert.doesNotMatch(prose(), /\bAGESA\b|\bComboAM[45]/i, 'an AGESA version is named');
});

/* ==================================== Memory Context Restore is a trade-off == */

test('the MCR section states the instability risk before recommending it', () => {
  const mcr = section('memory-context-restore');
  assert.match(mcr, /instability|unstable|boot problems|fail(?:ed|s|ure)? to POST/i,
    'the MCR section never mentions the instability risk');
});

test('the MCR section gives the clear-CMOS recovery path', () => {
  assert.match(section('memory-context-restore'), /clear(?:ing)?\s+CMOS/i,
    'the MCR section does not tell the reader how to back out');
});

test('the trade-off section covers what can go wrong and how to back out', () => {
  const tradeoff = section('trade-off');
  assert.match(tradeoff, /clear(?:ing)?\s+CMOS/i, 'no clear-CMOS recovery path');
  assert.match(tradeoff, /instability|unstable|BSOD|boot problems|fail/i, 'no stated risk');
});

test('never presents MCR as risk-free', () => {
  const text = prose();
  assert.doesNotMatch(text, /\b(?:free win|no downside|risk-?free|nothing to lose)\b/i);
});

/* ====================================================== interlinking == */

test('links to at least three of the pages named in the issue', () => {
  const refs = new Set(extractRefs(html()).map((r) => r.split('#')[0]));
  const wanted = [
    'guide-ram.html',
    'guide-sockets.html',
    'review-msi-mag-b650-tomahawk-wifi.html',
    'review-asus-rog-strix-b650e-e-gaming-wifi.html',
  ];
  const hit = wanted.filter((p) => refs.has(p));
  assert.ok(hit.length >= 3, `only linked ${hit.length} of the named pages: ${hit.join(', ')}`);
});

test('cross-links the no-POST debug-LED guide for readers who arrive from "DRAM light on"', () => {
  const refs = new Set(extractRefs(html()).map((r) => r.split('#')[0]));
  assert.ok(refs.has('guide-no-post.html'), 'guide-no-post.html is not linked');
});

test('the no-POST cross-link sits in a section about telling training from a fault', () => {
  const relevant = section('symptom') + section('training-vs-fault');
  assert.match(relevant, /href="guide-no-post\.html/,
    'the no-POST guide is linked, but not where a reader with a DRAM light would look');
});

test('closes with the standard Related Guides card block', () => {
  const page = html();
  assert.match(page, /id="related-guides"/);
  const related = page.slice(page.indexOf('id="related-guides"'));
  const cards = [...related.matchAll(/class="card guide-card"/g)];
  assert.ok(cards.length >= 2, `Related Guides has ${cards.length} cards, expected at least 2`);
});

/* ============================================ agreement with our own pages == */

test('does not contradict the no-POST guide on what a long AM5 first boot means', () => {
  // Both pages tell a reader with a lit DRAM light to wait rather than RMA.
  // CLAUDE.md rule 1: the two must not disagree.
  const text = prose();
  assert.match(text, /memory training/i, 'the page never names memory training');
  assert.doesNotMatch(
    text,
    /\b(?:faulty|dead|failed) (?:RAM|memory)\b(?![^.]*\bnot\b)/i,
    'the page appears to call a long training boot a memory fault',
  );
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
