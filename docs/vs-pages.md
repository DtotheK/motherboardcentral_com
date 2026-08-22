# Board-vs-board comparison pages

Issue #39. Phase 1 (the generator) is in the repo; Phase 2 (the pages) is not,
and cannot start until the spec audit below lands.

A vs page is `compare-<slug-a>-vs-<slug-b>.html`: a spec diff between two
boards, a few hundred words on what the differences mean, and a "get A if / get
B if" verdict. It is the last mile of the buying decision — the reader has
already narrowed to two boards and has nowhere on the site to land.

## The one rule everything else serves

**No spec value is ever typed into a vs page.** Every number on the page is
read out of `motherboardDatabase` at generation time, so a vs page cannot
contradict the compare tool or either review (CLAUDE.md rule 1). That is why
these pages are generated rather than hand-written: the constraint is
mechanical, not a habit someone has to keep.

## Commands

```
npm run vs -- --report   # which boards and pairs could carry a page, and what blocks the rest
npm run vs -- --build    # write compare-<a>-vs-<b>.html for every pair in the data file
npm run vs -- --check    # fail if a committed page no longer matches a fresh render
```

`npm test` runs `--check` over every committed page, so **a generated page is
never hand-edited**. Change `scripts/vs-pairs.data.mjs` and rebuild.

## Files

| File | What it is |
|---|---|
| `scripts/vs-pages.mjs` | The generator: extraction, validation, rendering, CLI |
| `scripts/vs-pairs.data.mjs` | The pairings and their hand-written prose. Empty today |
| `scripts/vs-pages.test.mjs` | Tests, including the drift guard over committed pages |
| `docs/vs-pages.md` | This file |

## Decisions

**D1. A zero-dependency Node generator in `scripts/`, output committed as
HTML.** Not hand-authoring (a typed spec can drift), not Astro (unstarted).
Nothing runs at deploy time; the deploy is still "push static HTML". Same
category as `scripts/validate.mjs`. When the Astro migration starts, this is a
straight port target.

**D2. The database is sliced out of `js/main.js` and evaluated in `node:vm`.**
It is a `const` inside the compare-page closure, so it cannot be imported.
Moving it to its own file would touch shared JS and `compare.html` for a
generator's convenience. If the markers move, the generator throws instead of
emitting a page — fail closed, matching `validate.mjs`.

**D3. `compare-<slug-a>-vs-<slug-b>.html`, slugs alphabetical, one file per
pair.** The slugs are the compare tool's `?boards=` slugs (#80), so the two
surfaces name a pair the same way. Alphabetical order makes the canonical
direction mechanical: B-vs-A never exists as a file. There is no redirect layer
in this repo, so the slug is permanent.

**D4. Prose is hand-written per pair in `scripts/vs-pairs.data.mjs`, merged
with database values through `{a.m2Slots}` placeholders.** The generator
rejects a spec-shaped literal in any hand-written field, so a spec can only
reach the page through the database.

**D5. All rows always render; differing rows are marked, identical rows muted.**
Collapsing identical rows would hide the most useful thing these pages say —
"these two are the same except for X". No better/worse arrows: the compare
tool's comparators live inside its closure, and a second copy of that ranking
logic here would drift from it. Superiority claims stay in prose, where a human
owns them.

**D6. The spec rows are the compare tool's `specRows`, verbatim.** Same rows,
same order, same labels, so a reader moving between `compare.html` and a vs
page never sees a discrepancy. A test fails if the two lists diverge.

