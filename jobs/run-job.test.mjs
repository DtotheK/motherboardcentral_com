import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REAL_SCRIPT = fileURLToPath(new URL('./run-job.sh', import.meta.url));
const REAL_EXTRACTOR = fileURLToPath(new URL('./extract-result.mjs', import.meta.url));

/* ------------------------------------------------------------- harness -- */

/**
 * Build a throwaway repo that looks enough like ours for run-job.sh to run:
 * jobs/run-job.sh (the real one), a job prompt, a logs/ dir, and a bin/ dir
 * holding fake `git` and `claude` executables that go on PATH.
 */
function makeSandbox({ job = 'demo-job', claude }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-job-'));
  fs.mkdirSync(path.join(dir, 'jobs'));
  fs.mkdirSync(path.join(dir, 'logs'));
  fs.mkdirSync(path.join(dir, 'bin'));

  fs.copyFileSync(REAL_SCRIPT, path.join(dir, 'jobs', 'run-job.sh'));
  fs.chmodSync(path.join(dir, 'jobs', 'run-job.sh'), 0o755);
  // The runner extracts its summary with this, so the sandbox needs it too.
  fs.copyFileSync(REAL_EXTRACTOR, path.join(dir, 'jobs', 'extract-result.mjs'));
  fs.writeFileSync(path.join(dir, 'jobs', `${job}.md`), 'Do the thing.\n');

  writeBin(dir, 'git', '#!/usr/bin/env bash\nexit 0\n');
  writeBin(dir, 'claude', claude);

  return { dir, job };
}

function writeBin(dir, name, body) {
  const p = path.join(dir, 'bin', name);
  fs.writeFileSync(p, body);
  fs.chmodSync(p, 0o755);
}

