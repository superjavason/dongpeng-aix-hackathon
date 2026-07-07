---
name: feature-development-with-schema-and-tests
description: Workflow command scaffold for feature-development-with-schema-and-tests in dongpeng-aix-hackathon.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-with-schema-and-tests

Use this workflow when working on **feature-development-with-schema-and-tests** in `dongpeng-aix-hackathon`.

## Goal

Implements a new feature involving schema changes, updates implementation, and adds/updates tests.

## Common Files

- `lib/schemas.ts`
- `lib/schemas.test.ts`
- `lib/event.ts`
- `lib/event.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update or add schema definitions in lib/schemas.ts
- Update or add corresponding tests in lib/schemas.test.ts
- Update or add implementation logic in lib/event.ts or similar core files
- Update or add corresponding tests in lib/event.test.ts

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.