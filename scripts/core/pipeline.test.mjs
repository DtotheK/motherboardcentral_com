/**
 * Characterization test for the check pipeline.
 *
 * Written BEFORE the core/rules/rules.site split and required to pass both
 * before and after it: it pins the observable contract of runChecks() so the
 * refactor cannot quietly change what the validator reports.
 *
 * Two properties are pinned, and the second is the subtle one:
 *
 *   1. WHICH findings come back, for a corpus exercising every rule.
 *   2. The ORDER they come back in. main() sorts findings by (file, rule) with
 *      Array#sort, which is stable, so two findings sharing a file AND a rule
 *      keep their insertion order in the printed report. Reordering the checks
 *      inside runChecks() would therefore reorder real output while leaving
 *      every set-based assertion green.
 *
 * The corpus is fixtures held in memory, never the live site. A golden of the
 * real corpus would encode world-state and rot the moment a page changes --
 * the failure mode docs/harness-audit-2026-08.md records as mode 7.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { runChecks } from '../validate.mjs';

/* ---------------------------------------------------------------- corpus -- */

const page = (file, html) => ({ file, html });

const head = (title, desc, canonical = 'https://motherboardcentral.com/x.html') => `
  <head>
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${canonical}">
  </head>`;

/** Exercises affiliate (search URL + missing tag) and a broken link. */
const AFFILIATE = page(
  'a-affiliate.html',
  `<html>${head('A', 'a desc')}<body>
     <a href="/missing-page.html">gone</a>
     <a href="https://www.amazon.com/s?k=board&tag=motherboardcentral.com-20">search</a>
     <a href="https://www.amazon.com/dp/B0TAGLESS">untagged</a>
   </body></html>`,
);

/** Exercises spec-contradiction: table says 2.5G, prose claims 5 Gigabit. */
const SPEC = page(
  'b-spec.html',
  `<html>${head('B', 'b desc')}<body>
     <table><tr><td>LAN</td><td>2.5G</td></tr></table>
     <p>5 Gigabit Ethernet keeps large transfers quick.</p>
   </body></html>`,
);

/** Exercises canonical-missing and meta-empty. */
const BROKEN_HEAD = page(
  'c-head.html',
  `<html><head><title></title><meta name="description" content="c desc"></head>
   <body><p>no canonical here</p></body></html>`,
);

/** Two pages sharing a title, to exercise the corpus-wide meta-duplicate. */
const DUPE_ONE = page('d-dupe-one.html', `<html>${head('Shared', 'one')}<body>x</body></html>`);
const DUPE_TWO = page('e-dupe-two.html', `<html>${head('Shared', 'two')}<body>y</body></html>`);

const CORPUS = [AFFILIATE, SPEC, BROKEN_HEAD, DUPE_ONE, DUPE_TWO];

/** Only the affiliate page's own file exists; every other ref is dangling. */
const existsFn = (rel) => rel === 'a-affiliate.html';

const shape = (f) => `${f.file} :: ${f.rule}`;

/* ----------------------------------------------------------------- tests -- */

test('runChecks reports exactly the expected findings, in order', () => {
  const found = runChecks(CORPUS, existsFn).map(shape);

  assert.deepEqual(found, [
    // per-page checks, in page order; within a page, in check order
    'a-affiliate.html :: broken-link',
    'a-affiliate.html :: affiliate-search-url',
    'a-affiliate.html :: affiliate-missing-tag',
    'b-spec.html :: spec-contradiction',
    'c-head.html :: canonical-missing',
    // corpus-wide meta runs last, after every per-page finding -- which is why
    // c-head's meta-empty trails its canonical-missing rather than leading it.
    'c-head.html :: meta-empty',
    'd-dupe-one.html :: meta-duplicate',
    'e-dupe-two.html :: meta-duplicate',
  ]);
});

test('per-page checks run in the order links, affiliate, canonical, spec', () => {
  // Pinned separately from the corpus assertion because this ordering is what
  // survives the stable sort in main() and reaches the printed report.
  const mixed = page(
    'z-all.html',
    `<html><head><title>Z</title><meta name="description" content="z"></head><body>
       <a href="/nope.html">broken</a>
       <a href="https://www.amazon.com/s?k=x">search</a>
       <table><tr><td>Socket</td><td>AM5</td></tr></table>
       <p>The LGA 1700 socket is used here.</p>
     </body></html>`,
  );

  const rules = runChecks([mixed], () => false).map((f) => f.rule);

  assert.deepEqual(rules, [
    'broken-link',
    'affiliate-search-url',
    'canonical-missing',
    'spec-contradiction',
  ]);
});

test('corpus-wide meta findings come after every per-page finding', () => {
  const found = runChecks(CORPUS, existsFn);
  const lastPageCheck = found.findLastIndex((f) => f.rule !== 'meta-duplicate');
  const firstDuplicate = found.findIndex((f) => f.rule === 'meta-duplicate');

  assert.ok(
    firstDuplicate > lastPageCheck,
    'checkMeta must run after the per-page loop, not interleaved with it',
  );
});

test('a clean page produces no findings at all', () => {
  const clean = page(
    'clean.html',
    `<html>${head('Clean', 'a unique description')}<body>
       <a href="https://www.amazon.com/dp/B0OK?tag=motherboardcentral.com-20">buy</a>
       <table><tr><td>LAN</td><td>2.5G</td></tr></table>
       <p>2.5 Gigabit Ethernet handles NAS transfers.</p>
     </body></html>`,
  );

  assert.deepEqual(runChecks([clean], () => true), []);
});
