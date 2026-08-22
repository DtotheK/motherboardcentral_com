/**
 * The baseline ratchet.
 *
 * Entirely generic: it knows nothing about HTML, this site, or what a finding
 * means. A finding is any {file, rule, detail}; debt is a set of fingerprints.
 *
 * Fingerprints are `file :: rule :: normalised-detail` and deliberately NOT
 * line numbers, so unrelated edits do not churn the baseline. The build fails
 * on any NEW finding and on any RESOLVED one, so recorded debt can only shrink:
 * fixing a violation forces the baseline to be regenerated and committed.
 */

export function fingerprint(f) {
  return `${f.file} :: ${f.rule} :: ${String(f.detail).replace(/\s+/g, ' ').trim()}`;
}

/**
 * Collapse findings that share a fingerprint (e.g. the same affiliate URL
 * repeated three times on one page). Keeps the first line and records how
 * many times it occurred, so the printed total matches the baseline, which
 * is fingerprint-keyed and therefore inherently unique.
 */
export function dedupeFindings(findings) {
  const byFp = new Map();
  for (const f of findings) {
    const fp = fingerprint(f);
    const existing = byFp.get(fp);
    if (existing) existing.count += 1;
    else byFp.set(fp, { ...f, count: 1 });
  }
  return [...byFp.values()];
}

export function diffBaseline(findings, baseline) {
  const baseSet = new Set(baseline);
  const seen = new Set();
  const fresh = [];
  const known = [];

  for (const f of findings) {
    const fp = fingerprint(f);
    seen.add(fp);
    if (baseSet.has(fp)) known.push(f);
    else fresh.push(f);
  }
  const resolved = baseline.filter((fp) => !seen.has(fp));
  return { fresh, known, resolved };
}
