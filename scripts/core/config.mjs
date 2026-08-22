/**
 * The slot manifest, loaded.
 *
 * ## Why this read is synchronous, and why that is the whole design
 *
 * Rule modules build their label strings when the module is evaluated:
 *
 *     export const rule = {
 *       labels: { 'affiliate-missing-tag': `Amazon link missing tag=${TAG}` },
 *     };
 *
 * That template literal runs at import time, not call time. validate.mjs then
 * folds every rule's labels into RULE_LABELS, also at import time. So config
 * has to be populated before any rule module body executes -- a value assigned
 * later would leave a stale string baked into the report.
 *
 * ESM guarantees exactly that ordering for a synchronous read: imports are
 * resolved depth-first and each module body runs to completion before the
 * module that imported it. Because rules.site/affiliate.mjs imports this file,
 * this file's body -- including the readFileSync below -- has already finished
 * by the time affiliate.mjs builds its labels.
 *
 * The alternative shapes both fail here. An async load (`await readFile`)
 * cannot complete before a synchronous module body. A setter called from
 * main() runs long after every label is frozen. Synchronous top-level read is
 * the one shape that wins the race, so it is deliberate rather than lazy.
 *
 * ## Scope
 *
 * core/ may read config; that is not a seam violation. The seam bans hardcoded
 * site vocabulary, and config is the mechanism that removes it.
 */

import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './paths.mjs';

export const CONFIG_FILE = 'harness.config.json';

/** Keys that must exist, as dotted paths, with the type each must have. */
const REQUIRED = [
  ['site.name', 'string'],
  ['site.host', 'string'],
  ['site.url', 'string'],
  ['git.defaultBranch', 'string'],
  ['git.branchPrefix', 'string'],
  ['labels.ok', 'string'],
  ['labels.plan', 'string'],
  ['labels.planReview', 'string'],
  ['labels.review', 'string'],
  ['tripwire.maxFiles', 'number'],
  ['validator.baselineFile', 'string'],
  ['validator.ignorePaths', 'object'],
  ['validator.skipDirs', 'object'],
  ['validator.affiliate.tag', 'string'],
  ['validator.affiliate.hostPattern', 'string'],
  ['validator.affiliate.searchUrlPattern', 'string'],
  ['validator.pageShape.specTableRowPattern', 'string'],
  ['validator.pageShape.relatedSectionId', 'string'],
  ['validator.specFields', 'object'],
];

const dig = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

/** Recursively freeze, so a rule cannot mutate config and affect another. */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/**
 * Read and validate a config file. Exported so tests can load a fixture
 * without reaching for the real one.
 */
export function loadConfig(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read ${CONFIG_FILE} at ${file}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${CONFIG_FILE} is not valid JSON: ${err.message}`);
  }

  const missing = [];
  for (const [dotted, type] of REQUIRED) {
    const value = dig(parsed, dotted);
    if (value === undefined || value === null) missing.push(`${dotted} (missing)`);
    else if (typeof value !== type) missing.push(`${dotted} (expected ${type}, got ${typeof value})`);
  }
  if (missing.length > 0) {
    // Fail closed and loudly. A config that silently half-loads would produce
    // a validator that checks the wrong things while reporting success.
    throw new Error(`${CONFIG_FILE} is incomplete:\n  - ${missing.join('\n  - ')}`);
  }

  return deepFreeze(parsed);
}

/** HARNESS_CONFIG lets a test or a second site point at another manifest. */
const configPath = process.env.HARNESS_CONFIG
  ? path.resolve(process.env.HARNESS_CONFIG)
  : path.join(ROOT, CONFIG_FILE);

export const config = loadConfig(configPath);

/* ---------------------------------------------------------- conveniences -- */

/** Build a RegExp from a config-held pattern string. */
export const re = (pattern, flags = '') => new RegExp(pattern, flags);