const env = (dir) => ({
  ...process.env,
  PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`,
});

/**
 * The sandbox bin prepended to a real PATH with every directory containing
 * `tool` removed. Used to prove the runner's preflight fires: stripping PATH
 * outright is not an option, because the OS needs it to find bash and the
 * script needs it to find dirname/cat/date long before the preflight runs.
 */
function pathWithoutTool(dir, tool) {
  const sep = process.platform === 'win32' ? ';' : ':';
  const candidates = [tool, `${tool}.exe`, `${tool}.cmd`, `${tool}.bat`];
  const kept = (process.env.PATH ?? '')
    .split(sep)
    .filter((d) => d && !candidates.some((c) => fs.existsSync(path.join(d, c))));
  return `${path.join(dir, 'bin')}:${kept.join(sep)}`;
}

function runJob({ dir, job }) {
  return spawnSync('bash', [path.join(dir, 'jobs', 'run-job.sh'), job], {
    cwd: dir,
    env: env(dir),
    encoding: 'utf8',
  });
}

const logFiles = (dir, ext) =>
  fs
    .readdirSync(path.join(dir, 'logs'))
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, 'logs', f));

const only = (dir, ext) => {
  const found = logFiles(dir, ext);
  assert.equal(found.length, 1, `expected exactly one ${ext} in logs/, got ${found.length}`);
  return found[0];
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A stream-json transcript like the real CLI emits, one JSON object per line. */
const streamLines = (result) =>
  [
    JSON.stringify({ type: 'system', subtype: 'init', session_id: 'abc' }),
    JSON.stringify({ type: 'assistant', message: { content: 'thinking out loud' } }),
    JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result }),
  ].join('\n');

const emit = (lines) =>
  `#!/usr/bin/env bash\ncat <<'STREAM'\n${lines}\nSTREAM\n`;

/* --------------------------------------------------------------- tests -- */

test('writes a .txt next to the .json with the same stem', () => {
  const box = makeSandbox({ claude: emit(streamLines('All done.')) });
  const r = runJob(box);

  assert.equal(r.status, 0, r.stderr);
  const json = only(box.dir, '.json');
  const txt = only(box.dir, '.txt');
  assert.equal(path.basename(json, '.json'), path.basename(txt, '.txt'));
});

test('the .txt holds the result prose, not the raw stream events', () => {
  const box = makeSandbox({ claude: emit(streamLines('Converted 4 boards.')) });
  runJob(box);

  const txt = fs.readFileSync(only(box.dir, '.txt'), 'utf8');
  assert.equal(txt.trim(), 'Converted 4 boards.');
  assert.ok(!txt.includes('"type"'), 'txt should not contain stream-event JSON');
});

test('echoes starting and finished lines naming the job', () => {
  const box = makeSandbox({ job: 'backlog-worker', claude: emit(streamLines('ok')) });
  const r = runJob(box);

  assert.match(r.stdout, /starting backlog-worker at .+/);
  assert.match(r.stdout, /finished backlog-worker at .+/);
});

test('asks the CLI for streaming output so the log can be tailed', () => {
  const box = makeSandbox({
    claude: '#!/usr/bin/env bash\nprintf \'%s\\n\' "$@" > "$ARGV_FILE"\n',
  });
  const argvFile = path.join(box.dir, 'argv.txt');
  spawnSync('bash', [path.join(box.dir, 'jobs', 'run-job.sh'), box.job], {
    cwd: box.dir,
    env: { ...env(box.dir), ARGV_FILE: argvFile },
    encoding: 'utf8',
  });

  const argv = fs.readFileSync(argvFile, 'utf8').split('\n');
  assert.ok(argv.includes('stream-json'), 'expected --output-format stream-json');
  assert.ok(argv.includes('--verbose'), 'stream-json with -p requires --verbose');
});

test('the .json grows while the job is still running', async () => {
  // Mirrors the real CLI: plain `json` holds everything back until the run
  // ends, `stream-json` emits events as they happen. Only the latter is tailable.
  const box = makeSandbox({
    claude:
      '#!/usr/bin/env bash\n' +
      'fmt=""\n' +
      'while [ $# -gt 0 ]; do\n' +
      '  case "$1" in --output-format) fmt="$2"; shift 2 ;; *) shift ;; esac\n' +
      'done\n' +
      `[ "$fmt" = "stream-json" ] && echo '${JSON.stringify({ type: 'system', subtype: 'init' })}'\n` +
      // Long enough that the poll below cannot race the job's own exit under
      // load. This test used to sleep 2 and read tail's output after a fixed
      // 1s wait, which failed intermittently on a busy machine.
      'sleep 6\n' +
      `echo '${JSON.stringify({ type: 'result', result: 'late' })}'\n`,
  });

  const child = spawn('bash', [path.join(box.dir, 'jobs', 'run-job.sh'), box.job], {
    cwd: box.dir,
    env: env(box.dir),
  });
  child.stdout.resume();
  child.stderr.resume();

  let log = null;
  for (let i = 0; i < 30 && !log; i++) {
    await sleep(50);
    log = logFiles(box.dir, '.json')[0] ?? null;
  }
  assert.ok(log, 'log file should be created when the job starts');

  // The acceptance criterion, literally: tail -f on a running job shows activity.
  const tail = spawn('tail', ['-f', '-n', '+1', log]);
  let tailed = '';
  tail.stdout.on('data', (d) => (tailed += d));

  // Poll rather than waiting a fixed interval: how fast tail flushes is a
  // property of the machine's load, not of the runner being tested.
  for (let i = 0; i < 60 && !/"type":"system"/.test(tailed); i++) await sleep(50);

  const stillRunning = child.exitCode === null;
  const midRunSize = fs.statSync(log).size;
  tail.kill();

  assert.ok(stillRunning, 'the fake job should not have finished yet');
  assert.match(tailed, /"type":"system"/, 'tail -f should show events mid-run');

  await new Promise((r) => child.on('close', r));
  assert.ok(
    fs.statSync(log).size > midRunSize,
    'log file should keep growing after the mid-run read',
  );
});

test('extracts the result even when stderr noise is interleaved', () => {
  const box = makeSandbox({
    claude:
      '#!/usr/bin/env bash\n' +
      `echo '${JSON.stringify({ type: 'system' })}'\n` +
      'echo "warning: something chatty" >&2\n' +
      'echo "42" >&2\n' +
      `echo '${JSON.stringify({ type: 'result', result: 'survived the noise' })}'\n`,
  });
  const r = runJob(box);

  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(only(box.dir, '.txt'), 'utf8').trim(), 'survived the noise');
});

test('fails fast and by name when a required tool is missing', () => {
  // jq used to be an undeclared dependency: when it was absent the runner still
  // exited 0 and wrote an empty summary, so the failure was silent. Missing
  // tools must now be loud. PATH holds only the sandbox bin, which has git but
  // deliberately no claude.
  const box = makeSandbox({ claude: '#!/usr/bin/env bash\nexit 0\n' });
  fs.rmSync(path.join(box.dir, 'bin', 'claude'));

  // Keep the real PATH -- the script needs dirname/cat/date, and the OS needs
  // it to locate bash at all -- but drop any directory that actually holds a
  // claude binary, so its absence is guaranteed rather than assumed. git is
  // probed first and resolves to the sandbox stub, so the run reaches the
  // claude check.
  const r = spawnSync('bash', [path.join(box.dir, 'jobs', 'run-job.sh'), box.job], {
    cwd: box.dir,
    env: { ...process.env, PATH: pathWithoutTool(box.dir, 'claude') },
    encoding: 'utf8',
  });

  assert.equal(r.status, 69, 'missing tool should exit 69, not run and produce an empty summary');
  assert.match(r.stderr, /required tool 'claude' not found/);
});

test('still writes the .txt and propagates the exit code when the job fails', () => {
  const box = makeSandbox({
    claude:
      '#!/usr/bin/env bash\n' +
      `echo '${JSON.stringify({ type: 'result', subtype: 'error', result: 'ran out of turns' })}'\n` +
      'exit 3\n',
  });
  const r = runJob(box);

  assert.equal(r.status, 3);
  assert.equal(fs.readFileSync(only(box.dir, '.txt'), 'utf8').trim(), 'ran out of turns');
  assert.match(r.stdout, /finished /);
});
