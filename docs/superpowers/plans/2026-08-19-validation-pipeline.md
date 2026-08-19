# Validation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `npm run validate` — a zero-dependency Node 22 validator that
fails CI on broken internal links, non-compliant affiliate links, missing or
duplicated SEO meta, missing canonicals, and spec/prose self-contradictions.

**Architecture:** One ESM script of pure functions over file text, so every
checker is unit-testable without disk I/O. Regex extraction, no DOM parser
(CLAUDE.md forbids added tooling). A baseline ratchet records existing debt so
CI is usable, while guaranteeing that recorded debt can only decrease.

**Tech Stack:** Node 22, ESM, `node:test`, `node:assert/strict`. Zero runtime
dependencies. GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-19-validation-pipeline-design.md`

## Global Constraints

- Node 22; `package.json` has `"type": "module"`.
- ZERO runtime dependencies. No parser library, no framework, no bundler.
- Affiliate tag is exactly `motherboardcentral.com-20`.
- The validator NEVER edits site content. Report only.
- Exit 0 = clean, 1 = violations, 2 = internal error.
- Link checking covers BOTH `href` and `src`, strips `?query` and `#fragment`,
  and honours a configurable `ignorePaths` list containing `/_vercel`.
- Baseline entries that match no current finding are RESOLVED and fail the run.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`

**Interfaces:**
- Produces: `npm run validate` -> `node scripts/validate.mjs`;
  `npm test` -> `node --test scripts/`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "motherboardcentral-com",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "validate": "node scripts/validate.mjs",
    "test": "node --test scripts/"
  }
}
```

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('fs').readFileSync('package.json','utf8'))"`
Expected: valid JSON, `"type": "module"` present.

---

### Task 2: Link checker (href + src)

**Files:**
- Create: `scripts/validate.mjs`
- Test: `scripts/validate.test.mjs`

**Interfaces:**
- Produces: `extractRefs(html) -> string[]`,
  `checkLinks(page, existsFn, ignorePaths) -> Finding[]`
- A `Finding` is `{file, rule, detail, line}`.
- A `page` is `{file, html}`.

- [ ] **Step 1: Write the failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLinks } from './validate.mjs';

const exists = (p) => ['index.html', 'reviews.html', 'css/style.css'].includes(p);

test('flags an href target that does not exist', () => {
  const page = { file: 'a.html', html: '<a href="ghost.html">x</a>' };
  const f = checkLinks(page, exists, []);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'broken-link');
});

