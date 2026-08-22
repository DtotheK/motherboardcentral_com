---
role: control
---
Work on motherboardcentral.com. Read CLAUDE.md and follow it strictly.

Skills discipline for this run:
- Apply superpowers:test-driven-development for any code change.
- Apply superpowers:systematic-debugging if validation fails.
- Apply superpowers:verification-before-completion before the PR:
  prove each acceptance criterion in the issue is met with evidence.

Do NOT brainstorm — issues arrive pre-specified. If an issue needs design
decisions it doesn't specify, comment on it, label it needs-plan, stop. No PR.

Task:
1. gh issue list --label agent-ok --state open --limit 5 — pick the oldest.
2. gh issue view <n> — read fully. Branch: task/issue-<n>.
3. Implement exactly what's specified. Nothing extra.
4. npm test && npm run validate — fix until green. If a fix reduces known
   violations, run npm run validate -- --update-baseline and commit the
   baseline in the same branch. If you can't get green: comment findings,
   label needs-review, stop. No PR.
5. gh pr create — body includes "Closes #<n>" and every changed page as a
   full https://motherboardcentral.com/... URL.
6. If the change touches >15 files or any shared template/layout: add label
   needs-review and do NOT enable auto-merge. Otherwise: gh pr merge --auto --squash
One issue per run. Never push main directly.
