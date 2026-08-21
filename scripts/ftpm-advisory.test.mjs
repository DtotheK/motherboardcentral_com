import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ADVISORY_OPEN = '<div class="info-box" id="ftpm-advisory">';
const DATE_STAMP = 'Advisory added 2026-08-20.';

const VENDOR_LINKS = {
  asrock: 'https://www.asrock.com/support/Security.asp',
  asus: 'https://www.asus.com/security-advisory/',
  gigabyte: 'https://www.gigabyte.com/Support/Security',
  msi: 'https://csr.msi.com/global/product-security-advisories',
};

/* Same selector the issue specifies: every AM4/AM5 review page by filename. */
const PAGES = fs
  .readdirSync(ROOT)
  .filter((f) => /^review-.*\.html$/.test(f))
  .filter((f) => /b550|x570|a620|b650|x670|x870/i.test(f))
  .sort();

const brandOf = (file) => file.replace(/^review-/, '').split('-')[0];
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/* Slicing to the specifications heading also asserts the block sits above it. */
function advisoryBlock(html, file) {
  const start = html.indexOf(ADVISORY_OPEN);
  assert.notEqual(start, -1, `${file}: no advisory block`);
  const end = html.indexOf('<h2 id="specifications">', start);
  assert.notEqual(end, -1, `${file}: advisory block is not above the specifications heading`);
  return html.slice(start, end);
}

test('the AMD advisory scope covers at least the 35 pages issue #20 names', () => {
  assert.ok(PAGES.length >= 35, `expected >= 35 AMD review pages, found ${PAGES.length}`);
});

test('every AMD review page carries exactly one advisory block', () => {
  for (const file of PAGES) {
    const hits = read(file).split(ADVISORY_OPEN).length - 1;
    assert.equal(hits, 1, `${file}: expected 1 advisory block, found ${hits}`);
  }
});

test('the advisory carries the CVEs, the bulletin, the BitLocker line and the date', () => {
  const required = [
    'AMD-SB-7064',
    'CVE-2026-6726',
    'CVE-2026-6727',
    'Ryzen 3000 to Ryzen 9000',
    'save your recovery key first',
    'guide-bios-update.html',
    DATE_STAMP,
  ];
  for (const file of PAGES) {
    const block = advisoryBlock(read(file), file);
    for (const needle of required) {
      assert.ok(block.includes(needle), `${file}: advisory missing "${needle}"`);
    }
  }
});

test('each advisory links its own vendor and no other', () => {
  for (const file of PAGES) {
    const brand = brandOf(file);
    const expected = VENDOR_LINKS[brand];
    assert.ok(expected, `${file}: no vendor URL mapped for brand "${brand}"`);
    const block = advisoryBlock(read(file), file);
    assert.ok(block.includes(`href="${expected}"`), `${file}: expected vendor link ${expected}`);
    for (const [other, url] of Object.entries(VENDOR_LINKS)) {
      if (other === brand) continue;
      assert.ok(!block.includes(url), `${file}: links the wrong vendor (${other})`);
    }
  }
});

test('the advisory sits above the spec table, outside the validator spec-contradiction window', () => {
  for (const file of PAGES) {
    const html = read(file);
    assert.ok(
      html.indexOf(ADVISORY_OPEN) < html.indexOf('</table>'),
      `${file}: advisory must appear before the first </table>`,
    );
  }
});

test('the advisory names no AGESA version and no socket', () => {
  for (const file of PAGES) {
    const block = advisoryBlock(read(file), file);
    assert.ok(!/AGESA|ComboAM\d/i.test(block), `${file}: must not name an AGESA version`);
    assert.ok(!/\bAM[45]\b/.test(block), `${file}: must not name a socket`);
  }
});
