# Project

Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/PostgreSQL

Engineering rules:
- Prefer Server Components unless client state is required.
- Keep components small and reusable.
- Never duplicate existing utilities/components.
- Preserve existing authentication and RLS behavior.
- Never weaken database security to fix an error.
- Avoid `any`.
- Validate user input.
- Handle loading, empty, error, and success states.
- Run typecheck, lint, and relevant tests after meaningful changes.

Workflow:
- Inspect existing implementation before modifying it.
- For significant changes, create a plan before coding.
- Prefer fixing root causes over patches.
- Don't rewrite unrelated code.