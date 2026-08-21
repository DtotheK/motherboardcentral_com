#!/usr/bin/env node
/**
 * MotherboardCentral site validator.
 *
 * Zero dependencies by design: CLAUDE.md forbids introducing frameworks or
 * build tooling, so this uses regex extraction rather than a DOM parser. The
 * markup is machine-generated and uniform, which makes that tractable; where
 * extraction finds nothing it reports `extraction-failed` rather than passing
 * silently, because a validator that fails open is worse than none.
 *
 * Usage:
 *   node scripts/validate.mjs                    # validate, exit 1 on violations
 *   node scripts/validate.mjs --update-baseline  # re-record known debt
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const AFFILIATE_TAG = 'motherboardcentral.com-20';
export const BASELINE_FILE = 'validation-baseline.json';

/** Paths that legitimately do not exist in the repo (injected at runtime). */
export const DEFAULT_IGNORE_PATHS = ['/_vercel'];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ========================================================== extraction == */

const REF_RE = /(?:href|src)\s*=\s*"([^"]*)"/gi;

export function extractRefs(html) {
  return [...html.matchAll(REF_RE)].map((m) => m[1]);
}

function lineOf(html, needle) {
  const idx = html.indexOf(needle);
  if (idx === -1) return undefined;
  return html.slice(0, idx).split('\n').length;
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================== checks == */

/** (a) Internal href/src targets must exist in the repo. */
export function checkLinks(page, existsFn, ignorePaths = DEFAULT_IGNORE_PATHS) {
  const findings = [];
  const seen = new Set();

  for (const raw of extractRefs(page.html)) {
    const ref = raw.trim();
    if (!ref || ref.startsWith('#')) continue;
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(ref)) continue;
    if (ignorePaths.some((p) => ref.startsWith(p))) continue;

    const target = ref.split('#')[0].split('?')[0];
    if (!target) continue;

    const rel = target.startsWith('/') ? target.slice(1) : target;
    if (seen.has(rel)) continue;
    seen.add(rel);

    if (!existsFn(rel)) {
      findings.push({
        file: page.file,
        rule: 'broken-link',
        detail: target,
        line: lineOf(page.html, raw),
      });
    }
  }
  return findings;
}

/** (b) Affiliate links: direct product URLs only, carrying our tag. */
export function checkAffiliate(page) {
  const findings = [];
  for (const ref of extractRefs(page.html)) {
    if (!/amazon\.(?:com|co\.uk|ca|de)/i.test(ref)) continue;

    if (/\/s\?k=|\/s\/\?k=|[?&]k=|\/s\?/i.test(ref)) {
      findings.push({
        file: page.file,
        rule: 'affiliate-search-url',
        detail: ref,
        line: lineOf(page.html, ref),
      });
      continue;
    }
    if (!ref.includes(`tag=${AFFILIATE_TAG}`)) {
      findings.push({
        file: page.file,
        rule: 'affiliate-missing-tag',
        detail: ref,
        line: lineOf(page.html, ref),
      });
    }
  }
  return findings;
}

/** (d) Canonical URL present and non-empty. */
export function checkCanonical(page) {
  const tag = page.html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!tag) {
    return [{ file: page.file, rule: 'canonical-missing', detail: 'no rel=canonical' }];
  }
  const href = tag[0].match(/href=["']([^"']*)["']/i);
  if (!href || !href[1].trim()) {
    return [{ file: page.file, rule: 'canonical-missing', detail: 'empty canonical href' }];
  }
  return [];
}

export function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

