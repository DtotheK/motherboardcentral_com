/**
 * Architectural guard for the core / rules / rules.site split.
 *
 * The split only has value if it stays true. docs/harness-audit-2026-08.md
 * records what happens otherwise: the eight scout prompts shared a seven-line
 * preamble maintained by copy-paste, and it drifted -- ux-audit.md quietly lost
 * a rule the other seven kept. A boundary nothing checks is a boundary that
 * erodes.
 *
 * So this asserts the seam mechanically rather than trusting convention:
 * site vocabulary may appear in rules.site/, and nowhere else under core/ or
 * rules/. When the harness is cut into a template, `rules.site/` is the
 * directory a new site replaces, and these tests are what prove the rest came
 * over clean.
 *
 * Comments are stripped before matching, so prose explaining why a boundary
 * exists is not read as a violation of it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REGISTRY, RULE_LABELS } from '../validate.mjs';

const SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Non-test .mjs files directly inside `dir`. */
function modulesIn(dir) {
  const full = path.join(SCRIPTS, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
    .map((f) => `${dir}/${f}`)
    .sort();
}

/** File contents with line and block comments removed. */
function code(rel) {
  return fs
    .readFileSync(path.join(SCRIPTS, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}

/** Vocabulary that only means something on a motherboard site. */
const SITE_VOCABULARY = [
  /amazon/i,
  /motherboardcentral/i,
  /\bLGA\b/,
  /wi-?fi/i,
  /\bAM\(\\d\)|\bAM[45]\b/,
  /\bGbE\b/,
  /Gigabit/i,
];

/* ------------------------------------------------------------- the seam -- */

test('core/ contains no site vocabulary', () => {
  for (const mod of modulesIn('core')) {
    const src = code(mod);
    for (const pattern of SITE_VOCABULARY) {
      assert.doesNotMatch(src, pattern, `${mod} must stay site-agnostic, but matches ${pattern}`);
    }
  }
});

test('rules/ contains no site vocabulary', () => {
  for (const mod of modulesIn('rules')) {
    const src = code(mod);
    for (const pattern of SITE_VOCABULARY) {
      assert.doesNotMatch(src, pattern, `${mod} is a universal rule, but matches ${pattern}`);
    }
  }
});

test('core/ never imports from rules/ or rules.site/', () => {
  // Dependencies point inward only: rules depend on core, never the reverse.
  for (const mod of modulesIn('core')) {
    assert.doesNotMatch(code(mod), /from\s+['"]\.\.\/rules/, `${mod} must not depend on any rule`);
  }
});

test('universal rules never import from rules.site/', () => {
  for (const mod of modulesIn('rules')) {
    assert.doesNotMatch(
      code(mod),
      /from\s+['"]\.\.\/rules\.site/,
      `${mod} must not depend on site-specific code`,
    );
  }
});

test('rules.site/ holds the site bindings, and holds them alone', () => {
  const siteModules = modulesIn('rules.site');
  assert.ok(siteModules.length > 0, 'expected site-specific rules to exist');

  const all = siteModules.map(code).join('\n');
  assert.match(all, /amazon/i, 'the affiliate binding belongs in rules.site/');
  assert.match(all, /wi-?fi/i, 'the spec vocabulary belongs in rules.site/');
});

/* ---------------------------------------------------------- the registry -- */

test('every registry entry is well formed', () => {
  for (const rule of REGISTRY) {
    assert.equal(typeof rule.id, 'string', 'a rule needs an id');
    assert.ok(['page', 'corpus'].includes(rule.scope), `${rule.id}: scope must be page or corpus`);
    assert.equal(typeof rule.run, 'function', `${rule.id}: run must be a function`);
    assert.ok(
      rule.labels && Object.keys(rule.labels).length > 0,
      `${rule.id}: must label every rule id it can emit`,
    );
  }
});

test('registry order is the order findings are reported in', () => {
  // Load-bearing: main() sorts by (file, rule) with a stable sort, so findings
  // sharing a file and a rule keep insertion order in the printed report.
  assert.deepEqual(
    REGISTRY.map((r) => r.id),
    ['links', 'affiliate', 'canonical', 'spec-contradiction', 'meta'],
  );
});

test('corpus rules run after every page rule', () => {
  const firstCorpus = REGISTRY.findIndex((r) => r.scope === 'corpus');
  const lastPage = REGISTRY.findLastIndex((r) => r.scope === 'page');
  assert.ok(firstCorpus > lastPage, 'page rules must all precede corpus rules in the registry');
});

test('rule ids are unique', () => {
  const ids = REGISTRY.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'two rules share an id');
});

test('every emitted rule id has a human label', () => {
  // The report prints RULE_LABELS[f.rule]; a missing entry degrades silently
  // to a blank column rather than failing, so assert it here instead.
  for (const rule of REGISTRY) {
    for (const id of Object.keys(rule.labels)) {
      assert.ok(RULE_LABELS[id], `no label registered for rule id '${id}'`);
    }
  }
  assert.ok(RULE_LABELS['extraction-failed'], 'the read-failure pseudo-rule needs a label too');
});
