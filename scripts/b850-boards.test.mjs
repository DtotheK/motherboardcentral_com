/**
 * Tests for the four AMD B850 board review pages (issue #35).
 *
 * The issue's acceptance criteria are all "never contradicts" promises, so
 * they are encoded here as machine-checkable guards rather than trusted to
 * review. Two things drive most of this file:
 *
 *  1. CLAUDE.md rule 1 -- every spec below was read off the board's OWN
 *     manufacturer spec page (ASUS techspec / ROG spec), so the expected
 *     values are the source of truth. If a page drifts, a test fails.
 *  2. The issue's second criterion -- chipset-level behaviour (PCIe 5.0
 *     graphics, USB4, M.2 generation, Wi-Fi, LAN) differs BETWEEN these four
 *     B850 boards, so no page may state them as blanket B850 claims. The
 *     "no blanket chipset claim" and per-board trap tests below exist for
 *     exactly that.
 *
 * Per the approved plan (D7/D8/D9) these pages deliberately ship with no star
 * rating, no Review/aggregateRating JSON-LD, no video embed and no image: we
 * have not handled these boards, so a numeric verdict would be a claim we did
 * not earn (rule 2). Those omissions are asserted, not incidental.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractRefs, getTitle, getDescription, stripTags, parseSpecTable } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/**
 * Every value here traces to that board's own manufacturer spec page.
 * Sources (re-fetched and confirmed 2026-08-21):
 *   1 https://www.asus.com/us/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850-plus-wifi/techspec/
 *   2 https://rog.asus.com/us/motherboards/rog-strix/rog-strix-b850-e-gaming-wifi/spec/
 *   3 https://www.asus.com/us/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850m-plus-wifi/techspec/
 *   4 https://rog.asus.com/us/motherboards/rog-strix/rog-strix-b850-i-gaming-wifi/spec/
 * Power stages come from ASUS's own press release, which the plan accepts as a
 * first-party fallback because all four techspec pages omit them:
 *   https://press.asus.com/news/press-releases/asus-amd-x870e-b850-b840-rog-strix-tuf-prime-motherboards/
 */
const BOARDS = [
  {
    slug: 'review-asus-tuf-gaming-b850-plus-wifi.html',
    name: 'ASUS TUF Gaming B850-Plus WiFi',
    form: 'ATX',
    specs: {
      Socket: 'AM5',
      Chipset: 'B850',
      'Form Factor': 'ATX',
      Memory: 'DDR5, 4 DIMM slots, up to 256GB',
      'M.2 Slots': '3x M.2',
      'SATA Ports': '4',
      'Rear USB': '10x USB',
      WiFi: 'WiFi 7',
      Bluetooth: 'BT 5.4',
      LAN: '2.5G',
      Audio: 'ALC1220P',
      'Power Phases': '14+2+1',
    },
    // USB4 on this board is an internal header, NOT a rear port.
    rearUsb4: false,
  },
  {
    slug: 'review-asus-rog-strix-b850-e-gaming-wifi.html',
    name: 'ASUS ROG Strix B850-E Gaming WiFi',
    form: 'ATX',
    specs: {
      Socket: 'AM5',
      Chipset: 'B850',
      'Form Factor': 'ATX',
      Memory: 'DDR5, 4 DIMM slots, up to 256GB',
      'M.2 Slots': '5x M.2',
      'SATA Ports': '4',
      'Rear USB': '12x USB',
      WiFi: 'WiFi 7',
      Bluetooth: 'BT 5.4',
      LAN: '5G',
      Audio: 'ALC4080',
      'Power Phases': '16+2+2',
    },
    rearUsb4: true,
  },
  {
    slug: 'review-asus-tuf-gaming-b850m-plus-wifi.html',
    name: 'ASUS TUF Gaming B850M-Plus WiFi',
    form: 'Micro-ATX',
    specs: {
      Socket: 'AM5',
      Chipset: 'B850',
      'Form Factor': 'Micro-ATX',
      Memory: 'DDR5, 4 DIMM slots, up to 256GB',
      'M.2 Slots': '3x M.2',
      'SATA Ports': '4',
      'Rear USB': '12x USB',
      WiFi: 'WiFi 6E',
      Bluetooth: 'BT 5.3',
      LAN: '2.5G',
      Audio: 'ALC1220P',
      'Power Phases': '14+2+1',
    },
    rearUsb4: false,
  },
  {
    slug: 'review-asus-rog-strix-b850-i-gaming-wifi.html',
    name: 'ASUS ROG Strix B850-I Gaming WiFi',
    form: 'Mini-ITX',
    specs: {
      Socket: 'AM5',
      Chipset: 'B850',
      'Form Factor': 'Mini-ITX',
      Memory: 'DDR5, 2 DIMM slots, up to 128GB',
      'M.2 Slots': '2x M.2',
      'SATA Ports': '2',
      'Rear USB': '8x USB',
      WiFi: 'WiFi 7',
      Bluetooth: 'BT 5.4',
      LAN: '2.5G',
      Audio: 'ALC4080',
      'Power Phases': '10+2+1',
    },
    rearUsb4: false,
  },
];

