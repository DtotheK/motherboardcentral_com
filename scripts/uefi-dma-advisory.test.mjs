import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HUB = 'uefi-dma-security-advisory.html';
const BIOS_GUIDE = 'guide-bios-update.html';

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the advisory hub page exists with its own canonical, title and description', () => {
  const html = read(HUB);
  assert.match(html, /<link rel="canonical" href="https:\/\/motherboardcentral\.com\/uefi-dma-security-advisory\.html">/);
  assert.match(html, /<title>UEFI Early-Boot DMA Advisory \(VU#382314\) Explained - MotherboardCentral<\/title>/);
  assert.match(html, /<meta name="description" content="VU#382314 in plain English:/);
});

test('the hub names all four CVEs and the CERT/CC note', () => {
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

test('the hub states all three reader actions the issue requires', () => {
  const html = read(HUB);
  assert.ok(html.includes('physical access'), 'must state the physical-access precondition');
  assert.ok(html.includes('Enable with Full Protection'), 'must name the manual BIOS setting');
  assert.ok(html.includes('IOMMU DMA Protection'), 'must name the BIOS option');
  assert.ok(html.includes('guide-bios-update.html'), 'must link the BIOS update guide');
});

test('the manual setting is attributed to ASUS and not generalised', () => {
  const html = read(HUB);
  const idx = html.indexOf('Enable with Full Protection');
  const context = html.slice(Math.max(0, idx - 400), idx);
  assert.ok(/ASUS/.test(context), 'the Full Protection step must be attributed to ASUS');
});

/* The BIOS-update guide teases this advisory. That teaser is the one place the
 * manual-setting claim can leak out of its ASUS attribution, because it is
 * written for readers of every brand. CERT/CC records the extra step from
 * ASUS's statement alone; the TWCERT/CC advisories for GIGABYTE, MSI and
 * ASRock say only to update firmware. */
test('the BIOS-update guide teaser keeps the manual step scoped to ASUS', () => {
  const html = read(BIOS_GUIDE);
  const idx = html.indexOf(HUB);
  assert.ok(idx !== -1, 'the BIOS update guide must link the advisory');
  const sentence = html.slice(idx, html.indexOf('</li>', idx));
  assert.ok(/BIOS setting/.test(sentence), 'the teaser should mention the BIOS setting');
  assert.ok(
    /ASUS/.test(sentence),
    'the teaser mentions a BIOS setting, so it must name ASUS — unqualified, a GIGABYTE or MSI owner reads it as applying to their board',
  );
});

test('the hub publishes no CVSS score and no firmware version', () => {
  const html = read(HUB);
  assert.ok(!/CVSS/i.test(html), 'must not publish a CVSS score');
  assert.ok(!/\bBIOS version \d/i.test(html), 'must not name a BIOS version');
});

test('no unsubstituted date placeholder survives', () => {
  assert.ok(!read(HUB).includes('DD MONTH YYYY'), 'date placeholder was not replaced');
});

test('the hub is discoverable from the sitemap and the guides index', () => {
  assert.ok(read('sitemap.xml').includes(`https://motherboardcentral.com/${HUB}`), 'missing from sitemap.xml');
  assert.ok(read('guides.html').includes(`href="${HUB}"`), 'missing a card on guides.html');
  assert.ok(read(BIOS_GUIDE).includes(`href="${HUB}"`), 'missing a link from the BIOS update guide');
});

/* PR #109 was closed because it collided with #107 at these two anchors and the
 * naive conflict resolution silently dropped guide-chipsets.html. Both entries
 * must survive. */
test('adding the advisory did not evict the chipsets guide from the sitemap or guides index', () => {
  assert.ok(
    read('sitemap.xml').includes('https://motherboardcentral.com/guide-chipsets.html'),
    'guide-chipsets.html was dropped from sitemap.xml',
  );
  assert.ok(read('guides.html').includes('href="guide-chipsets.html"'), 'guide-chipsets.html card was dropped from guides.html');
});

test('no two guide cards claim the same Guide number', () => {
  const numbers = [...read('guides.html').matchAll(/<!--\s*Guide (\d+):/g)].map((m) => m[1]);
  assert.deepEqual(numbers, [...new Set(numbers)], `duplicate Guide numbers in guides.html: ${numbers.join(', ')}`);
});

/* Phase 2 gate. AC 1 forbids editing any review page before the four vendor
 * model lists are recorded on issue #34, and those lists live only on vendor
 * pages that cannot be read from here. This fails the build if Phase 2 starts
 * early. */
test('no review page carries the advisory block yet', () => {
  const offenders = fs
    .readdirSync(ROOT)
    .filter((f) => /^review-.*\.html$/.test(f))
    .filter((f) => read(f).includes('id="uefi-dma-advisory"'));
  assert.deepEqual(offenders, [], 'Phase 2 is gated on AC 1 — vendor model lists must be recorded on #34 first');
});
