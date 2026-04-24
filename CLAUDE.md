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

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/` (or `<handle>/<slug>`)
- PRs target `master` (not main), squash merge
- CI runs on PR: `npm ci` → lint → build (with stub env vars)
- See `CONTRIBUTING.md` for full process

## PR Documentation (required on every PR)

Every PR must ship with **both** of these — they serve different audiences and must not drift:

1. **GitHub PR description** — fill out `.github/PULL_REQUEST_TEMPLATE.md` (What / Why / How to test / Cross-repo impact). Audience: the reviewer looking at the PR right now.
2. **Long-term context package** — a new file in `docs/PRs/` named `PR-YYYY-MM-DD-<kebab-main-change>.md`, copied from `docs/PRs/PR-TEMPLATE.md` and filled in. Audience: a future agent (human or AI) modifying this code months later with no other context.

The GitHub description should link to the long-form doc: `See docs/PRs/PR-YYYY-MM-DD-<slug>.md for full context.`

### Workflow
1. On your feature branch, copy `docs/PRs/PR-TEMPLATE.md` to `PR-YYYY-MM-DD-<slug>.md` and fill it in. Leave `commit_sha` and `github_pr` blank; leave `status: open`.
2. Run `node scripts/regen-pr-index.mjs` to update `docs/PRs/INDEX.md`. Commit both files alongside your code change.
3. CI does **not** validate PR docs today; run `node scripts/regen-pr-index.mjs --check` locally before pushing.
4. After the PR merges, open a small follow-up commit that fills `commit_sha` (the squash SHA on `master`), sets `status: merged`, and fills `github_pr`.
5. If the PR is closed without merging, open a follow-up PR setting `status: closed`. If superseded, set `status: superseded` + `superseded_by`. Never delete a PR doc.

### Frontmatter invariants (validator enforces)
- `type: breaking` ⇔ `breaking_change: true`
- `status: superseded` ⇔ `superseded_by` is set
- `authored_by: human` ⇒ `model` is blank; `authored_by: agent` ⇒ `model` is set
- `commit_sha` is blank for `status: open` or `closed` (never reached master); required for `merged`, `reverted`, `superseded`
- `pr_id` equals the filename stem

### Self-evolution loop
`docs/PRs/` is designed to improve itself. Agents **propose** changes to conventions/questions/template; humans **ratify** them. No rule change ships automatically.
- Every 5 merged PR docs (or quarterly), run `node scripts/reflect-pr-docs.mjs`. It appends proposals to `docs/PRs/PROPOSED-CHANGES.md` — a human reviews and accepts/rejects each.
- Full loop described in `docs/PRs/REFLECTION.md`.

### When an agent drafting a PR doc must pause and ask the human
- The PR touches any security-guardrail path listed in this CLAUDE.md.
- `## Pattern Observations > Contradicts prior PR` would be non-empty.
- `rollback_complexity: high` and the steps are unclear.
- A frontmatter invariant would need to be bent to describe the change honestly.

### Full details
- `docs/PRs/README.md` — rules, workflow, invariants
- `docs/PRs/REFLECTION.md` — self-evolution loop
- `docs/PRs/PROPOSED-CHANGES.md` — queue of agent proposals awaiting review
- `docs/PRs/CONVENTIONS.md` — team patterns (populated over time)
- `docs/PRs/QUESTIONS.md` — prompts for drafting a PR doc

## Security — Do NOT modify

The following security features have been audited and must not be weakened, removed, or bypassed:

- **CSRF state tokens** on GitHub App install flow (`lib/github-install-state.ts`, used in `app/api/github/install/route.ts` and `app/api/github/callback/route.ts`). Do not remove the state cookie or nonce verification.
- **Cross-org installation guards** — the checks that reject a GitHub installation already claimed by a different org. Do not remove or loosen these checks.
- **Input validation** — UUID regex gating in `app/api/cloud-repos/route.ts` (DELETE handler) and repo name regex for `fullName`. Do not remove these.
- **TOML escaping** in `app/dashboard/keys/new/page.tsx` for API key/slug values in generated config snippets. Do not remove the `esc()` helper.
- **`getAuthContext()` checks** at the top of API routes. Every API route that mutates data must verify auth. Do not remove or skip these.
- **Role checks** (OWNER/ADMIN) on destructive operations like `DELETE /api/github/install`. Do not weaken role requirements.

If you need to change security-related code, flag it for human review — do not silently modify it.

## Do NOT

- Commit real Clerk keys or `GATEWAY_INTERNAL_SECRET` to the repo
- Use `BaseHTTPMiddleware` patterns — they break SSE streams
- Skip the Clerk provider in layout — all dashboard routes need it
- Push directly to `master`
