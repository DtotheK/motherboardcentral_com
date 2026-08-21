/**
 * Tests for the BIOS update guide (issue #31).
 *
 * This page carries more risk than any other on the site: a wrong filename or
 * a missing "do not interrupt" warning can leave a reader with a dead board.
 * The issue's acceptance criteria are therefore mostly about sourcing -- every
 * per-vendor filename, USB format and button behaviour must be traceable to
 * that vendor's own support page, and where it cannot be, the page must send
 * the reader to their board's support page instead of guessing.
 *
 * These tests encode that rule so a later edit cannot quietly promote an
 * unsourced rename rule into an instruction.
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
const PAGE = 'guide-bios-update.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'guide-storage.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);

/* The prose only -- nav, scripts and markup attributes are not claims. */
const prose = () => stripTags(html());

/** One <h2> section of the page, by id, up to the next <h2>. */
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

test('has a title naming the BIOS update topic', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /BIOS/);
  assert.match(title, /updat/i);
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
  const template = read(TEMPLATE);
  assert.match(template, /<nav class="navbar">/);
  assert.match(template, /<footer class="footer">/);
});

/* =========================================================== structure == */

test('covers every section the issue outline specifies', () => {
  const page = html();
  const sections = {
    'when you need an update': /id="when"/,
    'find your board and BIOS version': /id="find-version"/,
    'method 1: from inside the BIOS': /id="in-bios"/,
    'method 2: flash with no CPU': /id="no-cpu"/,
    'USB stick and file renaming': /id="usb-prep"/,
    'do not interrupt': /id="do-not-interrupt"/,
    'after the update': /id="after"/,
    'dual-BIOS and recovery': /id="recovery"/,
    'boards with no flash button': /id="no-button"/,
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
  assert.ok(anchors.length >= 9, `thin table of contents: ${anchors.length} entries`);
  for (const id of anchors) {
    assert.match(page, new RegExp(`<h[23][^>]*id="${id}"`), `TOC points at missing #${id}`);
  }
});

/* ====================================================== interlinking == */

test('links to at least three of the guides named in the issue', () => {
  const refs = new Set(extractRefs(html()).map((r) => r.split('#')[0]));
  const wanted = ['guide-sockets.html', 'guide-ram.html', 'guide-usb.html'];
  const hit = wanted.filter((g) => refs.has(g));
  assert.ok(hit.length >= 3, `only linked ${hit.length}/3 required guides: ${hit.join(', ')}`);
});

test('the interlinks sit in the sections that motivate them', () => {
  assert.match(section('when'), /href="guide-sockets\.html/, 'the "new CPU on an older board" section does not link the sockets guide');
  assert.match(section('after'), /href="guide-ram\.html/, 'the post-update section does not link the RAM guide');
  assert.match(section('no-cpu'), /href="guide-usb\.html/, 'the no-CPU flash section does not link the USB guide');
});

test('closes with the standard Related Guides card block', () => {
  const page = html();
  const related = page.slice(page.indexOf('id="related-guides"'));
  const cards = [...related.matchAll(/class="card guide-card"/g)];
  assert.ok(cards.length >= 2, `Related Guides has ${cards.length} cards, expected at least 2`);
});

/* ============================================= sourcing of vendor claims == */

test('cites the official ASUS USB BIOS FlashBack FAQ', () => {
  const refs = extractRefs(html()).join(' ');
  assert.ok(refs.includes('https://www.asus.com/support/faq/1038568/'), 'ASUS FlashBack FAQ not linked');
});

test('cites an MSI-hosted document for the MSI flash procedure', () => {
  const refs = extractRefs(section('usb-prep')).concat(extractRefs(section('no-cpu'))).join(' ');
  assert.match(refs, /(?:^|\/\/)(?:[a-z0-9-]+\.)?msi\.com\//, 'no MSI-hosted source linked for the MSI procedure');
});

test('every vendor named for flashing behaviour links to that vendor own support page', () => {
  const refs = extractRefs(html()).join(' ');
  const vendors = {
    ASUS: /(?:^|\/\/)(?:[a-z0-9-]+\.)?asus\.com\//,
    MSI: /(?:^|\/\/)(?:[a-z0-9-]+\.)?msi\.com\//,
    GIGABYTE: /(?:^|\/\/)(?:[a-z0-9-]+\.)?(?:gigabyte|aorus)\.com\//,
    ASRock: /(?:^|\/\/)(?:[a-z0-9-]+\.)?asrock\.com\//,
  };
  const text = prose();
  for (const [vendor, re] of Object.entries(vendors)) {
    if (!new RegExp(`\\b${vendor}\\b`, 'i').test(text)) continue;
    assert.match(refs, re, `${vendor} is named but no ${vendor} support page is linked`);
  }
});

test('any stated rename rule sits in a section that links the vendor that published it', () => {
  // The bricking-risk criterion: a filename is only ever safe to print if the
  // reader can click straight through to the vendor page it came from.
  const rules = {
    'MSI.ROM': /(?:^|\/\/)(?:[a-z0-9-]+\.)?msi\.com\//,
    '.CAP': /(?:^|\/\/)(?:[a-z0-9-]+\.)?asus\.com\//,
    'BIOSRenamer': /(?:^|\/\/)(?:[a-z0-9-]+\.)?asus\.com\//,
  };
  const page = html();
  const bodies = page.split(/<h2\b/i).slice(1);
  for (const [token, vendorRe] of Object.entries(rules)) {
    for (const chunk of bodies) {
      if (!chunk.includes(token)) continue;
      assert.match(
        extractRefs(chunk).join(' '),
        vendorRe,
        `"${token}" is stated in a section with no link to the vendor page it came from`,
      );
    }
  }
});

test('states no rename rule we could not confirm at the vendor source', () => {
  // GIGABYTE blocks automated fetching and newer boards ship a rename utility
  // rather than a fixed filename, so this specific string must never appear as
  // an instruction. Same for ASRock, whose flash docs are image-only PDFs.
  const text = prose();
  assert.doesNotMatch(text, /GIGABYTE\.bin/i, 'prints an unverified GIGABYTE filename');
  assert.doesNotMatch(text, /creative\.rom/i, 'prints an unverified ASRock filename');
});

test('sends the reader to their own board support page for the unconfirmed vendors', () => {
  const text = prose();
  assert.match(
    text,
    /(?:your (?:own )?board(?:'s|’s)?|the board(?:'s|’s)?) (?:own )?(?:support|download|product) page/i,
    'no "check your board\'s support page" fallback anywhere on the page',
  );
  for (const vendor of ['GIGABYTE', 'ASRock']) {
    const idx = text.indexOf(vendor);
    assert.notEqual(idx, -1, `${vendor} is not covered at all`);
    assert.match(
      text.slice(idx, idx + 700),
      /support page|support site|product page|own manual|board(?:'s|’s) page/i,
      `${vendor} is described without pointing at its own support page`,
    );
  }
});

/* ================================================= the safety criteria == */

test('states plainly that the flash must not be interrupted', () => {
  const s = section('do-not-interrupt');
  assert.match(s, /do not (?:remove|unplug|interrupt|turn)/i, 'no explicit do-not-interrupt instruction');
  assert.match(s, /power/i, 'the warning does not mention power');
});

test('describes what the failure LED looks like', () => {
  const page = html();
  assert.match(
    stripTags(page),
    /(?:flash(?:es|ing)?|blink(?:s|ing)?)[^.]{0,80}five seconds[^.]{0,120}solid/i,
    'the ASUS failure-LED behaviour is not described',
  );
});

test('warns that a BIOS update resets settings, including the memory profile', () => {
  const s = section('after');
  assert.match(s, /XMP|EXPO/i, 'the post-update section does not mention XMP/EXPO');
  assert.match(s, /reset|default|wipe|clear/i, 'the post-update section does not say settings are reset');
});

/* =================================================== what we must not say == */

test('makes no hands-on, benchmark or testing claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran|tried|reproduced|confirmed|flashed|bricked)\b/i,
    /\bin our (?:testing|benchmarks?|lab|experience)\b/i,
    /\bour test (?:bench|system|rig)\b/i,
  ];
  const text = prose();
  for (const re of banned) {
    assert.doesNotMatch(text, re, `hands-on claim matching ${re}`);
  }
});

test('attributes the vendor procedures rather than asserting them as our own', () => {
  assert.match(
    prose(),
    /according to (?:ASUS|MSI)|ASUS(?:'s|’s)? (?:own )?(?:documentation|support|FAQ)|MSI(?:'s|’s)? own|based on published (?:specifications|documentation)/i,
    'no attribution phrasing anywhere on the page',
  );
});

test('quotes no price and invents no product name', () => {
  const text = prose();
  assert.doesNotMatch(text, /[$£€]\s?\d/, 'a currency figure appears');
  assert.doesNotMatch(text, /\bMSRP\b/i, 'MSRP is quoted');
});

test('names no specific BIOS or AGESA version as the one to install', () => {
  // Issue #20 flagged that published AGESA strings conflict. This page must
  // not resolve that conflict by guessing.
  assert.doesNotMatch(prose(), /\bAGESA\s*\d/i, 'an AGESA version string is printed');
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
