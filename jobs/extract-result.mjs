#!/usr/bin/env node
/**
 * Pull the human-readable result out of a stream-json job log.
 *
 * Replaces the jq invocation run-job.sh used to shell out to. jq was a hard
 * dependency package.json never declared: CI passed only because the
 * ubuntu-latest image happens to ship it, while a Windows or minimal-container
 * host produced an empty summary and no explanation. Node is already required
 * by `engines`, so doing it here removes a host assumption rather than
 * documenting one. See docs/harness-audit-2026-08.md failure mode 10.
 *
 * Behaviour matches the jq filter it replaces:
 *   jq -rR 'fromjson? | select(type == "object" and .type == "result") | .result'
 *
 *   - reads line by line, so interleaved stderr noise cannot break extraction
 *   - a line that is not valid JSON is skipped, not fatal
 *   - the object guard matters: a bare `42` on stderr is valid JSON, and
 *     without it `.type` would be read off a number
 *   - every matching event is emitted, in order, one per line
 *
 * Usage: node jobs/extract-result.mjs <log-file>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function extractResults(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let value;
    try {
      value = JSON.parse(trimmed);
    } catch {
      continue; // not JSON -- stderr noise interleaved into the log
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    if (value.type !== 'result') continue;
    if (value.result === undefined) continue;

    out.push(String(value.result));
  }
  return out;
}

// Same entry-point guard scripts/validate.mjs uses, so both files resolve
// their own path the one correct way.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node jobs/extract-result.mjs <log-file>');
    process.exit(64);
  }
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    process.exit(0); // no log, no summary -- the runner reports this itself
  }
  const results = extractResults(text);
  if (results.length > 0) process.stdout.write(`${results.join('\n')}\n`);
}