const html = (b) => read(b.slug);

/** Prose only, and only the part that makes claims about THIS board:
 *  everything from the spec table down to the Related Boards grid. */
const claimProse = (b) => {
  const afterTable = html(b).split(/<\/table>/i).slice(1).join(' ');
  return stripTags(afterTable.split(/<h[1-6][^>]*id=["']related["']/i)[0]);
};

/* ============================================================ existence == */

for (const b of BOARDS) {
  test(`${b.name}: page exists`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, b.slug)), `${b.slug} not found`);
  });
}

/* ================================================================= SEO == */

test('all four pages have unique titles and descriptions', () => {
  const titles = BOARDS.map((b) => getTitle(html(b)));
  const descs = BOARDS.map((b) => getDescription(html(b)));
  for (const [i, t] of titles.entries()) {
    assert.ok(t, `${BOARDS[i].slug}: no <title>`);
    assert.match(t, /B850/, `${BOARDS[i].slug}: title does not name the chipset`);
  }
  for (const [i, d] of descs.entries()) {
    assert.ok(d && d.length > 50, `${BOARDS[i].slug}: weak meta description: ${d}`);
  }
  assert.equal(new Set(titles).size, 4, 'titles are not unique');
  assert.equal(new Set(descs).size, 4, 'descriptions are not unique');
});

for (const b of BOARDS) {
  test(`${b.name}: canonical URL points at its own slug`, () => {
    const tag = html(b).match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    assert.ok(tag, 'no rel=canonical');
    assert.ok(
      tag[0].includes(`https://motherboardcentral.com/${b.slug}`),
      `canonical is not https://motherboardcentral.com/${b.slug}`,
    );
  });
}

/* ====================================== spec table matches the vendor page == */

for (const b of BOARDS) {
  test(`${b.name}: every spec-table row matches the manufacturer spec page`, () => {
    const specs = parseSpecTable(html(b));
    for (const [field, expected] of Object.entries(b.specs)) {
      assert.equal(specs.get(field), expected, `${b.slug}: ${field} row`);
    }
  });
}

/* ================================== per-board traps the validator can't see == */

test('B850-E Gaming WiFi says 5 Gigabit LAN and never 2.5', () => {
  const p = claimProse(BOARDS[1]);
  assert.match(p, /5\s*(?:Gigabit|GbE|G)\s*(?:Ethernet|LAN)?/i, 'does not state 5Gb Ethernet');
  assert.doesNotMatch(p, /2\.5\s*(?:Gigabit|GbE|G\b)/i, 'claims 2.5G LAN — this board is 5Gb');
});

test('B850M-Plus WiFi says Wi-Fi 6E and never Wi-Fi 7', () => {
  const p = claimProse(BOARDS[2]);
  assert.match(p, /Wi-?Fi\s*6E/i, 'does not state Wi-Fi 6E');
  assert.doesNotMatch(p, /Wi-?Fi\s*7\b/i, 'claims Wi-Fi 7 — this board is Wi-Fi 6E');
});

test('only the B850-E claims a rear USB4 port', () => {
  for (const b of BOARDS) {
    const p = claimProse(b);
    if (b.rearUsb4) {
      assert.match(p, /USB4/i, `${b.slug}: has rear USB4 but never mentions it`);
    } else {
      // A board with no rear USB4 may still mention USB4 to say it lacks one
      // (or, on board 1, that it is an internal header) -- what it may not do
      // is describe a rear USB4 port.
      assert.doesNotMatch(
        p,
        /rear[^.]{0,40}USB4|USB4[^.]{0,40}rear panel/i,
        `${b.slug}: describes a rear USB4 port it does not have`,
      );
    }
  }
});