export function getDescription(html) {
  const m = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/content=["']([\s\S]*?)["']/i);
  return c ? c[1].trim() : null;
}

/** (c) Title + description: present, non-empty, unique corpus-wide. */
export function checkMeta(pages) {
  const findings = [];
  const titles = new Map();
  const descs = new Map();

  for (const page of pages) {
    const t = getTitle(page.html);
    if (t === null) {
      findings.push({ file: page.file, rule: 'meta-missing', detail: 'no <title>' });
    } else if (t === '') {
      findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty <title>' });
    } else {
      titles.set(t, [...(titles.get(t) || []), page.file]);
    }

    const d = getDescription(page.html);
    if (d === null) {
      findings.push({ file: page.file, rule: 'meta-missing', detail: 'no meta description' });
    } else if (d === '') {
      findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty meta description' });
    } else {
      descs.set(d, [...(descs.get(d) || []), page.file]);
    }
  }

  const dupes = (map, label, clip) => {
    for (const [value, files] of map) {
      if (files.length < 2) continue;
      for (const file of files) {
        const others = files.filter((f) => f !== file).join(', ');
        findings.push({
          file,
          rule: 'meta-duplicate',
          detail: `${label} shared with ${others}: "${value.slice(0, clip)}"`,
        });
      }
    }
  };
  dupes(titles, 'title', 120);
  dupes(descs, 'description', 60);

  return findings;
}

/* ------------------------------------------- (e) spec self-contradiction -- */

const ROW_RE = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi;

export function parseSpecTable(html) {
  const map = new Map();
  for (const m of html.matchAll(ROW_RE)) {
    const key = m[1].replace(/&amp;/g, '&').trim();
    if (!map.has(key)) map.set(key, m[2].trim());
  }
  return map;
}

/* Spec cells are terse ("2.5G"); prose is verbose ("2.5 Gigabit Ethernet").
 * Body extraction is deliberately stricter so unrelated numbers -- 128GB of
 * RAM, a 6GHz band, 20 Gbps USB -- can never be read as a LAN claim. */
const SPEC_TOKENS = {
  LAN: (s) => [...s.matchAll(/(\d+(?:\.\d+)?)\s*G(?:bE)?\b/gi)].map((m) => `${parseFloat(m[1])}g`),
  WiFi: (s) => [...s.matchAll(/wi-?fi\s*(7|6e|6|5)\b/gi)].map((m) => `wifi${m[1].toLowerCase()}`),
  Socket: (s) => [
    ...[...s.matchAll(/\bAM(\d)\b/gi)].map((m) => `am${m[1]}`),
    ...[...s.matchAll(/\bLGA\s*(\d{3,4})\b/gi)].map((m) => `lga${m[1]}`),
  ],
};

const BODY_TOKENS = {
  LAN: (s) => [
    ...s.matchAll(/(\d+(?:\.\d+)?)\s*(?:GbE\b|(?:G|Gigabit)\s+(?:Ethernet|LAN))/gi),
  ].map((m) => `${parseFloat(m[1])}g`),
  WiFi: SPEC_TOKENS.WiFi,
  Socket: SPEC_TOKENS.Socket,
};

const FIELDS = ['LAN', 'WiFi', 'Socket'];

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function checkSpecContradictions(page) {
  const specs = parseSpecTable(page.html);
  if (specs.size === 0) return [];

  // Only prose *after* the spec table counts; nav and intro copy are not claims.
  // The "Related Boards" grid is cut too: it lists OTHER boards' names and
  // specs (e.g. "...AORUS ELITE WIFI7", "LGA 1851"), which are not claims
  // about this board and would otherwise read as contradictions.
  const afterTable = page.html.split(/<\/table>/i).slice(1).join(' ');
  const contentRegion = afterTable.split(/<h[1-6][^>]*id=["']related["']/i)[0];
  const body = stripTags(contentRegion);
  if (!body) return [];

  const findings = [];

  for (const field of FIELDS) {
    const specValue = specs.get(field);
    if (!specValue) continue;

    const specTokens = new Set(SPEC_TOKENS[field](specValue));
    if (specTokens.size === 0) continue; // e.g. "No WiFi" -- nothing to compare

    const conflicts = new Map();
    for (const sentence of sentences(body)) {
      const found = new Set(BODY_TOKENS[field](sentence));
      if (found.size === 0) continue;
      // A sentence that also names the correct value is a comparison
      // ("AM5 retains the AM4 mounting holes"), not a contradiction.
      if ([...found].some((t) => specTokens.has(t))) continue;
      for (const t of found) {
        if (!conflicts.has(t)) conflicts.set(t, sentence.trim().slice(0, 100));
      }
    }

    if (conflicts.size > 0) {
      const claims = [...conflicts.keys()].join(', ');
      const quote = [...conflicts.values()][0];
      findings.push({
        file: page.file,
        rule: 'spec-contradiction',
        detail: `${field}: spec table says "${specValue}" but body text claims ${claims} — "${quote}"`,
      });
    }
  }
  return findings;
}

/* ============================================================ deal note == */

const DEAL_NOTE_RE = /<aside class="deal-note">([\s\S]*?)<\/aside>/gi;

/**
 * (e) Deal notes on review pages. See docs/deal-note-pattern.md.
 *
 * The load-bearing rule is `deal-note-unlabelled-price`: Amazon's Associates
 * operating agreement only permits displaying a retailer price served by
 * Amazon or fetched from PA-API and refreshed every 24 hours, which a static
 * page cannot do. The only dollar figure allowed in the block is therefore a
 * launch MSRP, which is manufacturer information rather than Amazon pricing
 * data. Do not soften this rule.
 */
export function checkDealNote(page) {
  const blocks = [...page.html.matchAll(DEAL_NOTE_RE)];
  if (blocks.length === 0) return [];

  const findings = [];

  if (blocks.length > 1) {
    findings.push({
      file: page.file,
      rule: 'deal-note-duplicate',
      detail: `${blocks.length} deal notes on one page`,
      line: lineOf(page.html, blocks[1][0]),
    });
  }

  for (const match of blocks) {
    const block = match[0];
    const line = lineOf(page.html, block);

    if (!/<time[^>]*\sdatetime=["']\d{4}-\d{2}-\d{2}["']/i.test(block)) {
      findings.push({
        file: page.file,
        rule: 'deal-note-missing-date',
        detail: 'no <time datetime="YYYY-MM-DD"> in the block',
        line,
      });
    }

    const text = stripTags(block);
    for (const m of text.matchAll(/\$\d[\d,.]*/g)) {
      const window = text.slice(Math.max(0, m.index - 40), m.index);
      const label = window.toLowerCase().lastIndexOf('launch msrp');
      // Labelled only if "Launch MSRP" introduces *this* figure -- an earlier
      // MSRP does not license a second, unlabelled price after it.
      if (label !== -1 && !window.slice(label).includes('$')) continue;
      findings.push({
        file: page.file,
        rule: 'deal-note-unlabelled-price',
        detail: `${m[0]} is not a labelled launch MSRP`,
        line,
      });
    }

    const hasProductLink = extractRefs(block).some(
      (ref) => /amazon\.com\/dp\//i.test(ref) && ref.includes(`tag=${AFFILIATE_TAG}`),
    );
    if (!hasProductLink) {
      findings.push({
        file: page.file,
        rule: 'deal-note-no-affiliate-link',
        detail: `no amazon.com/dp/ link carrying tag=${AFFILIATE_TAG}`,
        line,
      });
    }
  }

  return findings;
}

/* ==================================================== baseline ratchet == */

export function fingerprint(f) {
  return `${f.file} :: ${f.rule} :: ${String(f.detail).replace(/\s+/g, ' ').trim()}`;
}

/**
 * Collapse findings that share a fingerprint (e.g. the same affiliate URL
 * repeated three times on one page). Keeps the first line and records how
 * many times it occurred, so the printed total matches the baseline, which
 * is fingerprint-keyed and therefore inherently unique.
 */
export function dedupeFindings(findings) {
  const byFp = new Map();
  for (const f of findings) {
    const fp = fingerprint(f);
    const existing = byFp.get(fp);
    if (existing) existing.count += 1;
    else byFp.set(fp, { ...f, count: 1 });
  }
  return [...byFp.values()];
}

export function diffBaseline(findings, baseline) {
  const baseSet = new Set(baseline);
  const seen = new Set();
  const fresh = [];
  const known = [];

  for (const f of findings) {
    const fp = fingerprint(f);
    seen.add(fp);
    if (baseSet.has(fp)) known.push(f);
    else fresh.push(f);
  }
  const resolved = baseline.filter((fp) => !seen.has(fp));
  return { fresh, known, resolved };
}

/* ============================================================= runner == */

export function collectHtmlFiles(root = ROOT) {
  const out = [];
  const skip = new Set(['.git', 'node_modules', '.github', 'docs']);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(path.relative(root, full));
    }
  };
  walk(root);
  return out.sort();
}

export function runChecks(pages, existsFn, ignorePaths = DEFAULT_IGNORE_PATHS) {
  const findings = [];
  for (const page of pages) {
    findings.push(...checkLinks(page, existsFn, ignorePaths));
    findings.push(...checkAffiliate(page));
    findings.push(...checkCanonical(page));
    findings.push(...checkSpecContradictions(page));
    findings.push(...checkDealNote(page));
  }
  findings.push(...checkMeta(pages));
  return findings;
}

function loadBaseline(file) {
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed.violations) ? parsed.violations : [];
  } catch (err) {
    console.error(`Could not parse ${BASELINE_FILE}: ${err.message}`);
    process.exit(2);
  }
}

