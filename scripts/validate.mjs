#!/usr/bin/env node
/**
 * MotherboardCentral site validator.
 *
 * This file is three things:
 *
 *   1. The rule REGISTRY -- which checks run, in which order, at which scope.
 *   2. The CLI: collect pages, run the registry, diff against the baseline,
 *      print the report, choose an exit code.
 *   3. A re-export facade. Twelve per-page test files import extraction helpers
 *      from here, so the module split below stayed behind this surface: every
 *      symbol this file exported before it still exports now. Import from the
 *      specific module in new code; these re-exports exist so the split needed
 *      no changes to the payload tests.
 *
 * The split, per docs/harness-audit-2026-08.md:
 *
 *   core/       extraction, collection, ratchet -- no site vocabulary at all
 *   rules/      universal checks: links, meta, canonical
 *   rules.site/ motherboard-only: affiliate tags, spec contradictions
 *
 * Zero dependencies by design: CLAUDE.md forbids introducing frameworks or
 * build tooling, so extraction is regex over uniform machine-generated markup.
 * Where extraction finds nothing it reports `extraction-failed` rather than
 * passing silently, because a validator that fails open is worse than none.
 *
 * Usage:
 *   node scripts/validate.mjs                    # validate, exit 1 on violations
 *   node scripts/validate.mjs --update-baseline  # re-record known debt
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT, collectHtmlFiles } from './core/collect.mjs';
import { config } from './core/config.mjs';
import { fingerprint, dedupeFindings, diffBaseline } from './core/ratchet.mjs';
import {
  extractRefs,
  lineOf,
  stripTags,
  getTitle,
  getDescription,
  parseSpecTable,
} from './core/extract.mjs';

import { rule as linksRule, checkLinks, DEFAULT_IGNORE_PATHS } from './rules/links.mjs';
import { rule as canonicalRule, checkCanonical } from './rules/canonical.mjs';
import { rule as metaRule, checkMeta } from './rules/meta.mjs';
import { rule as affiliateRule, checkAffiliate, AFFILIATE_TAG } from './rules.site/affiliate.mjs';
import {
  rule as specRule,
  checkSpecContradictions,
} from './rules.site/spec-contradiction.mjs';

export const BASELINE_FILE = config.validator.baselineFile;

/* ============================================================ registry == */

/**
 * Order is load-bearing. main() sorts findings by (file, rule) with a stable
 * sort, so two findings sharing a file and a rule keep their insertion order in
 * the printed report. Page rules run first, in this order, for each page; then
 * corpus rules run once over every page. scripts/core/pipeline.test.mjs pins it.
 */
export const REGISTRY = [linksRule, affiliateRule, canonicalRule, specRule, metaRule];

/** Every rule id a registry entry can emit, mapped to its human label. */
export const RULE_LABELS = Object.assign(
  { 'extraction-failed': 'File could not be read' },
  ...REGISTRY.map((r) => r.labels),
);

export function runChecks(pages, existsFn, ignorePaths = DEFAULT_IGNORE_PATHS) {
  const ctx = { existsFn, ignorePaths };
  const findings = [];

  for (const page of pages) {
    for (const rule of REGISTRY) {
      if (rule.scope === 'page') findings.push(...rule.run(page, ctx));
    }
  }
  for (const rule of REGISTRY) {
    if (rule.scope === 'corpus') findings.push(...rule.run(pages, ctx));
  }
  return findings;
}

/* ============================================================== facade == */

export {
  // core/extract
  extractRefs,
  lineOf,
  stripTags,
  getTitle,
  getDescription,
  parseSpecTable,
  // core/collect
  collectHtmlFiles,
  ROOT,
  // core/config
  config,
  // core/ratchet
  fingerprint,
  dedupeFindings,
  diffBaseline,
  // rules
  checkLinks,
  DEFAULT_IGNORE_PATHS,
  checkCanonical,
  checkMeta,
  // rules.site
  checkAffiliate,
  AFFILIATE_TAG,
  checkSpecContradictions,
};

/* ================================================================= CLI == */

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
