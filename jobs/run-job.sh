#!/usr/bin/env bash
set -euo pipefail
JOB="$1"
cd "$(dirname "$0")/.."
[ -s "jobs/$JOB.md" ] || { echo "FATAL: jobs/$JOB.md missing or empty" >&2; exit 64; }
git checkout -f main
git fetch origin
git reset --hard origin/main
git clean -fd
git worktree prune
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
# -R with fromjson? skips the interleaved stderr lines, so noise cannot break
# extraction; the object guard keeps bare JSON scalars from erroring out.
jq -rR 'fromjson? | select(type == "object" and .type == "result") | .result' \
  "$LOG" > "$TXT" || true
echo "finished $JOB at $(date), exit $status"
echo "=== SUMMARY ==="
if [ -s "$TXT" ]; then cat "$TXT"; else echo "no result extracted — last 20 log lines:"; tail -20 "$LOG"; fi
exit $status
