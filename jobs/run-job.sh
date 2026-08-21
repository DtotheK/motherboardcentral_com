#!/usr/bin/env bash
set -euo pipefail
main() {
  JOB="$1"
  cd "$(dirname "$0")/.."
  [ -s "jobs/$JOB.md" ] || { echo "FATAL: jobs/$JOB.md missing or empty" >&2; exit 64; }
  git checkout main && git pull
  STAMP="$(date +%F-%H%M)"
  LOG="logs/$STAMP-$JOB.json"
  SUMMARY="logs/$STAMP-$JOB.summary.txt"
  echo "starting $JOB at $(date)"
  claude -p "$(cat "jobs/$JOB.md")" --output-format json > "$LOG" 2>&1 || true
  # extract just the human-readable result; fall back to log tail on failure
  if jq -re .result "$LOG" > "$SUMMARY" 2>/dev/null; then
    :
  else
    { echo "RUN FAILED OR MALFORMED OUTPUT — last 30 lines:"; tail -30 "$LOG"; } > "$SUMMARY"
  fi
  echo "finished $JOB at $(date)"
  echo "=== SUMMARY ==="
  cat "$SUMMARY"
}
main "$@"
