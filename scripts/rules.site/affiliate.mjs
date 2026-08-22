/**
 * (b) Affiliate links: direct product URLs only, carrying our tag.
 *
 * SITE-SPECIFIC. Three things bind this to MotherboardCentral: the tag itself,
 * the set of Amazon hosts we use, and the shape of a search URL. Step 2 lifts
* all three now come from harness.config.json; a site with a different affiliate
 * programme replaces this module wholesale.
 */

import { extractRefs, lineOf } from '../core/extract.mjs';
import { config, re } from '../core/config.mjs';

// Read at module scope, which is exactly why core/config.mjs loads
// synchronously: `rule.labels` below interpolates AFFILIATE_TAG at import time.
const affiliate = config.validator.affiliate;

export const AFFILIATE_TAG = affiliate.tag;

const AMAZON_HOST_RE = re(affiliate.hostPattern, 'i');
const SEARCH_URL_RE = re(affiliate.searchUrlPattern, 'i');

export function checkAffiliate(page) {
  const findings = [];
  for (const ref of extractRefs(page.html)) {
    if (!AMAZON_HOST_RE.test(ref)) continue;

    if (SEARCH_URL_RE.test(ref)) {
      findings.push({
        file: page.file,
        rule: 'affiliate-search-url',
        detail: ref,
        line: lineOf(page.html, ref),
      });
      continue;
    }
    if (!ref.includes(`tag=${AFFILIATE_TAG}`)) {
      findings.push({
        file: page.file,
        rule: 'affiliate-missing-tag',
        detail: ref,
        line: lineOf(page.html, ref),
      });
    }
  }
  return findings;
}

export const rule = {
  id: 'affiliate',
  scope: 'page',
  labels: {
    'affiliate-search-url': 'Amazon search URL (must be a direct product link)',
    'affiliate-missing-tag': `Amazon link missing tag=${AFFILIATE_TAG}`,
  },
  run: (page) => checkAffiliate(page),
};
