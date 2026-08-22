/**
 * (d) Canonical URL present and non-empty.
 *
 * Universal: every content page needs one, whatever the site is about.
 */

export function checkCanonical(page) {
  const tag = page.html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!tag) {
    return [{ file: page.file, rule: 'canonical-missing', detail: 'no rel=canonical' }];
  }
  const href = tag[0].match(/href=["']([^"']*)["']/i);
  if (!href || !href[1].trim()) {
    return [{ file: page.file, rule: 'canonical-missing', detail: 'empty canonical href' }];
  }
  return [];
}

export const rule = {
  id: 'canonical',
  scope: 'page',
  labels: { 'canonical-missing': 'Missing canonical URL' },
  run: (page) => checkCanonical(page),
};
