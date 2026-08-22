/**
 * (a) Internal href/src targets must exist in the repo.
 *
 * Universal: no site vocabulary. The one site-shaped input is ignorePaths,
 * which names paths the host injects at runtime and are correctly absent from
 * the repo, and now comes from harness.config.json.
 */

import { extractRefs, lineOf } from '../core/extract.mjs';
import { config } from '../core/config.mjs';

/** Paths that legitimately do not exist in the repo (injected at runtime). */
export const DEFAULT_IGNORE_PATHS = config.validator.ignorePaths;

export function checkLinks(page, existsFn, ignorePaths = DEFAULT_IGNORE_PATHS) {
  const findings = [];
  const seen = new Set();

  for (const raw of extractRefs(page.html)) {
    const ref = raw.trim();
    if (!ref || ref.startsWith('#')) continue;
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(ref)) continue;
    if (ignorePaths.some((p) => ref.startsWith(p))) continue;

    const target = ref.split('#')[0].split('?')[0];
    if (!target) continue;

    const rel = target.startsWith('/') ? target.slice(1) : target;
    if (seen.has(rel)) continue;
    seen.add(rel);

    if (!existsFn(rel)) {
      findings.push({
        file: page.file,
        rule: 'broken-link',
        detail: target,
        line: lineOf(page.html, raw),
      });
    }
  }
  return findings;
}

export const rule = {
  id: 'links',
  scope: 'page',
  labels: { 'broken-link': 'Broken internal link' },
  run: (page, ctx) => checkLinks(page, ctx.existsFn, ctx.ignorePaths),
};