test('the PCIe 5.0 x16 slot is stated with its CPU condition, not flattened', () => {
  for (const b of BOARDS) {
    const p = claimProse(b);
    assert.match(p, /PCIe 5\.0/i, `${b.slug}: never mentions the PCIe 5.0 graphics slot`);
    assert.match(
      p,
      /Ryzen 8000/i,
      `${b.slug}: states PCIe 5.0 x16 without the Ryzen 8000 fallback condition`,
    );
  }
});

/* ============================ no blanket chipset claims (issue criterion 2) == */

test('no page makes a blanket B850 chipset claim', () => {
  const blanket = [
    /\ball B850\b/i,
    /\bevery B850\b/i,
    /B850 (?:boards|motherboards)\s+(?:all\s+)?(?:have|offer|include|come|support|ship)/i,
    /the B850 chipset (?:always|guarantees)/i,
  ];
  for (const b of BOARDS) {
    const p = claimProse(b);
    for (const re of blanket) {
      assert.doesNotMatch(p, re, `${b.slug}: blanket B850 claim matching ${re}`);
    }
  }
});

/* ============================================= rule 2: no invented testing == */

test('every page says specs are published, not tested', () => {
  for (const b of BOARDS) {
    assert.match(
      stripTags(html(b)),
      /based on published specifications/i,
      `${b.slug}: missing the "based on published specifications" disclosure`,
    );
  }
});

test('no page claims hands-on testing or benchmarks', () => {
  const banned = [
    /\bwe tested\b/i,
    /\bour test(?:ing|s|ed)\b/i,
    /\bin our tests?\b/i,
    /\bhands-on\b/i,
    /\bwe measured\b/i,
    /\bbenchmark(?:ed|s|ing)?\b/i,
    /\bon our test bench\b/i,
    /\bwe ran\b/i,
  ];
  for (const b of BOARDS) {
    const p = stripTags(html(b));
    for (const re of banned) {
      assert.doesNotMatch(p, re, `${b.slug}: hands-on/benchmark language matching ${re}`);
    }
  }
});

/* ====================== D7/D8/D9: omissions we chose deliberately == */

