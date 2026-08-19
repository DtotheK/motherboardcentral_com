# Validation Pipeline — Design

Date: 2026-08-19
Status: Approved (with corrections)

## Purpose

`CLAUDE.md` already requires `npm run validate` before every PR ("Green or no
PR"), but no such script exists. This builds it: a zero-dependency validator
for the static HTML site, plus a CI gate on pull requests.

## Constraints

- `CLAUDE.md`: no frameworks, no build tooling. A zero-dependency Node script
  is acceptable; a parser dependency is not.
- Node 22, ESM (`"type": "module"`).
- The validator reports. It never edits content.

## Checks

| ID | Rule | Failure |
|----|------|---------|
| a | Internal `href`/`src` targets must exist in the repo | broken-link |
| b | Amazon links must be direct product URLs carrying `tag=motherboardcentral.com-20` | affiliate-search-url / affiliate-missing-tag |
| c | `<title>` and meta description present, non-empty, unique corpus-wide | meta-missing / meta-empty / meta-duplicate |
| d | `rel="canonical"` present and non-empty | canonical-missing |
| e | Spec-table LAN/WiFi/Socket must not contradict body prose | spec-contradiction |

## Design

Regex extraction, no DOM parser. Justified: markup is machine-generated and
uniform (70 review pages share one exact spec-table shape). Risk of regex
brittleness is mitigated by never failing open — a page whose extractors find
nothing is reported as `extraction-failed`, not silently passed.

Pure functions over file text, so every checker is unit-testable without disk.

- `collectPages()`   — enumerate `*.html`, read text (the only I/O)
- `checkLinks()`     — **`href` AND `src`**; strip `#fragment` and `?query`;
                       skip external, `mailto:`, `data:`, bare `#`; skip any
                       path matching the configurable `ignorePaths` list,
                       which includes `/_vercel` (Vercel injects it at runtime;
                       it is correctly absent from the repo)
- `checkAffiliate()` — flag `amazon.com/s?k=`; flag missing tag
- `checkMeta()`      — missing/empty/duplicate title and description
- `checkCanonical()` — present and non-empty
- `checkSpecContradictions()` — LAN / WiFi / Socket only
- `report()`         — group by file, print, compute exit code

### Spec contradiction mechanics

Parse `<tr><td>Label</td><td>Value</td></tr>` into a map. Body text is
everything after `</table>`, tags stripped. Both sides normalise to canonical
tokens before comparison:

- LAN:    `2.5G` / `2.5GbE` / `2.5 Gigabit` -> `2.5g`
- WiFi:   `WiFi 6E` / `Wi-Fi 6E` -> `wifi6e`
- Socket: `LGA 1700` / `LGA1700` -> `lga1700`

Rules that suppress false positives:
- Absence of any prose assertion is never a contradiction.
- Multi-value specs (`5G+2.5G`) are satisfied if prose matches either side.
- `No WiFi` compared only against explicit WiFi-standard claims.

### Baseline ratchet

`validation-baseline.json`, keyed by stable fingerprint
`file :: rule :: normalised-detail` — deliberately not line numbers, so
unrelated edits do not churn it.

Every finding prints as `NEW` or `KNOWN`. Additionally, a baseline entry that
matches no current finding prints as `RESOLVED`.

Exit code is 1 if there is any `NEW` **or any `RESOLVED`** entry. Recorded
debt can therefore only ever decrease: fixing a violation forces the baseline
to be regenerated and committed via `--update-baseline`. The report always
prints total known debt, so the baseline cannot quietly bury the 336 existing
affiliate violations.

### Errors

An unreadable file becomes its own finding, never a crash. Internal errors
exit 2, so "the validator broke" is distinguishable from "the site has
violations".

## Testing

TDD with `node:test` (built into Node 22, zero deps). Fixture strings drive
the pure checkers. Mandatory false-positive guards, both found during
exploration of the real corpus:

- `reviews.html?socket=AM5` must PASS (query string stripped)
- `/_vercel/insights/script.js` must PASS (ignorePaths)
- a page whose prose never mentions LAN must NOT be flagged

## Files

`package.json`, `scripts/validate.mjs`, `scripts/validate.test.mjs`,
`.github/workflows/validate.yml`, `validation-baseline.json`

## Sequencing

Run and report the full unfiltered violation list BEFORE writing the baseline,
so all existing violations are visible. Generate the baseline afterwards. No
content is fixed at any point.
