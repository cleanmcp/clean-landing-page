# Conventions

Patterns this team follows. Update when a PR establishes or changes one.

New conventions should flow through `PROPOSED-CHANGES.md` first (see `REFLECTION.md`). Direct edits here are fine for human-initiated changes; agents should propose, not mutate.

## Process
Canonical rules live in the root `CLAUDE.md`. Highlights relevant to PR docs:
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/` (or `<handle>/<slug>`).
- PRs target `master` (not `main`).
- Squash merge. The squash SHA on `master` is what goes in `commit_sha` of the PR doc.
- CI runs `npm ci → lint → build` on every PR. It does not yet validate PR docs — run `node scripts/regen-pr-index.mjs --check` locally.
- Both `.github/PULL_REQUEST_TEMPLATE.md` (short, for the GitHub UI) and a `docs/PRs/PR-*.md` file (long-term context) are required on every PR.

## Architecture
None yet — populated as PRs establish patterns.

## Libraries
None yet — populated as PRs establish patterns.

## Naming
None yet — populated as PRs establish patterns.

## Anti-patterns
None yet — populated as PRs establish patterns.

## Testing
None yet — populated as PRs establish patterns.

## Security
The root `CLAUDE.md` lists security features that must not be weakened or bypassed (CSRF state tokens, cross-org guards, UUID/regex input validation, TOML escaping, `getAuthContext()` checks, OWNER/ADMIN role checks). Any PR touching these paths must fill the Security Impact section and flag the change for human review.
