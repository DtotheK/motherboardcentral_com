# MotherboardCentral — Agent Instructions

## Mission
Accurate, genuinely useful motherboard reviews, guides, and comparison
tools. Reader trust is the product. Never trade accuracy for output volume.

## Charter
The standing answer to "should we be doing this at all?". Jobs check work
against it; site-strategist reviews merged work against it and files
corrective issues when the site drifts.

- **IDENTITY** — MotherboardCentral is a motherboard reference site for
  people choosing or troubleshooting a board: reviews, buying guides,
  explainers, and comparison tools. Not a news site, not a general PC-build
  site, not a forum.
- **BUSINESS-MODEL** — Amazon affiliate revenue on direct product links,
  earned by being the page that actually answers the question. Reader trust
  is the asset; a recommendation we would not defend in person costs more
  than the click is worth.
- **EXPANSION-MANDATE** — Grow by covering more boards and more of the
  questions buyers actually ask, and by turning what we already know into
  tools (compare, vs pages, checkers). Depth on motherboards before breadth
  into adjacent hardware.
- **IN-SCOPE** — Motherboards and what attaches directly to them: chipsets,
  sockets, VRMs, RAM compatibility, PCIe and M.2 layout, BIOS/UEFI, USB and
  networking on the board, cases and cooling as they constrain board choice.
- **OUT-OF-SCOPE** — GPU/CPU reviews as such, peripherals, prebuilt system
  reviews, general Windows help, crypto/mining, anything requiring hands-on
  testing we cannot do. Out-of-scope ideas get filed and closed, not built.
- **AUTONOMY-TIER** — Tier 2: agents may research, plan, build and merge
  within scope unattended, gated by the validator and an independent
  reviewer. Human sign-off is still required for product recommendations,
  shared templates and layout, anything touching money or affiliate tags,
  and anything the Tripwire below catches.

## Current state
Static HTML site. Every push to main auto-deploys to production.
A migration to Astro (data-driven) is planned but NOT started — do not
introduce frameworks or build tooling unless an issue explicitly says so.

## Hard content rules
1. SPEC ACCURACY IS LAW. A hardware spec (socket, chipset, LAN speed,
   M.2 count, VRM phases, etc.) must never contradict itself anywhere
   on the same page or between pages describing the same board.
   If sources conflict, verify against the manufacturer's spec page;
   if still unclear, flag in the PR rather than guess.
2. NEVER fabricate benchmarks, test results, or hands-on claims.
   If we did not test it, say "based on published specifications."
3. Affiliate links: direct Amazon product links only (with our tag),
   never /s?k= search-result URLs.
4. Every content page: unique title, meta description, canonical URL.
5. Dates honest: "Updated" dates change only when content actually changed.
6. Tone: plain English, no hype, no filler. Short sentences over long.

## Git rules
- NEVER push to main. All work on a branch via PR.
- Scheduled agent runs: task/issue-<n> branches, one issue per branch per
  PR, PR body "Closes #<n>" + full URLs of every changed page.
- Human-led interactive sessions may use descriptive branches (harness/,
  docs/, fix/*) without a linked issue; the task/issue-<n> + Closes-#<n>
  rule binds scheduled agent runs. Do not flag such a branch as a
  violation.
- Run npm run validate before any PR. Green or no PR.
- The validation baseline must trend to zero — draining known debt is
  standing priority #1 for agent jobs.
- Batch-series issues: max 2 open PRs from the same series at once.

## Tripwire — label needs-review instead of auto-merging when:
- A change touches more than 15 files
- A change touches any shared template, nav, footer, or layout markup
- You are uncertain whether a spec is correct
- An issue requires design decisions it doesn't specify

## Never
- Never edit or remove existing affiliate tags
- Never delete pages (redirect or flag instead)
- Never claim testing we didn't do
- Never invent product names, prices, or release dates
- Never delete pages (redirect or flag instead)
- Never claim testing we didn't do
- Never invent product names, prices, or release dates
