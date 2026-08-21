# MotherboardCentral — Agent Instructions

## Mission
Accurate, genuinely useful motherboard reviews, guides, and comparison
tools. Reader trust is the product. Never trade accuracy for output volume.

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
- NEVER push to main. All work on task/issue-<n> branches via PR.
- One issue per branch per PR. PR body: "Closes #<n>" + full URLs of
  every changed page.
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
