---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to `.scratch/handoff/` in the current workspace (create the directory if it does not exist). The markdown file name must be prefixed with a timestamp (format: `YYYYMMDD_HHMMSS-<name>.md`, e.g. `.scratch/handoff/20260913_161500-handoff.md`) so the latest context can easily be sorted and reloaded.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