**D7. Amazon links are read out of the two review pages at generation time.**
Byte-identical to the review's link; no tag added, none edited. A board whose
review still carries a `/s?k=` search URL (#4) is ineligible until its
affiliate batch lands. 52 of 70 boards currently qualify.

**D8. Pair eligibility is mechanical.** Identical socket, chipset and form
factor, **and** at least 2 differing spec rows excluding Brand and Rating.
Chipset stands in for "same price tier" because we publish no prices (#24) but
chipset is in the data. The 2-row floor exists because of thin content: several
same-chipset pairs differ on one row, and a 300-word page about one row is what
Google's helpful-content system exists to demote.

**D9. The pilot is 5–8 pairs across two chipset clusters**, so the 60-day
review can tell "the format works" apart from "this price band gets traffic".
Pick them from `--report`; none may ship before D14.

**D10. Page skeleton:** head (gtag, unique title/description/canonical/og), nav
with Compare marked active, `<h1>A vs B</h1>`, intro, "The short answer" (3
bullets), the diff table, "What the differences mean", "Get the A if…" / "Get
the B if…", the sourcing sentence, both Amazon buttons, links to both reviews
and to `compare.html?boards=a,b`, "More head-to-heads", footer. No images —
#42 is open about the image payload and these pages do not need one.

**D11. One fixed sourcing sentence, emitted by the generator on every page:**
"This comparison is based on the manufacturers' published specifications. We
have not tested either board." CLAUDE.md rule 2. It is not typed per page, so
it cannot be softened by accident.

**D12. Inline styles; `css/style.css` is untouched.** The usual argument
against inline styles does not apply to generated output — one template,
regenerate to change — and it keeps a shared stylesheet off the diff, which is
a CLAUDE.md tripwire.

**D13. No structured data.** A two-product page has no clean schema.org type,
and marking both boards as `Product` would duplicate the review markup that
already exists on two other URLs. Adding nothing costs a rich result we were
never going to earn; adding the wrong thing costs trust in the ones we have.

**D14. Publication gate: every row a vs page prints must have been read off
that manufacturer's own spec page, with the URL and date recorded in
`verified`.** This is the criterion the issue was missing. "It agrees with our
review" is not verification — the review and the database are the same numbers
typed once, so they can agree and both be wrong. Five of five ASUS boards
checked under #39 were wrong, on exactly the fields a vs page would headline.

**D15. Phase 1 ships machinery and evidence; pages ship under a follow-up
issue.** Nothing in Phase 1 is reader-visible: no HTML page is added or changed.

**D16. Never auto-merge a vs-page PR.** New page type, new tooling: two
CLAUDE.md tripwires regardless of file count.

## Two rules added during implementation

- **The data file must list a pair alphabetically.** D3 sorts the two slugs to
  build the filename; requiring the data to match means the page's "A vs B"
  always reads the same way round as its URL, rather than a page whose heading
  and address disagree.
- **An unresolvable placeholder is a validation failure.** `{a.m2Slotz}` would
  otherwise reach a reader as literal braces.

## One deviation from the plan

The plan's rendering test said the page should carry no `<script>` other than
the gtag block. The generator emits the same three script tags every other page
on the site does: gtag, `js/main.js`, and the Vercel Analytics tag. Reasons:

- The nav is copied verbatim and its mobile hamburger is wired up in
  `js/main.js`. Without it the menu does not open on a phone.
- #39's own 60-day success criterion is whether the pilot pages get impressions
  and convert. Omitting the analytics tag would make that unanswerable.

The intent behind the original rule is untouched and tested: the spec diff and
the verdict are in the HTML source, and no script generates page content.

## Known cosmetic mismatch class

Twelve boards are blocked by `--report` over an abbreviation, not a fact: the
database says `12x USB (incl. TB4)` where the review page says
`12x USB (incl. Thunderbolt 4)`. The gate is deliberately strict — it compares
strings and does not know which spellings are synonyms — so these are the
cheapest entries for the follow-up audit to clear. Fix them by making the
database and the review page agree, in the same commit.

## Cautions carried forward

- Only ASUS spec pages are machine-readable. MSI and GIGABYTE return 403,
  ASRock is JS-only, vendor PDFs are glyph-encoded. **D14 is not satisfiable by
  an agent for three of our four brands** — the audit needs a human with a
  browser. That, not the tooling, is the limit on how fast this feature scales.
- `motherboardDatabase` has 70 entries; the repo has 77 review pages. Seven
  reviewed boards have no database row, so they are invisible to the compare
  tool and can never enter a pair. Worth its own look.
- Titles run past the ~60 characters Google displays. Full board names are kept
  deliberately: truncation in a search result is cosmetic, a shortened board
  name is a spec-accuracy risk.
- The 60-day success criterion needs GA4 (`G-MN6VW6GV50`) and affiliate
  reporting. Neither is readable from this repo; a human has to do that reading.
- `guide-chipsets.html` (#37) has landed, so a vs page may link to it for
  platform-tier context rather than repeating it. Check any other target
  exists before linking: `validate.mjs`'s `broken-link` rule fails the build.
