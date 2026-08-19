#!/usr/bin/env bash
set -euo pipefail
JOB="$1"
cd "$(dirname "$0")/.."
git checkout main && git pull
claude -p "$(cat "jobs/$JOB.md")" --output-format json > "logs/$(date +%F-%H%M)-$JOB.json" 2>&1