---
name: api-endpoint-addition-or-update
description: Workflow command scaffold for api-endpoint-addition-or-update in dongpeng-aix-hackathon.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /api-endpoint-addition-or-update

Use this workflow when working on **api-endpoint-addition-or-update** in `dongpeng-aix-hackathon`.

## Goal

Adds or updates an API endpoint, often with related logic and validation.

## Common Files

- `app/api/admin/event/route.ts`
- `app/api/admin/event/[id]/route.ts`
- `lib/actions/admin-event.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update API route file in app/api/admin/event/ or similar directory
- Update or add related server action in lib/actions/
- Update or add related validation or schema logic
- Update or add related UI components if necessary

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.