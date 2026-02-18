# Contributing to Clean Landing Page & Dashboard

## Quick Start

```bash
git clone https://github.com/cleanmcp/clean-landing-page.git
cd clean-landing-page
npm install
cp .env.example .env   # then fill in required values
npm run dev             # starts on localhost:3000
```

## Prerequisites

- **Node.js 22+**
- **npm**
- **Clerk account** — for authentication keys
- **PostgreSQL** — use [Neon](https://neon.tech) or a local instance

## Development Commands

```
npm run dev          Next.js dev server, port 3000
npm run build        Production build
npm run lint         ESLint
npm run remotion     Remotion studio for video editing
```

## Environment Variables

Copy `.env.example` to `.env` and fill in. Key groups:

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- **Database**: `DATABASE_URL` (Neon Postgres)
- **Gateway**: `GATEWAY_URL`, `GATEWAY_INTERNAL_SECRET` (must match gateway's `.env`)
- **Clean Engine**: `CLEAN_API_KEY`, `CLEAN_SERVER_URL`

See `.env.example` for the full list with descriptions.

## Branch Naming

Use prefixes:

```
feat/add-billing-page
fix/clerk-webhook-error
chore/update-deps
docs/api-docs
```

**Important**: This repo uses `master` as the default branch (not `main`).

## Making Changes

1. Create a branch from `master`
2. Make your changes, keep them focused
3. Run `npm run lint` and `npm run build` to verify
4. Push and open a PR against `master`

## Pull Requests

- Keep PRs under 400 lines when possible — one concern per PR
- Write a clear description: what changed and why
- Link related issues with `Closes #N` or `Related: cleanmcp/repo#N`
- 1 approval required, any team member can review
- Squash merge, delete branch after

## Code Style

- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Use server components by default, client components only when needed
- Keep API routes thin — put logic in `lib/`
- Don't add abstractions for one-time operations

## Database Changes

- Schema lives in `drizzle/`
- Use `npx drizzle-kit generate` for migrations
- Test migrations locally before pushing

## Cross-Repo Changes

If your change requires updates in other repos:

1. Coordinate with gateway changes first (gateway should stay backward-compatible)
2. Link all related PRs with `Related: cleanmcp/repo#N`

## License

By contributing, you agree that your contributions will be licensed under the project's license.