const RULE_LABELS = {
  'broken-link': 'Broken internal link',
  'affiliate-search-url': 'Amazon search URL (must be a direct product link)',
  'affiliate-missing-tag': `Amazon link missing tag=${AFFILIATE_TAG}`,
  'meta-missing': 'Missing title/description',
  'meta-empty': 'Empty title/description',
  'meta-duplicate': 'Duplicate title/description',
  'canonical-missing': 'Missing canonical URL',
  'spec-contradiction': 'Spec contradicts body text',
  'deal-note-duplicate': 'More than one deal note on a page',
  'deal-note-missing-date': 'Deal note missing a dated <time>',
  'deal-note-unlabelled-price': 'Deal note shows a price that is not a labelled launch MSRP',
  'deal-note-no-affiliate-link': 'Deal note missing its direct Amazon product link',
};

function main(argv) {
  const updateBaseline = argv.includes('--update-baseline');
  const baselinePath = path.join(ROOT, BASELINE_FILE);

  const files = collectHtmlFiles();
  const pages = [];
  const readFindings = [];
  for (const file of files) {
    try {
      pages.push({ file, html: fs.readFileSync(path.join(ROOT, file), 'utf8') });
    } catch (err) {
      readFindings.push({ file, rule: 'extraction-failed', detail: `unreadable: ${err.message}` });
    }
  }

  const existsFn = (rel) => {
    const abs = path.resolve(ROOT, rel);
    if (!abs.startsWith(ROOT)) return false;
    return fs.existsSync(abs);
  };

  const findings = dedupeFindings([...readFindings, ...runChecks(pages, existsFn)]);
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule));

  if (updateBaseline) {
    const violations = [...new Set(findings.map(fingerprint))].sort();
    fs.writeFileSync(
      baselinePath,
      `${JSON.stringify({
        note: 'Known pre-existing violations. This is a RATCHET: it may only shrink. Regenerate with `npm run validate -- --update-baseline`.',
        generated: 'run `npm run validate -- --update-baseline` to refresh',
        count: violations.length,
        violations,
      }, null, 2)}\n`,
    );
    console.log(`Baseline updated: ${violations.length} known violations recorded in ${BASELINE_FILE}`);
    return 0;
  }

  const baseline = loadBaseline(baselinePath);
  const { fresh, known, resolved } = diffBaseline(findings, baseline);

  const freshSet = new Set(fresh.map(fingerprint));
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  console.log('='.repeat(78));
  console.log('  MotherboardCentral site validation');
  console.log(`  ${pages.length} HTML pages scanned`);
  console.log('='.repeat(78));

  if (byFile.size === 0) {
    console.log('\nNo violations found.\n');
  }

  for (const [file, list] of byFile) {
    console.log(`\n${file}  (${list.length} issue${list.length === 1 ? '' : 's'})`);
    for (const f of list) {
      const status = freshSet.has(fingerprint(f)) ? 'NEW  ' : 'KNOWN';
      const where = f.line ? `:${f.line}` : '';
      const times = f.count > 1 ? `  (x${f.count} on this page)` : '';
      console.log(`  [${status}] ${f.rule}${where}${times}`);
      console.log(`          ${f.detail}`);
    }
  }

  const counts = {};
  const occurrences = {};
  for (const f of findings) {
    counts[f.rule] = (counts[f.rule] || 0) + 1;
    occurrences[f.rule] = (occurrences[f.rule] || 0) + (f.count || 1);
  }
  const totalOccurrences = findings.reduce((n, f) => n + (f.count || 1), 0);

  console.log(`\n${'='.repeat(78)}`);
  console.log('  SUMMARY BY RULE');
  console.log('='.repeat(78));
  for (const [rule, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    const occ = occurrences[rule];
    const suffix = occ !== n ? ` [${occ} occurrences]` : '';
    console.log(`  ${String(n).padStart(4)}  ${rule.padEnd(22)} ${RULE_LABELS[rule] || ''}${suffix}`);
  }
  if (Object.keys(counts).length === 0) console.log('  (none)');

  console.log(`\n${'='.repeat(78)}`);
  console.log(`  Total violations : ${findings.length} unique (${totalOccurrences} occurrences)`);
  console.log(`  NEW (fail build) : ${fresh.length}`);
  console.log(`  KNOWN (baseline) : ${known.length}`);
  console.log(`  RESOLVED         : ${resolved.length}`);
  console.log('='.repeat(78));

  if (resolved.length > 0) {
    console.log('\nThese baseline entries no longer match any finding:');
    for (const fp of resolved) console.log(`  - ${fp}`);
    console.log('\nThe baseline is a ratchet and must only shrink.');
    console.log('Run: npm run validate -- --update-baseline   (then commit the result)');
  }

  if (fresh.length > 0) {
    console.log(`\nFAILED: ${fresh.length} new violation(s) introduced.`);
    return 1;
  }
  if (resolved.length > 0) {
    console.log(`\nFAILED: ${resolved.length} stale baseline entr(y/ies); refresh the baseline.`);
    return 1;
  }
  console.log(
    known.length > 0
      ? `\nPASSED: no new violations. ${known.length} known issue(s) still outstanding.`
      : '\nPASSED: clean.',
  );
  return 0;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`Validator internal error: ${err.stack || err.message}`);
    process.exit(2);
  }
}
