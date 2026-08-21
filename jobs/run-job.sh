#!/usr/bin/env bash
set -euo pipefail
JOB="$1"
cd "$(dirname "$0")/.."
git checkout main && git pull

STAMP="$(date +%F-%H%M)"
LOG="logs/$STAMP-$JOB.json"
TXT="logs/$STAMP-$JOB.txt"

echo "starting $JOB at $(date)"

# stream-json + tee so the log grows line by line and `tail -f "$LOG"` shows
# activity while the job runs. --verbose is mandatory for stream-json with -p.
status=0
claude -p "$(cat "jobs/$JOB.md")" --output-format stream-json --verbose 2>&1 \
  | tee "$LOG" || status=$?

# -R with fromjson? skips the interleaved stderr lines, so noise cannot break
# extraction; the object guard keeps bare JSON scalars from erroring out.
jq -rR 'fromjson? | select(type == "object" and .type == "result") | .result' \
  "$LOG" > "$TXT" || true

echo "finished $JOB at $(date)"
exit $status
