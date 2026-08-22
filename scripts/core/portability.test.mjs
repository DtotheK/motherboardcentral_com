/**
 * Portability guards.
 *
 * The harness is meant to become a template, and a template that only runs on
 * one CI image is not a template. These pin the three host assumptions found in
 * docs/harness-audit-2026-08.md (failure mode 10), each of which produced real
 * failures on a Windows checkout while CI stayed green on ubuntu-latest:
 *
 *   1. new URL(..).pathname yields "/C:/Users/.." on Windows, so path.join()
 *      then builds "C:\C:\Users\..". fileURLToPath() is the correct idiom.
 *   2. .gitattributes left .js/.html/.css/.json on bare `text=auto`, so a
 *      Windows checkout produced CRLF and every fixture matching on \n broke.
 *   3. run-job.sh shelled out to jq, which package.json never declared.
 *
 * These are lint-style tests over the repo's own source. They are deliberately
 * NOT scoped to a snapshot of today's file list -- they walk what exists now,
 * so a new file inherits the guard automatically.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Every tracked .mjs/.js under the harness dirs, excluding dot-dirs. */
function sourceFiles(dirs = ['scripts', 'jobs']) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.m?js$/.test(entry.name)) out.push(path.relative(ROOT, full));
    }
  };
  for (const d of dirs) walk(path.join(ROOT, d));
  return out.sort();
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* ------------------------------------------------- 1. the path idiom ban -- */

test('no source file derives a filesystem path from import.meta.url.pathname', () => {
  // On Windows this yields "/C:/Users/..", which path.join() turns into
  // "C:\C:\Users\..". fileURLToPath() handles the drive letter correctly.
  const offenders = sourceFiles().filter((f) => /import\.meta\.url\s*\)\s*\.pathname/.test(read(f)));

  assert.deepEqual(
    offenders,
    [],
    `use fileURLToPath(import.meta.url) instead of .pathname in:\n  ${offenders.join('\n  ')}`,
  );
});

test('every source file that needs a root path imports fileURLToPath', () => {
  const offenders = sourceFiles().filter((f) => {
    const src = read(f);
    return /import\.meta\.url/.test(src) && !/fileURLToPath/.test(src) && !/new URL\([^)]*import\.meta\.url\)(?!\s*\.)/.test(src);
  });

  assert.deepEqual(offenders, [], `resolve import.meta.url via fileURLToPath in:\n  ${offenders.join('\n  ')}`);
});

/* ---------------------------------------------------- 2. line endings -- */

test('.gitattributes pins text files to LF on checkout', () => {
  const attrs = read('.gitattributes');

  // `text=auto eol=lf`, not bare `text eol=lf`: bare `text` would mark the 81
  // binary blobs (png/jpg) as text and corrupt them on checkout. `text=auto`
  // keeps git's binary detection and applies eol only to what it decides is text.
  assert.match(
    attrs,
    /^\*\s+text=auto\s+eol=lf\s*$/m,
    '.gitattributes must declare `* text=auto eol=lf` so every text file checks out LF on all platforms',
  );
  assert.doesNotMatch(
    attrs,
    /^\*\s+text\s+eol=lf\s*$/m,
    'bare `* text eol=lf` would treat binary files as text -- use text=auto',
  );
});

test('files whose fixtures match on \\n contain no carriage returns', () => {
  // js/main.js is the one scripts/compare-url-state.test.mjs string-matches
  // against; index.html is read by several per-page scanners.
  for (const rel of ['js/main.js', 'index.html', 'package.json']) {
    assert.ok(!read(rel).includes('\r'), `${rel} checked out with CRLF; see .gitattributes`);
  }
});

/* ------------------------------------------------ 3. declared toolchain -- */

/** Shell source with comment lines removed, so prose about a tool is not read
 *  as a call to it -- the comment explaining why jq is gone says "jq". */
const runnerCode = () =>
  read('jobs/run-job.sh')
    .split('\n')
    .filter((l) => !/^\s*#/.test(l))
    .join('\n');

test('run-job.sh depends on no undeclared external tools', () => {
  // jq was a hard dependency that package.json never declared; CI passed only
  // because the ubuntu-latest image happens to ship it. Result extraction now
  // runs on node, which engines already requires.
  assert.doesNotMatch(
    runnerCode(),
    /(^|\s|\||\$\()jq\s/m,
    'run-job.sh must not shell out to jq -- use node, which engines declares',
  );
});

test('run-job.sh preflights the tools it does depend on', () => {
  const code = runnerCode();

  assert.match(code, /command -v/, 'run-job.sh should probe for its tools before using them');

  // Asserted on the tool list rather than a literal `command -v git`, so the
  // check survives being written as a loop.
  const preflight = code.match(/for\s+tool\s+in\s+([^\n;]+)/);
  assert.ok(preflight, 'expected a preflight loop naming the required tools');

  const tools = preflight[1].trim().split(/\s+/);
  for (const tool of ['git', 'claude', 'node']) {
    assert.ok(tools.includes(tool), `preflight should cover '${tool}', got: ${tools.join(', ')}`);
  }
});
