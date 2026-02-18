# Clean Landing Page & Dashboard

Next.js app serving the marketing site and authenticated dashboard. Handles user auth (Clerk), organization management, API key generation, repository management, billing, and team collaboration.

## Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Auth**: Clerk (SSO, webhooks)
- **Database**: Neon PostgreSQL (Drizzle ORM)
- **Styling**: Tailwind CSS 4
- **UI**: Radix UI, Lucide Icons, Framer Motion
- **Video**: Remotion (marketing videos)

## Development

```bash
npm install
npm run dev          # Next.js dev server, port 3000
npm run build        # Production build
npm run lint         # ESLint
npm run remotion     # Remotion studio for video editing
```

**Port**: 3000

## Key Files

```
app/
  layout.tsx              # Root layout with Clerk provider
  dashboard/              # Protected dashboard pages
    repositories/         # Repo management
    team/                 # Team/invite management
    keys/                 # API key management
    billing/              # Billing pages
  api/                    # API routes (org, license, CLI provisioning)
  sign-up/, sign-in/      # Auth pages
  invite/                 # Team invite handling
components/               # React components
lib/                      # Utilities, DB queries, server logic
drizzle/                  # Schema and migrations
middleware.ts             # Clerk auth middleware
drizzle.config.ts         # Drizzle config
```

## Environment Variables

See `.env.example`. Key vars: Clerk keys, `DATABASE_URL`, `GATEWAY_URL`, `GATEWAY_INTERNAL_SECRET`.

## Cross-Repo Dependencies

- **clean-gateway**: Calls gateway internal API using shared `GATEWAY_INTERNAL_SECRET`
- **tryclean** (engine): Dashboard manages engines, displays search results

## Conventions

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- PRs target `master` (not main), squash merge
- CI runs on PR: `npm ci` → lint → build (with stub env vars)
- See `CONTRIBUTING.md` for full process

## Do NOT

- Commit real Clerk keys or `GATEWAY_INTERNAL_SECRET` to the repo
- Use `BaseHTTPMiddleware` patterns — they break SSE streams
- Skip the Clerk provider in layout — all dashboard routes need it
- Push directly to `master`
