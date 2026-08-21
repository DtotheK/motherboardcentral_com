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

/* Select by socket, not filename: #20's filename filter missed three AM4 pages
   whose names carry no chipset token. Mirrors the issue #83 grep:
   grep -lE '<td>Socket</td>[[:space:]]*<td>AM[45]' review-*.html */
const SOCKET_ROW = /<td>Socket<\/td>\s*<td>AM[45]/;
const PAGES = fs
  .readdirSync(ROOT)
  .filter((f) => /^review-.*\.html$/.test(f))
  .filter((f) => SOCKET_ROW.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
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

/* The AMD buying guides recommend several boards each, so they get a pointer
   sentence to the explainer rather than the full block and a vendor link. */
const GUIDES = [
  'best-motherboard-for-ryzen-5-3600.html',
  'best-motherboard-for-ryzen-5-5600x.html',
  'best-motherboard-for-ryzen-7-3700x.html',
  'best-motherboard-for-ryzen-7-7800x3d.html',
  'best-motherboard-for-ryzen-7-9700x.html',
  'best-motherboard-for-ryzen-7-9800x3d.html',
  'best-motherboard-for-ryzen-9-9950x.html',
];

const POINTER = 'id="ftpm-advisory-pointer"';

test('the AMD advisory scope covers all 38 AM4/AM5 review pages', () => {
  assert.ok(PAGES.length >= 38, `expected >= 38 AMD review pages, found ${PAGES.length}`);
});

test('every AMD buying guide carries exactly one advisory pointer', () => {
  for (const file of GUIDES) {
    const hits = read(file).split(POINTER).length - 1;
    assert.equal(hits, 1, `${file}: expected 1 advisory pointer, found ${hits}`);
  }
});

test('the pointer links the explainer and states the local-access precondition', () => {
  for (const file of GUIDES) {
    const html = read(file);
    const start = html.indexOf(POINTER);
    const block = html.slice(start, html.indexOf('</div>', start));
    for (const needle of [
      'guide-tpm-secure-boot.html#ftpm-caveat',
      '11 August 2026',
      'local privileged access',
      'not a recall',
    ]) {
      assert.ok(block.includes(needle), `${file}: pointer missing "${needle}"`);
    }
  }
});

/* Same reason the review-page block sits above the spec table: validate.mjs
   only reads prose after the first </table> for spec contradictions. */
test('the pointer sits above the first table on every guide', () => {
  for (const file of GUIDES) {
    const html = read(file);
    assert.ok(
      html.indexOf(POINTER) < html.indexOf('</table>'),
      `${file}: pointer must appear before the first </table>`,
    );
  }
});

/* Decision from #22 triage: pointer sentence only. These pages recommend
   several boards, so a single board's vendor link would be wrong. */
test('the pointer names no vendor advisory link and no board-specific BIOS claim', () => {
  for (const file of GUIDES) {
    const html = read(file);
    const start = html.indexOf(POINTER);
    const block = html.slice(start, html.indexOf('</div>', start));
    for (const url of Object.values(VENDOR_LINKS)) {
      assert.ok(!block.includes(url), `${file}: pointer must not carry a vendor advisory link`);
    }
    assert.ok(!/AGESA|ComboAM\d/i.test(block), `${file}: pointer must not name an AGESA version`);
  }
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

/* CVE-2026-6726 is CWE-704 (Incorrect Type Conversion or Cast), and the NVD
   record calls it an information leakage vulnerability. "Out-of-bounds read"
   is CWE-125 — a different vulnerability class, and the phrase appears nowhere
   in the record. Shipped on 38 pages by #20; corrected under #22.
   Source: https://nvd.nist.gov/vuln/detail/CVE-2026-6726 */
test('no advisory miscalls CVE-2026-6726 an out-of-bounds read', () => {
  for (const file of PAGES) {
    const block = advisoryBlock(read(file), file);
    assert.ok(
      !/out-of-bounds/i.test(block),
      `${file}: CVE-2026-6726 is an information-leakage flaw (CWE-704), not an out-of-bounds read`,
    );
  }
});

test('the advisory describes CVE-2026-6726 as the NVD record does', () => {
  const wording =
    '<strong>CVE-2026-6726</strong>, an information-leakage flaw that lets a forged ' +
    'TPM key be certified as genuine, and <strong>CVE-2026-6727</strong>, a timing side-channel.';
  for (const file of PAGES) {
    const block = advisoryBlock(read(file), file);
    assert.ok(block.includes(wording), `${file}: advisory missing the verified CVE-2026-6726 wording`);
  }
});
