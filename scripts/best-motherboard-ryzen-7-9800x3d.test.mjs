/**
 * Tests for the "Best Motherboards for Ryzen 7 9800X3D" page (issue #36).
 *
 * The risk on a per-CPU roundup is that the blurbs drift from the boards'
 * own review pages. A reader who is told the Tomahawk has 3x M.2 here and
 * reads "2x M.2" on our review of the same board stops believing either
 * number. So the central test below re-derives every hardware claim in a pick
 * box from the spec table on the review page that pick links to, rather than
 * asserting hand-copied constants.
 *
 * The second risk is the CPU itself. Issue #36's own framing calls the
 * 9800X3D "a 65 W-class TDP part with locked-down X3D behaviour". AMD's
 * published specification is 120 W and the part is unlocked for overclocking
 * (Newegg, Walmart and Tom's Hardware all list 120 W / unlocked; AMD's own
 * product page would not respond to an automated fetch). The page states the
 * published figures, and these tests pin them so the issue's wording cannot
 * leak back in later.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AFFILIATE_TAG,
  checkMeta,
  collectHtmlFiles,
  extractRefs,
  getDescription,
  getTitle,
  parseSpecTable,
  stripTags,
} from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'best-motherboard-for-ryzen-7-9800x3d.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'best-motherboard-for-ryzen-7-7800x3d.html';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = () => read(PAGE);
const prose = () => stripTags(html());

/** Pull a block out of a page by its delimiting tags, whitespace preserved. */
const block = (page, open, close) => {
  const start = page.indexOf(open);
  const end = page.indexOf(close, start);
  assert.ok(start !== -1 && end !== -1, `block ${open} not found`);
  return page.slice(start, end + close.length);
};

/** The article body only -- nav, hero and footer are not claims about boards. */
const body = () => {
  const page = html();
  const start = page.indexOf('<div class="guide-content">');
  const end = page.indexOf('<!-- END .guide-content -->');
  assert.ok(start !== -1 && end !== -1, 'guide-content block not found');
  return page.slice(start, end);
};

/** Everything from an <h2 id="..."> up to the next <h2>. */
const section = (id) => {
  const page = html();
  const start = page.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `no section #${id}`);
  const rest = page.slice(start);
  const next = rest.slice(1).search(/<h2\b/i);
  return next === -1 ? rest : rest.slice(0, next + 1);
};

/**
 * One recommendation. `picks()` returns the info-box for each board in the
 * Top Picks section together with the review page it links to and that review
 * page's spec table, which is the source of truth for every number in it.
 */
const picks = () => {
  const src = section('top-picks');
  const boxes = [...src.matchAll(
    /<div class="info-box" style="border-left:3px solid var\(--primary\);[\s\S]*?<\/div>\s*<\/div>/gi,
  )].map((m) => m[0]);

  return boxes.map((boxHtml) => {
    const name = (boxHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1];
    const badge = (boxHtml.match(/<span class="card-badge"[^>]*>([\s\S]*?)<\/span>/i) || [])[1];
    const reviewRef = (boxHtml.match(/href="(review-[^"#?]+\.html)"/i) || [])[1];
    assert.ok(name, 'a pick box has no <h3> board name');
    assert.ok(reviewRef, `pick "${stripTags(name)}" does not link to a review page`);
    return {
      name: stripTags(name),
      badge: badge ? stripTags(badge) : '',
      reviewRef,
      html: boxHtml,
      text: stripTags(boxHtml),
      specs: parseSpecTable(read(reviewRef)),
    };
  });
};

/* ============================================================ existence == */

test('the page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming the CPU', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /9800X3D/i);
});

