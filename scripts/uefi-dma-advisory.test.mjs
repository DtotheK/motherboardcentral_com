import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HUB = 'uefi-dma-security-advisory.html';

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/* Phase 1 of issue #34 ships the explainer only. The per-review-page pointer
   boxes are Phase 2 and are blocked on a human opening the four vendor
   security pages by hand — every CVE record says "certain motherboard models"
   and the model lists are only on those pages, which refuse automated fetches.
   See the Phase 2 gate in the issue before adding coverage tests here. */

test('the advisory hub page carries its own canonical, title and description', () => {
  const html = read(HUB);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/motherboardcentral\.com\/uefi-dma-security-advisory\.html">/,
  );
  assert.match(
    html,
    /<title>UEFI Early-Boot DMA Advisory \(VU#382314\) Explained - MotherboardCentral<\/title>/,
  );
  assert.match(html, /<meta name="description" content="VU#382314 in plain English:/);
});

test('the hub names the CERT/CC note and all four vendor CVEs', () => {
  const html = read(HUB);
  for (const needle of [
    'VU#382314',
    'CVE-2025-11901',
    'CVE-2025-14302',
    'CVE-2025-14303',
    'CVE-2025-14304',
    'https://kb.cert.org/vuls/id/382314',
  ]) {
    assert.ok(html.includes(needle), `hub page missing "${needle}"`);
  }
});

/* The three facts the issue's acceptance criteria require the notice to state. */
test('the hub states the update, the manual BIOS setting and the physical-access precondition', () => {
  const html = read(HUB);
  assert.ok(html.includes('physical access'), 'must state the physical-access precondition');
  assert.ok(html.includes('IOMMU DMA Protection'), 'must name the BIOS option');
  assert.ok(html.includes('Enable with Full Protection'), 'must name the required setting value');
  assert.ok(html.includes('guide-bios-update.html'), 'must link the BIOS update guide');
});

/* CERT/CC attributes the "Enable with Full Protection" step to ASUS's statement
   alone. The advisories TWCERT/CC published for GIGABYTE, MSI and ASRock say
   only to update firmware. Generalising it to four vendors is unsourced.
   Source: https://kb.cert.org/vuls/id/382314 */
test('the manual Full Protection step is attributed to ASUS, not to all four vendors', () => {
  const html = read(HUB);
  const idx = html.indexOf('Enable with Full Protection');
  assert.notEqual(idx, -1, 'the Full Protection step is missing');
  assert.match(
    html.slice(Math.max(0, idx - 400), idx),
    /ASUS/,
    'the Full Protection step must be attributed to ASUS',
  );
});

/* AC 3: ASRock and MSI had no vendor statement in the CERT/CC note. The page
   must say so rather than implying a fix exists for those boards. */
test('the hub reports MSI and ASRock as having filed no statement with CERT/CC', () => {
  const html = read(HUB);
  assert.ok(html.includes('no statement'), 'must record the missing vendor statements');
  const idx = html.indexOf('no statement');
  const context = html.slice(Math.max(0, idx - 500), idx + 500);
  assert.match(context, /MSI/, 'the no-statement record must name MSI');
  assert.match(context, /ASRock/, 'the no-statement record must name ASRock');
});

test('the hub links all four vendor security pages', () => {
  const html = read(HUB);
  for (const url of [
    'https://www.asus.com/security-advisory/',
    'https://www.gigabyte.com/Support/Security',
    'https://csr.msi.com/global/product-security-advisories',
    'https://www.asrock.com/support/Security.asp',
  ]) {
    assert.ok(html.includes(url), `hub page missing vendor link ${url}`);
  }
});

/* Both CVSS scores are CNA-assigned and disagree across scales (7.0 HIGH on
   4.0, 6.8 MEDIUM on 3.1). Quoting either alone misstates the severity, and a
   motherboard buyer acts on "physical access" rather than on a number. */
test('the hub publishes no CVSS score and no BIOS version number', () => {
  const html = read(HUB);
  assert.ok(!/CVSS/i.test(html), 'must not publish a CVSS score');
  assert.ok(!/\bBIOS version \d/i.test(html), 'must not name a specific BIOS version');
});

/* CLAUDE.md rule 2. We read the CVE records and the CERT/CC note; we did not
   flash a board or reproduce the attack. */
test('the hub claims no hands-on testing and no per-board affected status', () => {
  const html = read(HUB);
  assert.ok(
    !/\b(?:we|our)\s+(?:tested|benchmarked|measured|flashed)\b/i.test(html),
    'must not claim hands-on testing',
  );
  assert.ok(
    html.includes('certain motherboard models'),
    'must carry the CVE records’ own "certain motherboard models" qualifier',
  );
});

test('no unsubstituted date placeholder survives', () => {
  assert.ok(!read(HUB).includes('DD MONTH YYYY'), 'date placeholder was not replaced');
});

test('the hub is discoverable from the sitemap, the guides index and the BIOS guide', () => {
  assert.ok(
    read('sitemap.xml').includes(`https://motherboardcentral.com/${HUB}`),
    'missing from sitemap.xml',
  );
  assert.ok(read('guides.html').includes(`href="${HUB}"`), 'missing a card on guides.html');
  assert.ok(
    read('guide-bios-update.html').includes(`href="${HUB}"`),
    'missing a link from the BIOS update guide',
  );
});

/* Phase 1 must not touch review pages: AC 1 forbids editing any page before the
   vendor model lists are recorded on the issue, which needs a human. */
test('phase 1 adds the advisory to no review page', () => {
  const carriers = fs
    .readdirSync(ROOT)
    .filter((f) => /^review-.*\.html$/.test(f))
    .filter((f) => read(f).includes('uefi-dma-advisory'));
  assert.deepEqual(carriers, [], 'Phase 2 is gated on the vendor model lists (AC 1)');
});