test('strips query strings before checking existence', () => {
  const page = { file: 'a.html', html: '<a href="reviews.html?socket=AM5">x</a>' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

test('strips fragments before checking existence', () => {
  const page = { file: 'a.html', html: '<a href="index.html#top">x</a>' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});

test('checks src as well as href', () => {
  const page = { file: 'a.html', html: '<img src="missing.png">' };
  assert.equal(checkLinks(page, exists, []).length, 1);
});

test('honours ignorePaths', () => {
  const page = { file: 'a.html', html: '<script src="/_vercel/insights/script.js"></script>' };
  assert.deepEqual(checkLinks(page, exists, ['/_vercel']), []);
});

test('ignores external, mailto, data and bare-hash refs', () => {
  const page = { file: 'a.html', html:
    '<a href="https://x.com/a">e</a><a href="mailto:a@b.c">m</a>' +
    '<a href="#sec">h</a><img src="data:image/png;base64,AAA">' };
  assert.deepEqual(checkLinks(page, exists, []), []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/`
Expected: FAIL — `checkLinks` is not exported.

- [ ] **Step 3: Implement**

```js
const REF_RE = /(?:href|src)\s*=\s*"([^"]*)"/gi;

export function extractRefs(html) {
  return [...html.matchAll(REF_RE)].map((m) => m[1]);
}

export function checkLinks(page, existsFn, ignorePaths = []) {
  const findings = [];
  for (const raw of extractRefs(page.html)) {
    const ref = raw.trim();
    if (!ref || ref.startsWith('#')) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
    if (ignorePaths.some((p) => ref.startsWith(p))) continue;
    const target = ref.split('#')[0].split('?')[0];
    if (!target) continue;
    const rel = target.startsWith('/') ? target.slice(1) : target;
    if (!existsFn(rel)) {
      findings.push({ file: page.file, rule: 'broken-link', detail: target });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/`
Expected: PASS, 6 tests.

---

### Task 3: Affiliate, meta, and canonical checkers

**Files:**
- Modify: `scripts/validate.mjs`
- Test: `scripts/validate.test.mjs`

**Interfaces:**
- Produces: `checkAffiliate(page) -> Finding[]`,
  `checkCanonical(page) -> Finding[]`,
  `checkMeta(pages) -> Finding[]` (corpus-wide; needs all pages for duplicates)
- Consumes: `Finding` and `page` shapes from Task 2.

- [ ] **Step 1: Write the failing tests**

```js
import { checkAffiliate, checkCanonical, checkMeta } from './validate.mjs';

const TAG = 'motherboardcentral.com-20';

test('flags amazon search URLs', () => {
  const page = { file: 'a.html', html:
    `<a href="https://www.amazon.com/s?k=msi+b650&tag=${TAG}">buy</a>` };
  const f = checkAffiliate(page);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'affiliate-search-url');
});

test('flags a direct amazon link missing our tag', () => {
  const page = { file: 'a.html', html: '<a href="https://www.amazon.com/dp/B01">buy</a>' };
  assert.equal(checkAffiliate(page)[0].rule, 'affiliate-missing-tag');
});

test('accepts a direct tagged product link', () => {
  const page = { file: 'a.html', html:
    `<a href="https://www.amazon.com/dp/B01?tag=${TAG}">buy</a>` };
  assert.deepEqual(checkAffiliate(page), []);
});

test('flags a missing canonical', () => {
  assert.equal(checkCanonical({ file: 'a.html', html: '<head></head>' })[0].rule,
    'canonical-missing');
});

test('accepts a present canonical', () => {
  const html = '<link rel="canonical" href="https://motherboardcentral.com/a.html">';
  assert.deepEqual(checkCanonical({ file: 'a.html', html }), []);
});

test('flags duplicate titles across pages', () => {
  const mk = (file) => ({ file, html:
    '<title>Same</title><meta name="description" content="' + file + '">' });
  const f = checkMeta([mk('a.html'), mk('b.html')]);
  assert.ok(f.some((x) => x.rule === 'meta-duplicate'));
});

test('flags an empty title', () => {
  const page = { file: 'a.html', html:
    '<title>  </title><meta name="description" content="d">' };
  assert.ok(checkMeta([page]).some((x) => x.rule === 'meta-empty'));
});

test('flags a missing description', () => {
  const page = { file: 'a.html', html: '<title>T</title>' };
  assert.ok(checkMeta([page]).some((x) => x.rule === 'meta-missing'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement**

```js
export const AFFILIATE_TAG = 'motherboardcentral.com-20';

export function checkAffiliate(page) {
  const findings = [];
  for (const ref of extractRefs(page.html)) {
    if (!/amazon\.(com|co\.uk|ca|de)/i.test(ref)) continue;
    if (/\/s\?k=|\/s\/\?k=|[?&]k=/i.test(ref)) {
      findings.push({ file: page.file, rule: 'affiliate-search-url', detail: ref });
      continue;
    }
    if (!ref.includes(`tag=${AFFILIATE_TAG}`)) {
      findings.push({ file: page.file, rule: 'affiliate-missing-tag', detail: ref });
    }
  }
  return findings;
}

export function checkCanonical(page) {
  const m = page.html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!m) return [{ file: page.file, rule: 'canonical-missing', detail: 'no rel=canonical' }];
  const href = m[0].match(/href=["']([^"']*)["']/i);
  if (!href || !href[1].trim()) {
    return [{ file: page.file, rule: 'canonical-missing', detail: 'empty canonical href' }];
  }
  return [];
}

export function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

export function getDescription(html) {
  const m = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/content=["']([\s\S]*?)["']/i);
  return c ? c[1].trim() : null;
}

export function checkMeta(pages) {
  const findings = [];
  const titles = new Map();
  const descs = new Map();
  for (const page of pages) {
    const t = getTitle(page.html);
    if (t === null) findings.push({ file: page.file, rule: 'meta-missing', detail: 'no <title>' });
    else if (!t) findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty <title>' });
    else titles.set(t, [...(titles.get(t) || []), page.file]);

    const d = getDescription(page.html);
    if (d === null) findings.push({ file: page.file, rule: 'meta-missing', detail: 'no meta description' });
    else if (!d) findings.push({ file: page.file, rule: 'meta-empty', detail: 'empty meta description' });
    else descs.set(d, [...(descs.get(d) || []), page.file]);
  }
  for (const [value, files] of titles) {
    if (files.length > 1) for (const file of files) {
      findings.push({ file, rule: 'meta-duplicate', detail: `title shared with ${files.filter((f) => f !== file).join(', ')}: "${value}"` });
    }
  }
  for (const [value, files] of descs) {
    if (files.length > 1) for (const file of files) {
      findings.push({ file, rule: 'meta-duplicate', detail: `description shared with ${files.filter((f) => f !== file).join(', ')}: "${value.slice(0, 60)}"` });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/`
Expected: PASS.

---

### Task 4: Spec contradiction checker (LAN / WiFi / Socket)

**Files:**
- Modify: `scripts/validate.mjs`
- Test: `scripts/validate.test.mjs`

**Interfaces:**
- Produces: `parseSpecTable(html) -> Map<string,string>`,
  `stripTags(html) -> string`,
  `checkSpecContradictions(page) -> Finding[]`

- [ ] **Step 1: Write the failing tests**

```js
import { checkSpecContradictions, parseSpecTable } from './validate.mjs';

const withSpec = (rows, body) => ({
  file: 'a.html',
  html: `<table><tbody>${rows}</tbody></table><p>${body}</p>`,
});

test('parses spec rows', () => {
  const m = parseSpecTable('<tr><td>LAN</td><td>2.5G</td></tr>');
  assert.equal(m.get('LAN'), '2.5G');
});

test('flags LAN 2.5G against prose claiming 5 Gigabit Ethernet', () => {
  const page = withSpec('<tr><td>LAN</td><td>2.5G</td></tr>',
    '5 Gigabit Ethernet provides excellent wired speeds.');
  const f = checkSpecContradictions(page);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, 'spec-contradiction');
});

test('accepts matching LAN notation variants', () => {
  const page = withSpec('<tr><td>LAN</td><td>2.5G</td></tr>',
    'The 2.5 Gigabit Ethernet port is welcome.');
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('does not flag when prose never mentions the field', () => {
  const page = withSpec('<tr><td>LAN</td><td>2.5G</td></tr>',
    'The board has a clean layout and good heatsinks.');
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('accepts either side of a multi-value spec', () => {
  const page = withSpec('<tr><td>LAN</td><td>5G+2.5G</td></tr>',
    'The 5 Gigabit Ethernet port leads the pack.');
  assert.deepEqual(checkSpecContradictions(page), []);
});

test('flags a WiFi generation mismatch', () => {
  const page = withSpec('<tr><td>WiFi</td><td>WiFi 6E</td></tr>',
    'Onboard WiFi 7 keeps latency low.');
  assert.equal(checkSpecContradictions(page).length, 1);
});

test('flags a socket mismatch', () => {
  const page = withSpec('<tr><td>Socket</td><td>AM5</td></tr>',
    'This LGA 1700 board is a solid pick.');
  assert.equal(checkSpecContradictions(page).length, 1);
});

test('treats LGA1700 and LGA 1700 as equal', () => {
  const page = withSpec('<tr><td>Socket</td><td>LGA 1700</td></tr>',
    'The LGA1700 socket is mature.');
  assert.deepEqual(checkSpecContradictions(page), []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement**

```js
const ROW_RE = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi;

export function parseSpecTable(html) {
  const map = new Map();
  for (const m of html.matchAll(ROW_RE)) {
    const key = m[1].replace(/&amp;/g, '&').trim();
    if (!map.has(key)) map.set(key, m[2].trim());
  }
  return map;
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

const lanTokens = (s) => [...s.matchAll(/(\d+(?:\.\d+)?)\s*(?:G\b|GbE|Gigabit|Gb\/s)/gi)]
  .map((m) => `${parseFloat(m[1])}g`);
const wifiTokens = (s) => [...s.matchAll(/wi-?fi\s*(7|6e|6|5)/gi)]
  .map((m) => `wifi${m[1].toLowerCase()}`);
const socketTokens = (s) => [
  ...[...s.matchAll(/\bAM(\d)\b/gi)].map((m) => `am${m[1]}`),
  ...[...s.matchAll(/\bLGA\s*(\d{3,4})\b/gi)].map((m) => `lga${m[1]}`),
];

const FIELDS = [
  { key: 'LAN', label: 'LAN', tokens: lanTokens },
  { key: 'WiFi', label: 'WiFi', tokens: wifiTokens },
  { key: 'Socket', label: 'Socket', tokens: socketTokens },
];

export function checkSpecContradictions(page) {
  const specs = parseSpecTable(page.html);
  if (specs.size === 0) return [];
  const afterTable = page.html.split(/<\/table>/i).slice(1).join(' ');
  const body = stripTags(afterTable);
  const findings = [];

  for (const field of FIELDS) {
    const specValue = specs.get(field.key);
    if (!specValue) continue;
    const specTokens = new Set(field.tokens(specValue));
    if (specTokens.size === 0) continue;
    const bodyTokens = [...new Set(field.tokens(body))];
    if (bodyTokens.length === 0) continue;
    const conflicting = bodyTokens.filter((t) => !specTokens.has(t));
    if (conflicting.length > 0) {
      findings.push({
        file: page.file,
        rule: 'spec-contradiction',
        detail: `${field.label}: spec table says "${specValue}" but body text says "${conflicting.join('", "')}"`,
      });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/`
Expected: PASS.

---

### Task 5: Baseline ratchet, runner, report, CI

**Files:**
- Modify: `scripts/validate.mjs`
- Test: `scripts/validate.test.mjs`
- Create: `.github/workflows/validate.yml`
- Create: `validation-baseline.json` (generated, last)

**Interfaces:**
- Consumes: all checkers from Tasks 2-4.
- Produces: `fingerprint(finding) -> string`,
  `diffBaseline(findings, baseline) -> {fresh, known, resolved}`

- [ ] **Step 1: Write the failing tests**

```js
import { fingerprint, diffBaseline } from './validate.mjs';

const f1 = { file: 'a.html', rule: 'broken-link', detail: 'ghost.html' };
const f2 = { file: 'b.html', rule: 'canonical-missing', detail: 'no rel=canonical' };

test('fingerprint is stable and line-independent', () => {
  assert.equal(fingerprint({ ...f1, line: 10 }), fingerprint({ ...f1, line: 99 }));
});

test('unbaselined findings are fresh', () => {
  const d = diffBaseline([f1], []);
  assert.equal(d.fresh.length, 1);
  assert.equal(d.known.length, 0);
});

test('baselined findings are known, not fresh', () => {
  const d = diffBaseline([f1], [fingerprint(f1)]);
  assert.equal(d.fresh.length, 0);
  assert.equal(d.known.length, 1);
});

test('baseline entries with no matching finding are resolved', () => {
  const d = diffBaseline([f1], [fingerprint(f1), fingerprint(f2)]);
  assert.equal(d.resolved.length, 1);
  assert.equal(d.resolved[0], fingerprint(f2));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement ratchet + runner**

```js
export function fingerprint(f) {
  return `${f.file} :: ${f.rule} :: ${String(f.detail).replace(/\s+/g, ' ').trim()}`;
}

export function diffBaseline(findings, baseline) {
  const baseSet = new Set(baseline);
  const seen = new Set();
  const fresh = [], known = [];
  for (const f of findings) {
    const fp = fingerprint(f);
    seen.add(fp);
    (baseSet.has(fp) ? known : fresh).push(f);
  }
  const resolved = baseline.filter((fp) => !seen.has(fp));
  return { fresh, known, resolved };
}
```

The runner (guarded by `import.meta.main`-style check so tests can import
safely) walks `*.html`, runs every checker, diffs against
`validation-baseline.json`, prints findings grouped by file marked
NEW/KNOWN plus a RESOLVED section, and exits 1 if `fresh.length > 0 ||
resolved.length > 0`. `--update-baseline` rewrites the baseline and exits 0.

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/`
Expected: PASS.

- [ ] **Step 5: Create the CI workflow**

```yaml
name: validate
on:
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then npm ci; else npm i; fi
      - name: Run tests
        run: npm test
      - name: Validate site
        run: npm run validate
```

- [ ] **Step 6: Full report, then baseline**

Run `npm run validate` with NO baseline file and capture the complete
unfiltered report for the user. Only afterwards run
`npm run validate -- --update-baseline`. Fix no content.

---

## Self-Review

- Spec coverage: checks a-e map to Tasks 2, 3, 3, 3, 4; baseline ratchet and
  CI to Task 5; scaffolding to Task 1. No gaps.
- Placeholders: none — every step carries real code.
- Type consistency: `Finding {file, rule, detail}` and `page {file, html}` are
  used identically in Tasks 2-5; `extractRefs` defined in Task 2 is reused by
  `checkAffiliate` in Task 3.