test('has a non-empty meta description', () => {
  const desc = getDescription(html());
  assert.ok(desc && desc.length > 50, `weak meta description: ${desc}`);
  assert.match(desc, /9800X3D/i);
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

test('carries the og: tags the sibling per-CPU pages carry', () => {
  const page = html();
  for (const prop of ['og:title', 'og:description', 'og:type', 'og:url']) {
    assert.match(page, new RegExp(`<meta[^>]*property=["']${prop}["']`, 'i'), `missing ${prop}`);
  }
  assert.match(page, new RegExp(`property=["']og:url["'][^>]*content=["']${CANONICAL}["']`, 'i'));
});

/* ================================== shared markup copied, never rewritten == */

test('nav markup is copied unchanged from the sibling per-CPU page', () => {
  assert.equal(
    block(html(), '<nav class="navbar">', '</nav>'),
    block(read(TEMPLATE), '<nav class="navbar">', '</nav>'),
  );
});

test('footer markup is copied unchanged from the sibling per-CPU page', () => {
  assert.equal(
    block(html(), '<footer class="footer">', '</footer>'),
    block(read(TEMPLATE), '<footer class="footer">', '</footer>'),
  );
});

/* =========================================================== structure == */

test('has the sections the sibling per-CPU pages have', () => {
  const page = html();
  for (const id of ['overview', 'top-picks', 'what-to-look-for', 'chipset-guide', 'video', 'related-guides']) {
    assert.match(page, new RegExp(`<h2[^>]*id="${id}"`), `missing section #${id}`);
  }
});

test('every table of contents entry resolves to a heading on the page', () => {
  const page = html();
  const toc = block(page, '<nav class="guide-toc">', '</nav>');
  const anchors = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length >= 5, `thin table of contents: ${anchors.length} entries`);
  for (const id of anchors) {
    assert.match(page, new RegExp(`<h[23][^>]*id="${id}"`), `TOC points at missing #${id}`);
  }
});

/* ============================================== the picks the issue asks for == */

test('recommends at least four boards', () => {
  assert.ok(picks().length >= 4, `only ${picks().length} picks`);
});

test('covers budget/mainstream, mid-range, high-end and Mini-ITX', () => {
  const badges = picks().map((p) => p.badge.toLowerCase()).join(' | ');
  for (const wanted of ['budget', 'overall', 'high-end', 'mini-itx']) {
    assert.ok(badges.includes(wanted), `no pick badged for "${wanted}" (badges: ${badges})`);
  }
});

test('every recommended board has a review page on this site', () => {
  for (const p of picks()) {
    assert.ok(fs.existsSync(path.join(ROOT, p.reviewRef)), `${p.name}: ${p.reviewRef} does not exist`);
  }
});

test('every recommended board is an AM5 board', () => {
  for (const p of picks()) {
    assert.equal(p.specs.get('Socket'), 'AM5', `${p.name} is not an AM5 board`);
  }
});

test('the Mini-ITX pick really is Mini-ITX, per its own review page', () => {
  const itx = picks().filter((p) => /mini-itx/i.test(p.badge));
  assert.ok(itx.length >= 1, 'no Mini-ITX pick');
  for (const p of itx) {
    assert.equal(p.specs.get('Form Factor'), 'Mini-ITX', `${p.name} is not Mini-ITX`);
  }
});

/* =================================== no claim may contradict our own review == */

/**
 * Every hardware number in a pick box is re-derived from the spec table of the
 * review page that box links to. CLAUDE.md rule 1: a spec must never
 * contradict itself between pages describing the same board.
 */
test('no spec in a pick box contradicts that board\'s review page', () => {
  for (const p of picks()) {
    const spec = (k) => p.specs.get(k) || '';

    const phases = p.text.match(/(\d+\+\d+(?:\+\d+)?)\s*phases/i);
    if (phases) {
      assert.equal(phases[1], spec('Power Phases'),
        `${p.name}: blurb says ${phases[1]} phases, review says ${spec('Power Phases')}`);
    }

    const wifi = p.text.match(/WiFi\s*(7|6E|6)\b/i);
    if (wifi) {
      assert.equal(`WiFi ${wifi[1].toUpperCase()}`, spec('WiFi').replace(/e$/i, 'E'),
        `${p.name}: blurb says WiFi ${wifi[1]}, review says ${spec('WiFi')}`);
    }

    const lan = p.text.match(/(\d+(?:\.\d+)?)G\s*LAN/i);
    if (lan) {
      assert.ok(spec('LAN').split('+').includes(`${lan[1]}G`),
        `${p.name}: blurb says ${lan[1]}G LAN, review says ${spec('LAN')}`);
    }

    const m2 = p.text.match(/(\d+)x\s*M\.2/i);
    if (m2) {
      const specM2 = (spec('M.2 Slots').match(/(\d+)x/) || [])[1];
      assert.equal(m2[1], specM2,
        `${p.name}: blurb says ${m2[1]}x M.2, review says ${spec('M.2 Slots')}`);
    }

    const specGens = new Set([...spec('PCIe Slots').matchAll(/PCIe\s*(\d\.\d)/gi)].map((m) => m[1]));
    for (const m of p.text.matchAll(/PCIe\s*(\d\.\d)\s*x16/gi)) {
      assert.ok(specGens.has(m[1]),
        `${p.name}: blurb claims a PCIe ${m[1]} x16 slot, review says ${spec('PCIe Slots')}`);
    }

    const chipsets = [...p.text.matchAll(/\b([ABX]\d{3}E?)\b/g)].map((m) => m[1]);
    for (const c of chipsets) {
      assert.equal(c, spec('Chipset'), `${p.name}: blurb names ${c}, review says ${spec('Chipset')}`);
    }

    for (const ff of ['Mini-ITX', 'Micro-ATX']) {
      if (new RegExp(ff, 'i').test(p.text)) {
        assert.equal(spec('Form Factor'), ff,
          `${p.name}: blurb says ${ff}, review says ${spec('Form Factor')}`);
      }
    }
  }
});

/* ==================================================== affiliate discipline == */

test('every Amazon link is a direct product link carrying our tag', () => {
  const amazon = extractRefs(html()).filter((r) => /amazon\./i.test(r));
  assert.ok(amazon.length >= 4, `only ${amazon.length} Amazon links on the page`);
  for (const ref of amazon) {
    assert.match(ref, /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]+\?/, `not a direct product link: ${ref}`);
    assert.ok(ref.includes(`tag=${AFFILIATE_TAG}`), `missing affiliate tag: ${ref}`);
    assert.doesNotMatch(ref, /\/s\?k=/, `search URL: ${ref}`);
  }
});

