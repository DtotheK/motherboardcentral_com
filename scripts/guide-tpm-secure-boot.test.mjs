/**
 * Tests for the TPM 2.0 / Secure Boot guide (issue #33).
 *
 * The risk on this page is menu paths. A BIOS path is a spec: send a reader to
 * "Advanced \ Something" that does not exist on their board and they conclude
 * their hardware is broken. Only two vendor sources were readable when this
 * page was written (ASUS FAQ 1055973 and Microsoft Learn); MSI, GIGABYTE,
 * ASRock and Intel all refuse automated fetches. So the rule these tests
 * enforce is: a menu path may only appear where we can cite the vendor page it
 * came from, and never next to a vendor whose page we could not read. The
 * second risk is the MBR2GPT section, where the reader can destroy a boot
 * install by running one command in the wrong order.
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
const PAGE = 'guide-tpm-secure-boot.html';
const CANONICAL = `https://motherboardcentral.com/${PAGE}`;
const TEMPLATE = 'guide-storage.html';

/* The vendor sources we actually fetched and read. Nothing else may carry a
 * menu path. */
const ASUS_FAQ = 'https://www.asus.com/support/faq/1055973/';
const MS_REQUIREMENTS = 'https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements';
const MS_MBR2GPT = 'https://learn.microsoft.com/en-us/windows/deployment/mbr-to-gpt';

/* Vendors whose support pages returned 403/404/empty to us. */
const UNREAD_VENDORS = ['MSI', 'GIGABYTE', 'ASRock', 'Intel'];

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

/** Everything from an <h2 id="..."> up to the next <h2>. */
const section = (id) => {
  const page = html();
  const start = page.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `no section #${id}`);
  const rest = page.slice(start);
  const next = rest.search(/<h2\b/i);
  return next === -1 ? rest : rest.slice(0, next);
};

/** The article body only -- nav, hero and footer are not claims. */
const body = () => {
  const page = html();
  const start = page.indexOf('<div class="guide-content">');
  const end = page.indexOf('<!-- END .guide-content -->');
  assert.ok(start !== -1 && end !== -1, 'guide-content block not found');
  return page.slice(start, end);
};

/* ============================================================ existence == */

test('the guide page exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PAGE)), `${PAGE} not found`);
});

/* ================================================================= SEO == */

