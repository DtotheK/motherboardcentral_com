#!/usr/bin/env bash
set -euo pipefail
JOB="$1"
cd "$(dirname "$0")/.."
[ -s "jobs/$JOB.md" ] || { echo "FATAL: jobs/$JOB.md missing or empty" >&2; exit 64; }
# Fail fast and by name when a required tool is absent. jq used to be a fourth,
# undeclared, dependency here; result extraction now runs on node, which
# package.json's engines field already requires.
for tool in git claude node; do
  command -v "$tool" >/dev/null 2>&1 || { echo "FATAL: required tool '$tool' not found on PATH" >&2; exit 69; }
done
git checkout -f main
git fetch origin
git reset --hard origin/main
git clean -fd
git worktree prune
rm -rf .claude/worktrees/
STAMP="$(date +%F-%H%M)"
LOG="logs/$STAMP-$JOB.json"
TXT="logs/$STAMP-$JOB.txt"
echo "starting $JOB at $(date)"
# stream-json + tee so the log grows line by line and `tail -f "$LOG"` shows
# activity while the job runs. --verbose is mandatory for stream-json with -p.
# tee's stdout goes to /dev/null: raw stream events must never reach stdout,
# because the scheduler (Hermes) delivers stdout to Discord.
status=0
claude -p "$(cat "jobs/$JOB.md")" --output-format stream-json --verbose 2>&1 \
  | tee "$LOG" > /dev/null || status=$?
# Skips lines that are not JSON, so interleaved stderr noise cannot break
# extraction; the object guard keeps bare JSON scalars from erroring out.
node jobs/extract-result.mjs "$LOG" > "$TXT" || true
echo "finished $JOB at $(date), exit $status"
echo "=== SUMMARY ==="
if [ -s "$TXT" ]; then cat "$TXT"; else echo "no result extracted — last 20 log lines:"; tail -20 "$LOG"; fi
exit $status
