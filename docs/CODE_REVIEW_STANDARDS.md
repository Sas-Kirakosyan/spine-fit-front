# Code Review Standards

These standards are enforced automatically by the `/review` command before every `git push`.

## Critical (blocks push)

- No unused variables or imports
- No `console.log` / `console.error` left in production code (use a logger or remove)
- All async functions must have error handling (`try/catch` or `.catch()`)
- No hardcoded secrets, API keys, or credentials
- TypeScript errors — code must not introduce new `ts` type errors
- No `any` type cast that bypasses a real type (use proper generics or type guards instead)

## Warnings (reported, do not block)

- Functions longer than 40 lines should be broken up
- Deeply nested logic (> 3 levels) — consider early returns or extraction
- Duplicate logic that already exists in `packages/shared`
- Missing i18n key — user-facing strings must go through `t()` and be present in both `en.json` and `ru.json`
- React component props that are passed but never used

## Suggestions (optional improvements)

- Magic numbers/strings should be named constants
- Boolean prop names that don't start with `is`/`has`/`can`/`should`
- Components > 200 lines — consider splitting
- Missing JSDoc on exported functions in `packages/shared`

## Project-Specific Rules

- **Routing** — navigation must go through the prop-drilled `onNavigate` callback pattern; do not bypass App.tsx state machine
- **Supabase calls** — must go through the service layer (`planService`, `authService`), never call `supabase` client directly from components
- **localStorage** — only for the items listed in CLAUDE.md as "still localStorage-only"; everything else must use Supabase
- **Brand colors** — use `main` token for primary orange (`#e77d10`), not raw hex values in components