test('has a title naming both TPM and Secure Boot', () => {
  const title = getTitle(html());
  assert.ok(title, 'no <title>');
  assert.match(title, /TPM/);
  assert.match(title, /Secure Boot/i);
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

/* =========================================================== structure == */

test('covers every section the issue outline specifies', () => {
  const page = html();
  const sections = {
    'what TPM 2.0 and Secure Boot are': /id="what-they-are"/,
    'check what you already have': /id="check-first"/,
    'firmware TPM vs a discrete module': /id="firmware-vs-discrete"/,
    'enabling firmware TPM on AMD': /id="enable-amd"/,
    'enabling firmware TPM on Intel': /id="enable-intel"/,
    'enabling Secure Boot and CSM': /id="secure-boot"/,
    'MBR to GPT conversion': /id="mbr-to-gpt"/,
    'after you enable it': /id="after"/,
    'the AMD fTPM firmware caveat': /id="ftpm-caveat"/,
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

/* ===================================== the Windows 11 requirement claim == */

test('states the Windows 11 requirement in Microsoft\'s own terms', () => {
  const text = prose();
  assert.match(text, /Secure Boot capable/i, 'the "UEFI, Secure Boot capable" wording is missing');
  assert.match(text, /Trusted Platform Module \(TPM\) version 2\.0|TPM.{0,20}version 2\.0/i,
    'the TPM 2.0 requirement is not stated in Microsoft\'s wording');
});

test('cites the Microsoft requirements page for that claim', () => {
  assert.ok(extractRefs(html()).some((r) => r.startsWith(MS_REQUIREMENTS)),
    `the Windows 11 requirements page is not linked: ${MS_REQUIREMENTS}`);
});

test('never claims Microsoft dropped the TPM 2.0 requirement', () => {
  // A persistent forum claim. Microsoft's page still lists TPM 2.0, so
  // repeating it would send readers into an install that fails.
  const text = prose();
  assert.doesNotMatch(
    text,
    /(?:dropped|removed|relaxed|no longer requires?|waived)[^.]{0,60}TPM/i,
    'the page repeats the "Microsoft dropped the TPM requirement" claim',
  );
  assert.doesNotMatch(text, /TPM[^.]{0,60}(?:is no longer|no longer a) require/i);
});

/* ========================================== menu paths must be sourced == */

/**
 * A BIOS menu path, by this page's convention, is a <code> element whose text
 * contains a "›" separator. Anything claiming to be a path must use that form,
 * so these tests can find every one of them -- together with the <p>, <li> or
 * <td> it sits inside, which is where its citation has to be.
 */
const menuPaths = () => {
  const src = body();
  return [...src.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/gi)]
    .map((m) => ({ text: stripTags(m[1]), at: m.index }))
    .filter((p) => p.text.includes('›'))
    .map((p) => {
      const open = Math.max(
        src.lastIndexOf('<p', p.at), src.lastIndexOf('<li', p.at), src.lastIndexOf('<td', p.at),
      );
      const end = Math.min(
        ...['</p>', '</li>', '</td>'].map((t) => {
          const i = src.indexOf(t, p.at);
          return i === -1 ? src.length : i;
        }),
      );
      return { ...p, container: src.slice(open === -1 ? 0 : open, end) };
    });
};

test('at least one BIOS menu path is given, so the page is actually usable', () => {
  assert.ok(menuPaths().length >= 1, 'no BIOS menu path anywhere on the page');
});

test('every BIOS menu path sits next to the vendor page it came from', () => {
  for (const p of menuPaths()) {
    assert.match(
      p.container,
      /href="https:\/\/(?:www\.asus\.com|learn\.microsoft\.com)/,
      `menu path "${p.text}" is not accompanied by a link to the source it came from`,
    );
  }
});

test('no menu path is attributed to a vendor whose support page we could not read', () => {
  // MSI, GIGABYTE, ASRock and Intel all refused automated fetching. We name
  // their settings; we do not invent their menu trees.
  for (const p of menuPaths()) {
    const named = UNREAD_VENDORS.filter((v) => stripTags(p.container).includes(v));
    assert.deepEqual(named, [],
      `menu path "${p.text}" is presented alongside ${named.join(', ')}, whose page we could not verify`);
  }
});

test('the ASUS FAQ we did read is linked', () => {
  assert.ok(extractRefs(html()).some((r) => r.startsWith(ASUS_FAQ)),
    `the ASUS source is not linked: ${ASUS_FAQ}`);
});

test('names the firmware-TPM setting for AMD and for Intel', () => {
  const text = prose();
  assert.match(text, /fTPM/, 'the AMD setting name is missing');
  assert.match(text, /\bPTT\b/, 'the Intel setting name is missing');
  assert.match(text, /Platform Trust Technology/i, 'Intel PTT is never spelled out');
  assert.match(text, /Security Device Support/i,
    'the "Security Device Support" label some boards use is not mentioned');
});

test('the Intel section says a path could not be confirmed rather than inventing one', () => {
  const intel = section('enable-intel');
  const paths = [...intel.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.includes('›'));
  assert.deepEqual(paths, [], `an unverified Intel menu path is printed: ${paths.join(' | ')}`);
  assert.match(stripTags(intel), /manual|could not|not able to|varies|search/i,
    'the Intel section neither gives a sourced path nor tells the reader where to look');
});

/* ==================================================== the MBR2GPT section == */

test('the MBR2GPT section warns before it instructs', () => {
  const sec = section('mbr-to-gpt');
  const warning = sec.search(/cannot be undone|not reversible|one-way|irreversible/i);
  const command = sec.search(/mbr2gpt\s*\/convert/i);
  assert.notEqual(warning, -1, 'no irreversibility warning');
  assert.notEqual(command, -1, 'the conversion command is never given');
  assert.ok(warning < command, 'the irreversibility warning comes after the convert command');
});

test('the MBR2GPT section puts /validate before /convert', () => {
  const sec = section('mbr-to-gpt');
  const validate = sec.search(/mbr2gpt\s*\/validate/i);
  const convert = sec.search(/mbr2gpt\s*\/convert/i);
  assert.notEqual(validate, -1, '/validate is never shown');
  assert.ok(validate < convert, '/convert is shown before /validate');
});

test('the MBR2GPT section assumes a backup and says so', () => {
  assert.match(stripTags(section('mbr-to-gpt')), /back(?:\s|-)?up/i,
    'the reader is not told to have a backup');
});

test('the MBR2GPT section says the firmware must then be switched to UEFI', () => {
  assert.match(stripTags(section('mbr-to-gpt')), /switch[^.]{0,60}UEFI|UEFI[^.]{0,40}mode/i,
    'the "you must switch the firmware to UEFI mode" step is missing');
});

test('cites the Microsoft MBR2GPT documentation', () => {
  assert.ok(extractRefs(html()).some((r) => r.startsWith(MS_MBR2GPT)),
    `the MBR2GPT page is not linked: ${MS_MBR2GPT}`);
});

test('warns not to enable Secure Boot while the disk is still MBR', () => {
  const relevant = stripTags(section('secure-boot') + section('mbr-to-gpt'));
  assert.match(relevant, /MBR/, 'MBR is never mentioned around Secure Boot');
  assert.match(relevant, /(?:do not|don't|before)[^.]{0,120}(?:Secure Boot|UEFI)/i,
    'no ordering warning about enabling Secure Boot on an MBR disk');
});

test('the Secure Boot section explains that CSM has to go off', () => {
  assert.match(stripTags(section('secure-boot')), /CSM/, 'CSM is not covered');
});

/* ================================================= BitLocker protection == */

test('warns about BitLocker recovery before the reader changes anything', () => {
  const text = prose();
  assert.match(text, /BitLocker/, 'BitLocker is never mentioned');
  assert.match(text, /recovery key/i, 'the recovery key is never mentioned');
});

test('the BitLocker warning appears above the first enable step', () => {
  const src = body();
  const bitlocker = src.search(/BitLocker/i);
  const firstEnable = src.indexOf('id="enable-amd"');
  assert.notEqual(bitlocker, -1, 'no BitLocker warning');
  assert.ok(bitlocker < firstEnable,
    'the reader reaches the enable steps before being told to save a BitLocker recovery key');
});

test('tells the reader what to verify afterwards', () => {
  const after = stripTags(section('after'));
  assert.match(after, /tpm\.msc/i, 'tpm.msc is not given as the check');
  assert.match(after, /msinfo32/i, 'msinfo32 is not given as the check');
  assert.match(after, /Secure Boot State/i, 'the Secure Boot State field is not named');
});

/* ======================================= discrete module is not needed == */

test('tells the reader they almost certainly do not need to buy a TPM module', () => {
  const sec = stripTags(section('firmware-vs-discrete'));
  assert.match(sec, /header|module/i, 'the add-in module is never discussed');
  assert.match(sec, /(?:do not|don't|no) need|not necessary|unnecessary/i,
    'the page never says the module purchase is unnecessary');
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

test('quotes no price', () => {
  assert.doesNotMatch(prose(), /[$£€]\s?\d/, 'a currency figure appears');
});

test('prints no AGESA version string', () => {
  // Same rule as issues #20 and #32: published AGESA numbers conflict and none
  // is verified per board.
  assert.doesNotMatch(prose(), /\bAGESA\s*[\d.]|\bComboAM[45]/i, 'an AGESA version is named');
});

test('prints no CVSS score for the fTPM CVEs', () => {
  // AMD's CVSS 4.0 figures and NVD's CISA-ADP CVSS 3.1 figures disagree. A
  // guide does not need the number, so it does not print one.
  assert.doesNotMatch(prose(), /CVSS/i, 'a CVSS score appears');
});

/* ====================================================== the fTPM caveat == */

test('the fTPM caveat section says the fix ships as a BIOS update', () => {
  const sec = stripTags(section('ftpm-caveat'));
  assert.match(sec, /BIOS update|update the BIOS|firmware update/i,
    'the section never says the fix arrives as a BIOS update');
  assert.match(sec, /Windows Update/i,
    'the section does not tell the reader Windows Update will not deliver it');
});

test('the fTPM caveat section names the CVEs it refers to', () => {
  assert.match(stripTags(section('ftpm-caveat')), /CVE-2026-6726|CVE-2026-6727/,
    'the section alludes to a vulnerability without naming it');
});

test('the fTPM caveat links our BIOS update guide', () => {
  assert.match(section('ftpm-caveat'), /href="guide-bios-update\.html/,
    'the reader is told to flash without being pointed at the how-to');
});

/* ====================================================== interlinking == */

test('links at least three of the pages the issue names', () => {
  const refs = new Set(extractRefs(body()).map((r) => r.split('#')[0]));
  const wanted = ['guide-sockets.html', 'guide-storage.html', 'guides.html', 'guide-bios-update.html'];
  const hit = wanted.filter((p) => refs.has(p));
  assert.ok(hit.length >= 3, `only linked ${hit.length} of the named pages: ${hit.join(', ')}`);
});

test('closes with the standard Related Guides card block', () => {
  const page = html();
  assert.match(page, /id="related-guides"/);
  const related = page.slice(page.indexOf('id="related-guides"'));
  const cards = [...related.matchAll(/class="card guide-card"/g)];
  assert.ok(cards.length >= 2, `Related Guides has ${cards.length} cards, expected at least 2`);
});

/* ======================================================= discoverability == */

test('is listed in sitemap.xml', () => {
  assert.ok(read('sitemap.xml').includes(CANONICAL), `sitemap.xml missing ${CANONICAL}`);
});

test('is linked from the guides hub', () => {
  assert.ok(extractRefs(read('guides.html')).includes(PAGE), `guides.html does not link to ${PAGE}`);
});