test('no page ships an unearned star rating or Review schema', () => {
  for (const b of BOARDS) {
    const h = html(b);
    assert.doesNotMatch(h, /aggregateRating/i, `${b.slug}: has aggregateRating JSON-LD`);
    assert.doesNotMatch(h, /"@type":\s*"Review"/i, `${b.slug}: has Review JSON-LD`);
    assert.doesNotMatch(h, /&#9733;|★/, `${b.slug}: has a star-rating block`);
    assert.doesNotMatch(h, /\d\.\d\s*\/\s*5/, `${b.slug}: has a numeric score`);
  }
});

test('no page embeds a video review we have not verified', () => {
  for (const b of BOARDS) {
    const h = html(b);
    assert.doesNotMatch(h, /youtube\.com\/embed/i, `${b.slug}: embeds a YouTube video`);
    assert.doesNotMatch(h, /id=["']video-review["']/i, `${b.slug}: has a Video Review section`);
  }
});

test('no page points at a board image we do not have', () => {
  for (const b of BOARDS) {
    assert.doesNotMatch(html(b), /<img\b/i, `${b.slug}: has an <img> tag`);
  }
});

/* ================================ D11: cons must be real, and must exist == */

test('every page ships at least two spec-derived cons', () => {
  for (const b of BOARDS) {
    const box = html(b).match(/<h3[^>]*>Cons<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i);
    assert.ok(box, `${b.slug}: no Cons list found`);
    const items = [...box[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]).trim());
    assert.ok(items.length >= 2, `${b.slug}: only ${items.length} cons (need >= 2)`);
    for (const item of items) {
      assert.ok(item.length > 10, `${b.slug}: padding con "${item}"`);
    }
  }
});

test('the Pros/Cons grid markup stays identical to the shared template', () => {
  // Issue #41 fixes mobile stacking across every review page at once; a
  // one-off responsive variant here would be skipped by that fix.
  for (const b of BOARDS) {
    assert.match(
      html(b),
      /display:grid;grid-template-columns:1fr 1fr;gap:1\.5rem;margin-bottom:2rem;/,
      `${b.slug}: Pros/Cons grid markup diverges from the template`,
    );
  }
});

/* ========================================== rule 3: affiliate link hygiene == */

test('no page carries an Amazon search URL', () => {
  for (const b of BOARDS) {
    for (const ref of extractRefs(html(b))) {
      if (!/amazon\./i.test(ref)) continue;
      assert.doesNotMatch(ref, /\/s\?k=|[?&]k=/, `${b.slug}: search-result affiliate URL ${ref}`);
      assert.match(ref, /\/dp\/[A-Z0-9]{10}/, `${b.slug}: not a direct product link: ${ref}`);
      assert.match(ref, /tag=motherboardcentral\.com-20/, `${b.slug}: missing our tag: ${ref}`);
    }
  }
});

/* ============================== validator-visible structure the plan requires == */

test('every page keeps the id="related" anchor the validator relies on', () => {
  for (const b of BOARDS) {
    assert.match(html(b), /id=["']related["']/, `${b.slug}: no id="related" heading`);
  }
});

/* ============================================ reviews.html and sitemap.xml == */

test('reviews.html gains a B850 chipset filter option', () => {
  assert.match(read('reviews.html'), /<option value="B850">B850<\/option>/);
});

/** The opening tag of the card that actually contains `slug`.
 *  Anchored on the NEAREST PRECEDING card opening, not on a windowed regex:
 *  the four new cards sit next to each other, so a "within N characters"
 *  match would happily return a neighbouring card's tag and let a wrong
 *  data-form slip through -- exactly the bug this test exists to catch. */
const cardTagFor = (rv, slug) => {
  const at = rv.indexOf(slug);
  if (at < 0) return null;
  const open = rv.lastIndexOf('<div class="card review-card', at);
  if (open < 0) return null;
  return rv.slice(open, rv.indexOf('>', open) + 1);
};

test('reviews.html has one card per new board with filterable data attributes', () => {
  const rv = read('reviews.html');
  for (const b of BOARDS) {
    const tag = cardTagFor(rv, b.slug);
    assert.ok(tag, `no reviews.html card links to ${b.slug}`);
    assert.match(tag, /data-brand="ASUS"/, `${b.slug}: card missing data-brand`);
    assert.match(tag, /data-socket="AM5"/, `${b.slug}: card missing data-socket`);
    assert.match(tag, /data-chipset="B850"/, `${b.slug}: card missing data-chipset`);
    assert.match(
      tag,
      new RegExp(`data-form="${b.form}"`),
      `${b.slug}: card data-form must be exactly "${b.form}" or the filter drops it`,
    );
    // D10: no invented price. main.js treats a missing price as 0 -- accepted.
    assert.doesNotMatch(tag, /data-price=/, `${b.slug}: card has an invented price`);
  }
});

test('the form-factor values on the new cards match the filter options exactly', () => {
  const rv = read('reviews.html');
  const options = new Set(
    [...rv.matchAll(/<option value="(ATX|Micro-ATX|Mini-ITX)">/g)].map((m) => m[1]),
  );
  for (const b of BOARDS) {
    assert.ok(options.has(b.form), `filter has no option for form factor "${b.form}"`);
  }
});

test('the reviews.html board count includes the four new boards', () => {
  assert.match(read('reviews.html'), /Showing <strong>77<\/strong> motherboards/);
});

test('sitemap.xml lists all four new pages', () => {
  const sitemap = read('sitemap.xml');
  for (const b of BOARDS) {
    assert.ok(
      sitemap.includes(`https://motherboardcentral.com/${b.slug}`),
      `sitemap.xml missing ${b.slug}`,
    );
  }
});

/* ===================================== cross-page: no contradictions == */

test('the four pages do not contradict each other on shared facts', () => {
  // All four are AM5 / B850 / DDR5. Anything else differing is intentional
  // and is asserted per-board above.
  for (const b of BOARDS) {
    const specs = parseSpecTable(html(b));
    assert.equal(specs.get('Socket'), 'AM5', `${b.slug}: socket`);
    assert.equal(specs.get('Chipset'), 'B850', `${b.slug}: chipset`);
  }
});

test('related-board links resolve to real pages', () => {
  for (const b of BOARDS) {
    const grid = html(b).split(/<h[1-6][^>]*id=["']related["']/i)[1] || '';
    const links = [...grid.matchAll(/href="(review-[^"#?]+\.html)"/g)].map((m) => m[1]);
    assert.ok(links.length >= 3, `${b.slug}: only ${links.length} related boards`);
    for (const l of links) {
      assert.ok(fs.existsSync(path.join(ROOT, l)), `${b.slug}: related link ${l} is broken`);
      assert.notEqual(l, b.slug, `${b.slug}: links to itself in Related Boards`);
    }
  }
});
