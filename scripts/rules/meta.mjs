/**
 * (c) Title + description: present, non-empty, unique corpus-wide.
 *
 * The only corpus-scoped rule: uniqueness cannot be judged one page at a time,
 * so this runs once over every page after the per-page loop.
 */

import { getTitle, getDescription } from '../core/extract.mjs';

export function checkMeta(pages) {
  const findings = [];
  const titles = new Map();
  const descs = new Map();

  for (const page of pages) {
    const t = getTitle(page.html);
    if (t === null) {
      findings.push({ file: page.file, rule: 'meta-missing', detail: 'no <title>' });
    } else if (t === '') {
      findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty <title>' });
    } else {
      titles.set(t, [...(titles.get(t) || []), page.file]);
    }

    const d = getDescription(page.html);
    if (d === null) {
      findings.push({ file: page.file, rule: 'meta-missing', detail: 'no meta description' });
    } else if (d === '') {
      findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty meta description' });
    } else {
      descs.set(d, [...(descs.get(d) || []), page.file]);
    }
  }

  const dupes = (map, label, clip) => {
    for (const [value, files] of map) {
      if (files.length < 2) continue;
      for (const file of files) {
        const others = files.filter((f) => f !== file).join(', ');
        findings.push({
          file,
          rule: 'meta-duplicate',
          detail: `${label} shared with ${others}: "${value.slice(0, clip)}"`,
        });
      }
    }
  };
  dupes(titles, 'title', 120);
  dupes(descs, 'description', 60);

  return findings;
}

export const rule = {
  id: 'meta',
  scope: 'corpus',
  labels: {
    'meta-missing': 'Missing title/description',
    'meta-empty': 'Empty title/description',
    'meta-duplicate': 'Duplicate title/description',
  },
  run: (pages) => checkMeta(pages),
};
