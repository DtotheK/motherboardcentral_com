## Capability gaps — file and STOP, never improvise
If you cannot finish because a capability is missing — a verb absent from
.claude/settings.json, a tool not installed, a credential or API you cannot
reach — do NOT invent a workaround and do NOT skip the step silently.
File exactly one issue, labelled needs-enablement, stating:
  - the exact command or capability required, verbatim
  - which job step needs it
  - what you already tried
  - what you could not verify without it
Then STOP and report. A blocked run that names precisely what it needs is
worth more than a run that guesses, and leaves a trace a human can act on.
Never file the same enablement issue twice — search needs-enablement first.
