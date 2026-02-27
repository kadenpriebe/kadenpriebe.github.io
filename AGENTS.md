# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 16** personal portfolio site (TypeScript, React 19, Tailwind CSS v4, Supabase backend).

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Lint | `npm run lint` (ESLint 9) |

### Caveats

- **No test framework** is configured — there are no unit/integration tests to run.
- **Supabase env vars** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are optional for dev. The app uses placeholder fallbacks and logs a warning; all pages render but dynamic features (leaderboard, subscriptions, page views) are non-functional without them.
- `LASTFM_API_KEY` / `LASTFM_USERNAME` are optional; the "Now Playing" sidebar widget degrades gracefully.
- **Pre-existing lint errors** (42 errors, 6 warnings) exist in the codebase — mostly `react/no-unescaped-entities` and `@typescript-eslint/no-explicit-any`. `npm run lint` exits non-zero due to these.
- The lockfile is `package-lock.json` — use **npm**, not pnpm/yarn.