test('each pick reuses the exact affiliate URL already on that board\'s review page', () => {
  for (const p of picks()) {
    const onPick = [...p.html.matchAll(/href="(https:\/\/www\.amazon\.com\/[^"]+)"/gi)].map((m) => m[1]);
    assert.ok(onPick.length >= 1, `${p.name}: no Amazon link in the pick box`);
    const onReview = new Set(extractRefs(read(p.reviewRef)).filter((r) => /amazon\./i.test(r)));
    for (const ref of onPick) {
      assert.ok(onReview.has(ref),
        `${p.name}: ${ref} does not appear on ${p.reviewRef}; it must be copied verbatim`);
    }
  }
});

/* ================================================ the CPU's own published spec == */

test('states the published 120 W TDP and never the 65 W figure from the issue', () => {
  const text = prose();
  assert.match(text, /120\s*W\b/, 'the published 120 W TDP is not stated');
  assert.doesNotMatch(text, /65\s*W\b/, 'the page repeats the issue\'s incorrect 65 W figure');
});

test('does not describe the 9800X3D as locked', () => {
  const text = prose();
  assert.match(text, /unlocked/i, 'the page never says the CPU is unlocked for overclocking');
  assert.doesNotMatch(text, /\b(?:is|are|remains?) locked\b/i, 'the page calls the CPU locked');
  assert.doesNotMatch(text, /cannot be overclocked|no overclocking/i, 'the page denies overclocking support');
});

test('states the socket and cache correctly', () => {
  const text = prose();
  assert.match(text, /\bAM5\b/, 'the socket is never named');
  assert.match(text, /96\s*MB/i, 'the 96MB L3 figure is missing');
  assert.match(text, /8\s*cores?/i, 'the core count is missing');
});

test('makes no claim about a socket other than AM5 in the article body', () => {
  const text = stripTags(body());
  assert.doesNotMatch(text, /\bAM4\b/, 'AM4 is claimed somewhere in the article body');
  assert.doesNotMatch(text, /\bLGA\s*\d/, 'an Intel socket is claimed in the article body');
});

/* =================================================== what we must not say == */

test('makes no hands-on, benchmark or testing claim', () => {
  const banned = [
    /\bwe (?:tested|benchmarked|measured|ran|tried|reproduced|timed)\b/i,
    /\bin our (?:testing|benchmarks?|lab|experience)\b/i,
    /\bour test (?:bench|system|rig)\b/i,
    /\b\d+(?:\.\d+)?\s*(?:fps|FPS)\b/,
  ];
  const text = prose();
  for (const re of banned) {
    assert.doesNotMatch(text, re, `hands-on or benchmark claim matching ${re}`);
  }
});

test('says the recommendations rest on published specifications', () => {
  assert.match(prose(), /based on published specifications/i,
    'the page never states that the picks come from published specifications');
});

test('quotes no price', () => {
  // Issue #36 acceptance criteria: no fabricated prices anywhere on the page.
  assert.doesNotMatch(prose(), /[$£€]\s?\d/, 'a currency figure appears');
});

test('names no release date for the CPU or any board', () => {
  assert.doesNotMatch(prose(), /\b(?:launched|released|announced|available)\s+(?:in|on)\s+\w+\s+20\d\d/i,
    'a release date claim appears');
});

test('prints no AGESA version string', () => {
  // Same rule as issues #20, #32 and #33: published AGESA numbers conflict and
  // none is verified per board.
  assert.doesNotMatch(prose(), /\bAGESA\s*[\d.]|\bComboAM[45]/i, 'an AGESA version is named');
});

/* ====================================================== interlinking == */

test('points the reader at the BIOS-support prerequisite', () => {
  const refs = new Set(extractRefs(body()).map((r) => r.split('#')[0]));
  assert.ok(refs.has('guide-bios-update.html'),
    'the page tells readers a Ryzen 9000 BIOS matters but never links the BIOS update guide');
});

test('links the sibling per-CPU pages', () => {
  const refs = new Set(extractRefs(body()).map((r) => r.split('#')[0]));
  const siblings = ['best-motherboard-for-ryzen-7-7800x3d.html', 'best-motherboard-for-ryzen-7-9700x.html'];
  const hit = siblings.filter((s) => refs.has(s));
  assert.ok(hit.length >= 2, `only linked ${hit.length} sibling per-CPU pages: ${hit.join(', ')}`);
});

test('every internal link on the page resolves to a file that exists', () => {
  for (const ref of extractRefs(html())) {
    if (!ref || ref.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(ref)) continue;
    if (ref.startsWith('/_vercel')) continue;
    const target = ref.split('#')[0].split('?')[0].replace(/^\//, '');
    if (!target) continue;
    assert.ok(fs.existsSync(path.join(ROOT, target)), `broken internal link: ${ref}`);
  }
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
