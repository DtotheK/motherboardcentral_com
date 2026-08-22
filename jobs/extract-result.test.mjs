/**
 * Unit tests for the stream-json result extractor.
 *
 * These pin the behaviour of the jq filter this replaced:
 *   jq -rR 'fromjson? | select(type == "object" and .type == "result") | .result'
 *
 * The object guard is the subtle one and is why the jq filter carried
 * `type == "object"`: a bare number on stderr is valid JSON, so without it
 * `.type` would be read off a scalar.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { extractResults } from './extract-result.mjs';

const line = (o) => JSON.stringify(o);

test('pulls the result out of a well-formed transcript', () => {
  const log = [
    line({ type: 'system', subtype: 'init', session_id: 'abc' }),
    line({ type: 'assistant', message: { content: 'thinking' } }),
    line({ type: 'result', subtype: 'success', is_error: false, result: 'Converted 4 boards.' }),
  ].join('\n');

  assert.deepEqual(extractResults(log), ['Converted 4 boards.']);
});

test('skips lines that are not JSON', () => {
  const log = [
    'warning: something chatty',
    line({ type: 'result', result: 'survived the noise' }),
  ].join('\n');

  assert.deepEqual(extractResults(log), ['survived the noise']);
});

test('ignores bare JSON scalars, which are valid JSON but have no .type', () => {
  // `42` on stderr parses cleanly; reading .type off it must not throw or match.
  const log = ['42', '"a string"', 'null', 'true', line({ type: 'result', result: 'ok' })].join('\n');

  assert.deepEqual(extractResults(log), ['ok']);
});

test('ignores JSON arrays', () => {
  const log = ['[1,2,3]', line({ type: 'result', result: 'ok' })].join('\n');

  assert.deepEqual(extractResults(log), ['ok']);
});

test('ignores objects that are not result events', () => {
  const log = [
    line({ type: 'system' }),
    line({ type: 'assistant' }),
    line({ type: 'user' }),
  ].join('\n');

  assert.deepEqual(extractResults(log), []);
});

test('ignores a result event carrying no result field', () => {
  const log = [line({ type: 'result', subtype: 'error' })].join('\n');

  assert.deepEqual(extractResults(log), []);
});

test('emits every result event in order', () => {
  const log = [
    line({ type: 'result', result: 'first' }),
    line({ type: 'system' }),
    line({ type: 'result', result: 'second' }),
  ].join('\n');

  assert.deepEqual(extractResults(log), ['first', 'second']);
});

test('tolerates CRLF line endings and blank lines', () => {
  const log = `${line({ type: 'system' })}\r\n\r\n${line({ type: 'result', result: 'crlf ok' })}\r\n`;

  assert.deepEqual(extractResults(log), ['crlf ok']);
});

test('stringifies a non-string result rather than dropping it', () => {
  const log = [line({ type: 'result', result: 7 })].join('\n');

  assert.deepEqual(extractResults(log), ['7']);
});

test('an empty log yields nothing', () => {
  assert.deepEqual(extractResults(''), []);
});
