/**
 * The contract between job prompts and the permission allowlist.
 *
 * This is the test issue #100 needed and did not have.
 *
 * jobs/pr-unblocker.md was written in terms of `gh pr checkout`, `git merge`,
 * `gh pr comment` and `gh pr close` -- none of which .claude/settings.json
 * permitted. The job ran on schedule, diagnosed the queue correctly, healed
 * nothing, and left no trace on the PRs it failed to touch. Four conflicted
 * PRs sat for weeks. A human reading the queue found it; no alarm did.
 *
 * A job prompt and the allowlist are two halves of one contract, and nothing
 * bound them. This binds them: every shell verb a prompt instructs an agent to
 * run must be permitted, and every label a job writes must be a label some job
 * reads.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './paths.mjs';
import { config } from './config.mjs';

const JOBS = path.join(ROOT, 'jobs');

const promptFiles = () =>
  fs
    .readdirSync(JOBS)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const ALLOW = settings.permissions.allow;

/* ---------------------------------------------------------- verb parsing -- */

/**
 * Commands a prompt tells the agent to run. Matched on the tools the harness
 * actually drives -- gh, git, npm -- taking the first two words, which is the
 * granularity settings.json allows at (`Bash(gh pr merge:*)`).
 */
export function verbsIn(text) {
  const found = new Set();
  // HTML comments are notes to maintainers, not instructions to the agent: the
  // generated-by header says "run `npm run jobs`", which no agent ever does.
  // Everything else in these prompts is terse and imperative, so each remaining
  // occurrence is something the agent is being told to run.
  const instructions = text.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of instructions.matchAll(/\b(gh|git|npm)\s+([a-z-]+)(?:\s+([a-z-]+))?/g)) {
    const [, tool, first, second] = m;
    if (tool === 'gh') {
      // gh has two-word subcommands: `gh pr merge`, `gh issue create`.
      found.add(second ? `gh ${first} ${second}` : `gh ${first}`);
    } else if (tool === 'npm') {
      found.add(first === 'run' && second ? `npm run ${second}` : `npm ${first}`);
    } else {
      found.add(`git ${first}`);
    }
  }
  return found;
}

/** Does the allowlist permit this command? */
export function isAllowed(verb) {
  return ALLOW.some((entry) => {
    const m = entry.match(/^Bash\((.*?)(:\*)?\)$/);
    if (!m) return false;
    const allowed = m[1];
    return verb === allowed || verb.startsWith(`${allowed} `) || allowed.startsWith(`${verb} `);
  });
}

/* ------------------------------------------------------------- the tests -- */

test('every command a job prompt issues is permitted by settings.json', () => {
  const violations = [];

  for (const file of promptFiles()) {
    const text = fs.readFileSync(path.join(JOBS, file), 'utf8');
    for (const verb of verbsIn(text)) {
      if (!isAllowed(verb)) violations.push(`jobs/${file}: "${verb}"`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    'These job steps cannot run -- add them to .claude/settings.json or drop them ' +
      `from the prompt:\n  ${violations.join('\n  ')}`,
  );
});

test('the verbs #100 was blocked on are all permitted', () => {
  // Regression test for #100 itself, named so a future failure is legible.
  // Asserted against the allowlist rather than the prompt's wording: the job
  // describes some steps in prose ("comment your findings on the PR"), and the
  // gap that broke it was in settings.json, not in how the step was phrased.
  for (const verb of ['gh pr checkout', 'git fetch', 'git merge', 'gh pr comment', 'gh pr close', 'gh issue reopen']) {
    assert.ok(isAllowed(verb), `#100 regression: pr-unblocker needs '${verb}' and it is not allowed`);
  }
});

test("the reviewer's loop guards can actually close an issue", () => {
  // Found by this suite on the run that introduced it: reviewer.md closes
  // issues in three places -- the third-failed-cycle guard, the triage
  // unverifiable path, and the planner-bounce guard -- but `gh issue close`
  // was missing from settings.json, so every one of them was inert. Same
  // failure class as #100, caught by mechanism this time rather than by a
  // human reading the queue.
  const text = fs.readFileSync(path.join(JOBS, 'reviewer.md'), 'utf8');
  assert.match(text, /gh issue close/, 'reviewer no longer closes issues; drop this test if deliberate');
  assert.ok(isAllowed('gh issue close'), 'reviewer.md closes issues but settings.json does not allow it');
});

/* ------------------------------------------------------ the label circuit -- */

const LABELS = Object.values(config.labels);

/** Labels a prompt writes: --label X, --add-label X, --remove-label X. */
function labelsWritten(text) {
  const found = new Set();
  for (const m of text.matchAll(/--(?:add-|remove-)?label\s+([a-z-]+|<[^>]+>)/g)) {
    const raw = m[1];
    if (raw.startsWith('<')) {
      for (const part of raw.slice(1, -1).split('|')) if (LABELS.includes(part)) found.add(part);
    } else if (LABELS.includes(raw)) {
      found.add(raw);
    }
  }
  return found;
}

test('every label a job writes is a label the manifest declares', () => {
  const unknown = [];
  for (const file of promptFiles()) {
    const text = fs.readFileSync(path.join(JOBS, file), 'utf8');
    for (const m of text.matchAll(/--(?:add-|remove-)?label\s+([a-z][a-z-]+)/g)) {
      if (!LABELS.includes(m[1])) unknown.push(`jobs/${file}: ${m[1]}`);
    }
  }
  assert.deepEqual(unknown, [], `labels used by jobs but absent from harness.config.json:\n  ${unknown.join('\n  ')}`);
});

test('every label written by some job is read by some job', () => {
  // An orphan label is a queue nothing drains. `agent-drafted` was exactly
  // that: defined in the repo, referenced by zero jobs, carried by zero issues.
  const written = new Set();
  const mentioned = new Set();

  for (const file of promptFiles()) {
    const text = fs.readFileSync(path.join(JOBS, file), 'utf8');
    for (const l of labelsWritten(text)) written.add(l);
    for (const l of LABELS) if (text.includes(l)) mentioned.add(l);
  }

  for (const label of written) {
    assert.ok(mentioned.has(label), `'${label}' is written but no job consumes it`);
  }
});

test('every declared label is reachable from some job', () => {
  const all = promptFiles()
    .map((f) => fs.readFileSync(path.join(JOBS, f), 'utf8'))
    .join('\n');

  for (const [slot, label] of Object.entries(config.labels)) {
    assert.ok(all.includes(label), `labels.${slot} = '${label}' is declared but no job mentions it`);
  }
});
