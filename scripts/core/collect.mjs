/**
 * Page collection: the only part of the validator that touches the disk.
 */

import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './paths.mjs';
import { config } from './config.mjs';

export { ROOT };

export function collectHtmlFiles(root = ROOT) {
  const out = [];
  // Any dot-directory is tooling state, not site content — .git, .github and
  // agent worktrees under .claude/ alike. Collecting a worktree's snapshot of
  // the site would double every page and fail the meta-duplicate check.
  const skip = new Set(config.validator.skipDirs);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name) || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(path.relative(root, full));
    }
  };
  walk(root);
  return out.sort();
}
