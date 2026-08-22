/**
 * Tests for the slot manifest and its loader.
 *
 * The load-order test is the important one. Rules interpolate config values
 * into `rule.labels` at module-evaluation time, so if config were not fully
 * populated before rule modules run, the report would carry stale strings and
 * nothing else would notice. That property is invisible in normal use and
 * would break silently, which is exactly what deserves a test.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { config, loadConfig, CONFIG_FILE, re } from './config.mjs';
import { ROOT } from './paths.mjs';
import { RULE_LABELS, REGISTRY } from '../validate.mjs';
import { AFFILIATE_TAG } from '../rules.site/affiliate.mjs';

/* -------------------------------------------------------- the manifest -- */

test('the real manifest loads and carries this site', () => {
  assert.equal(config.site.host, 'motherboardcentral.com');
  assert.equal(config.validator.affiliate.tag, 'motherboardcentral.com-20');
  assert.deepEqual(config.validator.specFields, ['LAN', 'WiFi', 'Socket']);
});

test('config is deeply frozen, so one rule cannot mutate it for another', () => {
  assert.throws(() => {
    config.validator.affiliate.tag = 'someone-elses-tag-20';
  }, TypeError);
  assert.throws(() => {
    config.validator.ignorePaths.push('/injected');
  }, TypeError);
  assert.equal(config.validator.affiliate.tag, 'motherboardcentral.com-20');
});

/* ------------------------------------------------------ the load order -- */

test('config reaches rule labels, which are built at import time', () => {
  // rules.site/affiliate.mjs writes this label as
  //   `Amazon link missing tag=${AFFILIATE_TAG}`
  // when its module body runs. If config had not finished loading by then,
  // the label would read "tag=undefined" and the validator would still pass.
  assert.equal(AFFILIATE_TAG, config.validator.affiliate.tag);
  assert.equal(
    RULE_LABELS['affiliate-missing-tag'],
    `Amazon link missing tag=${config.validator.affiliate.tag}`,
  );
  assert.doesNotMatch(RULE_LABELS['affiliate-missing-tag'], /undefined/);
});

test('every registry label is a fully resolved string', () => {
  for (const rule of REGISTRY) {
    for (const [id, label] of Object.entries(rule.labels)) {
      assert.equal(typeof label, 'string', `${id}: label must be a string`);
      assert.doesNotMatch(label, /undefined|\[object Object\]/, `${id}: label did not resolve`);
    }
  }
});

/* ---------------------------------------------------------- validation -- */

const withTempConfig = (contents, fn) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-config-'));
  const file = path.join(dir, CONFIG_FILE);
  fs.writeFileSync(file, contents);
  try {
    return fn(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test('a missing file fails loudly, naming the path', () => {
  assert.throws(
    () => loadConfig(path.join(ROOT, 'no-such-config.json')),
    /Cannot read harness\.config\.json/,
  );
});

test('malformed JSON fails loudly rather than half-loading', () => {
  withTempConfig('{ not json', (file) => {
    assert.throws(() => loadConfig(file), /is not valid JSON/);
  });
});

test('an incomplete manifest names every key it is missing', () => {
  withTempConfig(JSON.stringify({ site: { name: 'X' } }), (file) => {
    assert.throws(
      () => loadConfig(file),
      (err) => {
        // Fails closed: a partially-loaded config would give a validator that
        // checks the wrong things while still reporting success.
        assert.match(err.message, /is incomplete/);
        assert.match(err.message, /site\.host \(missing\)/);
        assert.match(err.message, /validator\.affiliate\.tag \(missing\)/);
        return true;
      },
    );
  });
});

test('a key of the wrong type is reported with both types', () => {
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, CONFIG_FILE), 'utf8'));
  base.tripwire.maxFiles = '15';
  withTempConfig(JSON.stringify(base), (file) => {
    assert.throws(() => loadConfig(file), /tripwire\.maxFiles \(expected number, got string\)/);
  });
});

test('a valid alternate manifest loads, which is what a second site does', () => {
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, CONFIG_FILE), 'utf8'));
  base.site = { name: 'Other Site', host: 'other.example', url: 'https://other.example' };
  base.validator.affiliate.tag = 'other-20';
  withTempConfig(JSON.stringify(base), (file) => {
    const other = loadConfig(file);
    assert.equal(other.site.name, 'Other Site');
    assert.equal(other.validator.affiliate.tag, 'other-20');
  });
});

/* ------------------------------------------------------------ patterns -- */

test('config-held patterns compile to the regexes the rules expect', () => {
  const rowRe = re(config.validator.pageShape.specTableRowPattern, 'gi');
  const html = '<tr><td>Socket</td><td>AM5</td></tr>';
  assert.deepEqual([...html.matchAll(rowRe)].map((m) => [m[1], m[2]]), [['Socket', 'AM5']]);

  const host = re(config.validator.affiliate.hostPattern, 'i');
  assert.ok(host.test('https://www.amazon.co.uk/dp/B0'));
  assert.ok(!host.test('https://example.com/dp/B0'));

  const search = re(config.validator.affiliate.searchUrlPattern, 'i');
  assert.ok(search.test('https://www.amazon.com/s?k=board'));
  assert.ok(!search.test('https://www.amazon.com/dp/B0ABCDEFGH?tag=x'));
});

/* ------------------------------------------- no second source of truth -- */

/* ------------------------------------------- the manifest describes reality -- */

/** Composed job prompts. Underscore-prefixed files are shared fragments
 *  (_preamble.scout.md, _rules.enablement.md), not jobs. */
const jobFiles = () =>
  fs
    .readdirSync(path.join(ROOT, 'jobs'))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

test('every label the manifest declares is one the jobs actually use', () => {
  // Guards against dead config. The manifest declares the label vocabulary;
  // step 3 makes the job prompts read it. Until then this keeps the two honest.
  const prompts = jobFiles()
    .map((f) => fs.readFileSync(path.join(ROOT, 'jobs', f), 'utf8'))
    .join('\n');

  for (const [slot, label] of Object.entries(config.labels)) {
    assert.ok(prompts.includes(label), `labels.${slot} = "${label}" is declared but no job uses it`);
  }
});

test('every job the manifest gives a cap to exists', () => {
  const present = new Set(jobFiles().map((f) => f.replace(/\.md$/, '')));

  for (const job of Object.keys(config.caps.byJob)) {
    assert.ok(present.has(job), `caps.byJob names '${job}', but jobs/${job}.md does not exist`);
  }
});

test('every job has a declared cap', () => {
  // The per-run cap is the harness's only rate limit, so a job without one is
  // a job that could file unboundedly.
  for (const file of jobFiles()) {
    const job = file.replace(/\.md$/, '');
    assert.ok(
      Object.hasOwn(config.caps.byJob, job),
      `jobs/${file} has no entry in caps.byJob`,
    );
  }
});

test('the affiliate tag is written down in exactly one place', () => {
  // It used to appear in both rules.site/affiliate.mjs and vs-pages.mjs.
  // Two copies of a site fact is how the generator and the validator drift.
  const tag = config.validator.affiliate.tag;
  const offenders = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.mjs$/.test(entry.name) && !entry.name.endsWith('.test.mjs')) {
        if (fs.readFileSync(full, 'utf8').includes(`'${tag}'`)) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  walk(path.join(ROOT, 'scripts'));

  assert.deepEqual(offenders, [], `read the tag from harness.config.json instead of hardcoding it in:\n  ${offenders.join('\n  ')}`);
});
