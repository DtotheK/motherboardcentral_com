import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkLinks,
  checkAffiliate,
  checkCanonical,
  checkMeta,
  parseSpecTable,
  checkSpecContradictions,
  checkDealNote,
  fingerprint,
  diffBaseline,
  dedupeFindings,
  AFFILIATE_TAG,
} from './validate.mjs';

/* ---------------------------------------------------------------- links -- */

const exists = (p) => ['index.html', 'reviews.html', 'css/style.css'].includes(p);

test('flags an href target that does not exist', () => {
  const page = { file: 'a.html', html: '<a href="ghost.html">x</a>' };
  const f = checkLinks(page, exists, []);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'broken-link');
});

test('strips query strings before checking existence', () => {
  const page = { file: 'a.html', html: '<a href="reviews.html?socket=AM5">x</a>' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

test('strips fragments before checking existence', () => {
  const page = { file: 'a.html', html: '<a href="index.html#top">x</a>' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

test('checks src as well as href', () => {
  const page = { file: 'a.html', html: '<img src="missing.png">' };
  const f = checkLinks(page, exists, []);
  assert.equal(f.length, 1);
  assert.equal(f[0].detail, 'missing.png');
});

test('honours ignorePaths', () => {
  const page = { file: 'a.html', html: '<script src="/_vercel/insights/script.js"></script>' };
  assert.deepEqual(checkLinks(page, exists, ['/_vercel']), []);
});

test('ignores external, mailto, data and bare-hash refs', () => {
  const page = {
    file: 'a.html',
    html:
      '<a href="https://x.com/a">e</a><a href="mailto:a@b.c">m</a>' +
      '<a href="#sec">h</a><img src="data:image/png;base64,AAA">',
  };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

test('resolves root-absolute internal paths against repo root', () => {
  const page = { file: 'a.html', html: '<a href="/index.html">home</a>' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

/* ------------------------------------------------------------ affiliate -- */

test('flags amazon search URLs even when tagged', () => {
  const page = {
    file: 'a.html',
    html: `<a href="https://www.amazon.com/s?k=msi+b650&tag=${AFFILIATE_TAG}">buy</a>`,
  };
  const f = checkAffiliate(page);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'affiliate-search-url');
});

test('flags a direct amazon link missing our tag', () => {
  const page = { file: 'a.html', html: '<a href="https://www.amazon.com/dp/B01">buy</a>' };
  const f = checkAffiliate(page);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'affiliate-missing-tag');
});

test('flags a direct amazon link carrying someone elses tag', () => {
  const page = { file: 'a.html', html: '<a href="https://www.amazon.com/dp/B01?tag=other-20">buy</a>' };
  assert.equal(checkAffiliate(page)[0].rule, 'affiliate-missing-tag');
});

test('accepts a direct tagged product link', () => {
  const page = {
    file: 'a.html',
    html: `<a href="https://www.amazon.com/dp/B01?tag=${AFFILIATE_TAG}">buy</a>`,
  };
  assert.deepEqual(checkAffiliate(page), []);
});

test('ignores non-amazon outbound links', () => {
  const page = { file: 'a.html', html: '<a href="https://newegg.com/p/1">buy</a>' };
  assert.deepEqual(checkAffiliate(page), []);
});

/* ------------------------------------------------------------- canonical -- */

test('flags a missing canonical', () => {
  const f = checkCanonical({ file: 'a.html', html: '<head></head>' });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'canonical-missing');
});

test('flags an empty canonical href', () => {
  const html = '<link rel="canonical" href="">';
  assert.equal(checkCanonical({ file: 'a.html', html })[0].rule, 'canonical-missing');
});

test('accepts a present canonical', () => {
  const html = '<link rel="canonical" href="https://motherboardcentral.com/a.html">';
  assert.deepEqual(checkCanonical({ file: 'a.html', html }), []);
});

/* ------------------------------------------------------------------ meta -- */

test('flags duplicate titles across pages', () => {
  const mk = (file) => ({
    file,
    html: `<title>Same</title><meta name="description" content="unique ${file}">`,
  });
  const f = checkMeta([mk('a.html'), mk('b.html')]);
  assert.equal(f.filter((x) => x.rule === 'meta-duplicate').length, 2);
});

test('flags duplicate descriptions across pages', () => {
  const mk = (file) => ({
    file,
    html: `<title>T ${file}</title><meta name="description" content="identical">`,
  });
  const f = checkMeta([mk('a.html'), mk('b.html')]);
  assert.equal(f.filter((x) => x.rule === 'meta-duplicate').length, 2);
});

test('flags an empty title', () => {
  const page = { file: 'a.html', html: '<title>  </title><meta name="description" content="d">' };
  assert.ok(checkMeta([page]).some((x) => x.rule === 'meta-empty'));
});

test('flags a missing description', () => {
  const page = { file: 'a.html', html: '<title>T</title>' };
  assert.ok(checkMeta([page]).some((x) => x.rule === 'meta-missing'));
});

test('accepts unique non-empty meta', () => {
  const page = { file: 'a.html', html: '<title>T</title><meta name="description" content="d">' };
  assert.deepEqual(checkMeta([page]), []);
});

/* ------------------------------------------------------------ spec check -- */

const withSpec = (rows, body) => ({
  file: 'a.html',
  html: `<table><tbody>${rows}</tbody></table><p>${body}</p>`,
});

test('parses spec rows', () => {
  const m = parseSpecTable('<tr><td>LAN</td><td>2.5G</td></tr>');
  assert.equal(m.get('LAN'), '2.5G');
});

test('flags LAN 2.5G against prose claiming 5 Gigabit Ethernet', () => {
  const page = withSpec(
    '<tr><td>LAN</td><td>2.5G</td></tr>',
    '5 Gigabit Ethernet provides excellent wired speeds.',
  );
  const f = checkSpecContradictions(page);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'spec-contradiction');
});

test('accepts matching LAN notation variants', () => {
  const page = withSpec(
    '<tr><td>LAN</td><td>2.5G</td></tr>',
    'The 2.5 Gigabit Ethernet port is welcome.',
  );
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('does not flag when prose never mentions the field', () => {
  const page = withSpec(
    '<tr><td>LAN</td><td>2.5G</td></tr>',
    'The board has a clean layout and good heatsinks.',
  );
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('accepts either side of a multi-value spec', () => {
  const page = withSpec(
    '<tr><td>LAN</td><td>5G+2.5G</td></tr>',
    'The 5 Gigabit Ethernet port leads the pack.',
  );
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('flags a WiFi generation mismatch', () => {
  const page = withSpec('<tr><td>WiFi</td><td>WiFi 6E</td></tr>', 'Onboard WiFi 7 keeps latency low.');
  assert.equal(checkSpecContradictions(page).length, 1);
});

test('does not flag WiFi 6E prose against a WiFi 6E spec', () => {
  const page = withSpec('<tr><td>WiFi</td><td>WiFi 6E</td></tr>', 'WiFi 6E extends into the 6GHz band.');
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('flags a socket mismatch', () => {
  const page = withSpec('<tr><td>Socket</td><td>AM5</td></tr>', 'This LGA 1700 board is a solid pick.');
  assert.equal(checkSpecContradictions(page).length, 1);
});

test('treats LGA1700 and LGA 1700 as equal', () => {
  const page = withSpec('<tr><td>Socket</td><td>LGA 1700</td></tr>', 'The LGA1700 socket is mature.');
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('ignores prose before the spec table', () => {
  const page = {
    file: 'a.html',
    html: '<p>WiFi 7 hype</p><table><tbody><tr><td>WiFi</td><td>WiFi 6E</td></tr></tbody></table><p>Clean layout.</p>',
  };
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('returns nothing when there is no spec table', () => {
  assert.deepEqual(checkSpecContradictions({ file: 'a.html', html: '<p>WiFi 7</p>' }), []);
});

/* ------------------------------------------------------------ deal note -- */

const dealNote = (inner) => `<aside class="deal-note">${inner}</aside>`;

const goodNote = dealNote(
  '<h4>Price check</h4>' +
    '<p>Launch MSRP <strong>$499</strong>, per <a href="https://www.pcworld.com/article/1384251/x.html">PCWorld</a> ' +
    "(23 November 2022). That is the launch figure, not a current price &mdash; street prices move week to week and we don&#x27;t publish live prices. " +
    `<a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=${AFFILIATE_TAG}">Check the current price on Amazon</a>.</p>` +
    '<p class="deal-note-meta">Launch MSRP and affiliate link last verified <time datetime="2026-08-21">21 August 2026</time>.</p>',
);

test('a well-formed deal note produces no findings', () => {
  assert.deepEqual(checkDealNote({ file: 'a.html', html: goodNote }), []);
});

test('a page with no deal note produces no findings', () => {
  assert.deepEqual(checkDealNote({ file: 'a.html', html: '<p>No note here. $499 elsewhere.</p>' }), []);
});

test('flags more than one deal note on a page', () => {
  const f = checkDealNote({ file: 'a.html', html: goodNote + goodNote });
  assert.equal(f.filter((x) => x.rule === 'deal-note-duplicate').length, 1);
});

test('flags a deal note with no dated time element', () => {
  const html = dealNote(
    `<p>Launch MSRP $499. <a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-missing-date');
});

test('flags a time element whose datetime is not YYYY-MM-DD', () => {
  const html = dealNote(
    '<p>Launch MSRP $499. <time datetime="21 Aug 2026">21 August 2026</time> ' +
      `<a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-missing-date');
});

test('flags a price that is not a labelled launch MSRP', () => {
  const html = dealNote(
    '<p>Street price $329.99 today. <time datetime="2026-08-21">21 August 2026</time> ' +
      `<a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-unlabelled-price');
});

test('does not flag a price introduced by "Launch MSRP"', () => {
  const html = dealNote(
    '<p>Launch MSRP <strong>$629</strong>. <time datetime="2026-08-21">21 August 2026</time> ' +
      `<a href="https://www.amazon.com/dp/B0BG6M53DG?tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  assert.deepEqual(checkDealNote({ file: 'a.html', html }), []);
});

test('flags a second, unlabelled price alongside a labelled one', () => {
  const html = dealNote(
    '<p>Launch MSRP $499, now $329.99 at retail. <time datetime="2026-08-21">21 August 2026</time> ' +
      `<a href="https://www.amazon.com/dp/B0BDTHQTJV?tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-unlabelled-price');
});

test('flags a deal note whose only Amazon link is a search URL', () => {
  const html = dealNote(
    '<p>Launch MSRP $499. <time datetime="2026-08-21">21 August 2026</time> ' +
      `<a href="https://www.amazon.com/s?k=asus+x670e&tag=${AFFILIATE_TAG}">Amazon</a></p>`,
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-no-affiliate-link');
});

test('flags a deal note whose direct product link is missing our tag', () => {
  const html = dealNote(
    '<p>Launch MSRP $499. <time datetime="2026-08-21">21 August 2026</time> ' +
      '<a href="https://www.amazon.com/dp/B0BDTHQTJV">Amazon</a></p>',
  );
  const f = checkDealNote({ file: 'a.html', html });
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'deal-note-no-affiliate-link');
});

test('deal-note findings carry the page file name', () => {
  const f = checkDealNote({ file: 'review-x.html', html: dealNote('<p>Launch MSRP $499.</p>') });
  assert.ok(f.length > 0);
  for (const finding of f) assert.equal(finding.file, 'review-x.html');
});

/* --------------------------------------------------------- baseline ratchet */

const f1 = { file: 'a.html', rule: 'broken-link', detail: 'ghost.html' };
const f2 = { file: 'b.html', rule: 'canonical-missing', detail: 'no rel=canonical' };

test('fingerprint is stable and line-independent', () => {
  assert.equal(fingerprint({ ...f1, line: 10 }), fingerprint({ ...f1, line: 99 }));
});

test('unbaselined findings are fresh', () => {
  const d = diffBaseline([f1], []);
  assert.equal(d.fresh.length, 1);
  assert.equal(d.known.length, 0);
  assert.equal(d.resolved.length, 0);
});

test('baselined findings are known, not fresh', () => {
  const d = diffBaseline([f1], [fingerprint(f1)]);
  assert.equal(d.fresh.length, 0);
  assert.equal(d.known.length, 1);
});

test('baseline entries with no matching finding are resolved', () => {
  const d = diffBaseline([f1], [fingerprint(f1), fingerprint(f2)]);
  assert.equal(d.resolved.length, 1);
  assert.equal(d.resolved[0], fingerprint(f2));
});

test('ignores the Related Boards section, which describes other boards', () => {
  const page = {
    file: 'a.html',
    html:
      '<table><tbody><tr><td>WiFi</td><td>WiFi 6E</td></tr>' +
      '<tr><td>Socket</td><td>AM5</td></tr></tbody></table>' +
      '<p>WiFi 6E keeps latency low.</p>' +
      '<h2 id="related">Related Boards</h2>' +
      '<a href="x.html"><h4>GIGABYTE X870 AORUS ELITE WIFI7</h4>' +
      '<span>LGA 1851 &middot; Z890 &middot; ATX</span></a>',
  };
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('dedupes identical findings and records an occurrence count', () => {
  const dup = { file: 'a.html', rule: 'affiliate-search-url', detail: 'https://amzn/s?k=x', line: 5 };
  const out = dedupeFindings([dup, { ...dup, line: 40 }, { ...dup, line: 90 }]);
  assert.equal(out.length, 1);
  assert.equal(out[0].count, 3);
  assert.equal(out[0].line, 5);
});

test('keeps genuinely distinct findings separate', () => {
  const a = { file: 'a.html', rule: 'broken-link', detail: 'x.html' };
  const b = { file: 'a.html', rule: 'broken-link', detail: 'y.html' };
  assert.equal(dedupeFindings([a, b]).length, 2);
});
