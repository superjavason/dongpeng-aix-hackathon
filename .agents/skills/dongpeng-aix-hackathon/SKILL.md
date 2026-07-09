```markdown
# dongpeng-aix-hackathon Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and workflows used in the `dongpeng-aix-hackathon` TypeScript codebase. You'll learn how to structure new features, update schemas, add API endpoints, extend the admin UI, and document design decisions using established conventions and step-by-step workflows. This guide also covers testing patterns and provides handy slash commands for common tasks.

## Coding Conventions

**File Naming**
- Use `camelCase` for file names.
  - Example: `eventCreateDialog.tsx`, `adminNav.tsx`

**Imports**
- Use alias imports for modules.
  - Example:
    ```typescript
    import { validateEvent } from '@/lib/schemas';
    ```

**Exports**
- Use named exports for functions, types, and components.
  - Example:
    ```typescript
    export function createEvent(data: EventData) { ... }
    export type EventData = { ... };
    ```

**Commit Messages**
- Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes like `feat`, `docs`, and `fix`.
  - Example: `feat: add admin event switcher component`

## Workflows

### Feature Development with Schema and Tests
**Trigger:** When adding or modifying a core feature that requires schema validation and testing  
**Command:** `/new-schema-feature`

1. **Update or add schema definitions** in `lib/schemas.ts`.
    ```typescript
    // lib/schemas.ts
    export const eventSchema = z.object({
      id: z.string(),
      name: z.string(),
      date: z.date(),
    });
    ```
2. **Update or add corresponding tests** in `lib/schemas.test.ts`.
    ```typescript
    // lib/schemas.test.ts
    import { eventSchema } from './schemas';

    test('validates event schema', () => {
      expect(eventSchema.parse({ id: '1', name: 'Hackathon', date: new Date() })).toBeTruthy();
    });
    ```
3. **Update or add implementation logic** in `lib/event.ts` or similar core files.
    ```typescript
    // lib/event.ts
    import { eventSchema } from './schemas';

    export function createEvent(data: unknown) {
      const event = eventSchema.parse(data);
      // ...implementation
    }
    ```
4. **Update or add corresponding tests** in `lib/event.test.ts`.

---

### API Endpoint Addition or Update
**Trigger:** When exposing new backend functionality via an API route  
**Command:** `/new-api-endpoint`

1. **Create or update API route file** in `app/api/admin/event/` or similar.
    ```typescript
    // app/api/admin/event/route.ts
    import { createEvent } from '@/lib/actions/admin-event';

    export async function POST(req: Request) {
      const data = await req.json();
      return createEvent(data);
    }
    ```
2. **Update or add related server action** in `lib/actions/`.
3. **Update or add related validation or schema logic** as needed.
4. **Update or add related UI components** if necessary.

---

### Admin UI Page or Component Addition
**Trigger:** When providing new admin functionality or views  
**Command:** `/new-admin-ui`

1. **Create or update page files** in `app/admin/` (e.g., `events/page.tsx`).
    ```typescript
    // app/admin/events/page.tsx
    import { EventList } from '@/components/admin/event-list';

    export default function EventsPage() {
      return <EventList />;
    }
    ```
2. **Create or update supporting components** in `components/admin/`.
3. **Update layout or navigation components** as needed.

---

### Design Spec and Implementation Plan Documentation
**Trigger:** When formally proposing and planning a new feature or architectural change  
**Command:** `/new-design-doc`

1. **Add a design spec markdown file** in `docs/superpowers/specs/`.
    - Example: `docs/superpowers/specs/event-creation.md`
2. **Add an implementation plan markdown file** in `docs/superpowers/plans/`.
    - Example: `docs/superpowers/plans/event-creation-plan.md`

---

## Testing Patterns

- **Test Framework:** Not explicitly detected, but test files follow the `*.test.*` pattern.
- **Location:** Tests are placed alongside the modules they test, e.g., `lib/schemas.test.ts`.
- **Style:** Use standard assertion-based tests.
    ```typescript
    // lib/event.test.ts
    import { createEvent } from './event';

    test('creates event with valid data', () => {
      expect(() => createEvent({ id: '1', name: 'Test', date: new Date() })).not.toThrow();
    });
    ```

## Commands

| Command             | Purpose                                                     |
|---------------------|-------------------------------------------------------------|
| /new-schema-feature | Start a new feature involving schema and tests              |
| /new-api-endpoint   | Add or update an API endpoint                               |
| /new-admin-ui       | Add or update admin UI pages or components                  |
| /new-design-doc     | Add a design spec and implementation plan documentation     |
```