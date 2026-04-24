---
pr_id: PR-2026-04-23-pr-docs-system
date: 2026-04-23
commit_sha:
branch: PavanCodesNY/pr-docs-system
target_branch: master
main_change: introduce self-evolving PR documentation system under docs/PRs
type: chore
status: open
superseded_by:
breaking_change: false
authored_by: agent
model: claude-opus-4-7
author: PavanCodesNY
github_pr:
files_touched:
  - docs/PRs/README.md
  - docs/PRs/PR-TEMPLATE.md
  - docs/PRs/INDEX.md
  - docs/PRs/CONVENTIONS.md
  - docs/PRs/QUESTIONS.md
  - docs/PRs/REFLECTION.md
  - docs/PRs/PROPOSED-CHANGES.md
  - docs/PRs/archive/.gitkeep
  - scripts/regen-pr-index.mjs
  - scripts/reflect-pr-docs.mjs
  - CLAUDE.md
depends_on: []
related_prs: []
tags: [docs, tooling, process]
establishes_pattern: pr-docs-context-package
env_changes: []
database_migrations: false
rollback_complexity: low
---

## Summary
Introduces a structured PR documentation system under `docs/PRs/`. Every future PR will ship a long-form context package (parseable YAML frontmatter + prose sections) alongside the short GitHub PR description, so any agent modifying the same code later can get full context in under 60 seconds. Includes two zero-dep Node scripts: `regen-pr-index.mjs` (rebuilds `INDEX.md`, validates invariants) and `reflect-pr-docs.mjs` (self-evolution loop — proposes doc/convention updates, requires human ratification). `CLAUDE.md` updated so every contributor follows the convention automatically.

## Decision Log

### Decision: agents propose, humans ratify
- **Chose:** Agent-detected patterns land in `PROPOSED-CHANGES.md` with `needs_human: true`; nothing auto-mutates `CONVENTIONS.md` / `QUESTIONS.md` / `PR-TEMPLATE.md`.
- **Rejected:** Auto-apply high-confidence proposals because silent rule changes are exactly what teams push back against; the queue preserves human judgment without forcing every decision synchronously.
- **Rejected:** No self-evolution (static docs) because conventions that can't learn from usage rot within a quarter.
- **Why this matters later:** If the queue ever fills up with stale proposals, the system is working as intended — reject them with a reason rather than lowering the bar to auto-apply.

### Decision: two PR templates (GitHub + docs/PRs/)
- **Chose:** Keep both — `.github/PULL_REQUEST_TEMPLATE.md` stays short for the GitHub UI; `docs/PRs/PR-*.md` is the long-term context package. Both required on every PR.
- **Rejected:** Fold everything into the GitHub template because GitHub PR descriptions are hard to query across history and easy to lose.
- **Rejected:** Replace the GitHub template entirely because reviewers still need a concise summary in the UI.
- **Why this matters later:** If someone proposes killing the GitHub template to reduce duplication, remember the audience split — reviewer-right-now vs. agent-reading-this-in-2027.

### Decision: zero-deps scripts, no CI wiring yet
- **Chose:** Hand-rolled frontmatter parser + plain `.mjs` scripts. `--check` flag available for manual CI wiring later.
- **Rejected:** `gray-matter` + `tsx` because adding runtime deps + a build step for a docs helper is overkill.
- **Rejected:** Wiring `--check` into CI in this PR because a malformed PR doc would start blocking merges before the team has a feel for the invariants. Defer until the system has a few real PRs.
- **Why this matters later:** Wire into `.github/workflows/ci.yml` once `PROPOSED-CHANGES.md` has stabilized (3-6 months).

## Files Touched
Frontmatter `files_touched` is authoritative. Roles:
- `docs/PRs/README.md`: rules, workflow, frontmatter invariants, self-evolution pointer.
- `docs/PRs/PR-TEMPLATE.md`: canonical template with 20 frontmatter fields + sections (Summary, Decision Log, Files Touched, Dependencies, Testing, Security Impact, Known Limitations, Rollback, Agent Handoff Notes, Pattern Observations).
- `docs/PRs/INDEX.md`: generated table of PR docs + regeneration rules.
- `docs/PRs/CONVENTIONS.md`: team patterns (seeded empty with Security section referencing root CLAUDE.md).
- `docs/PRs/QUESTIONS.md`: PR-creation prompts grouped by change type; feeds every frontmatter field.
- `docs/PRs/REFLECTION.md`: self-evolution loop spec.
- `docs/PRs/PROPOSED-CHANGES.md`: empty queue seeded with schema for agent proposals.
- `docs/PRs/archive/.gitkeep`: reserves the archive directory.
- `scripts/regen-pr-index.mjs`: zero-dep frontmatter parser + invariant validator + INDEX writer. `--check` for CI.
- `scripts/reflect-pr-docs.mjs`: scans all PR docs, appends proposals to PROPOSED-CHANGES.md. Idempotent via slug signatures.
- `CLAUDE.md`: new **PR Documentation (required on every PR)** section under Conventions; anyone reading root instructions now follows the process.

## Dependencies
- **Builds on:** `CLAUDE.md` security section, `.github/PULL_REQUEST_TEMPLATE.md`, root Conventions.
- **Enables:** fast context recovery for future PRs; a convention-evolution loop with human oversight; optional future CI gate via `regen-pr-index.mjs --check`.
- **Will break if:** someone renames the GitHub repo slug (`cleanmcp/clean-landing-page` is hard-coded in the PR link template — fix in `scripts/regen-pr-index.mjs`).

## Testing
- **Tested:** 
  - Empty state: `regen-pr-index.mjs --check` → ok.
  - Synthetic valid PR doc → INDEX rewrites correctly; placeholder row dropped.
  - Missing required field → validator emits warning with file + field, exits non-zero.
  - `type: breaking` + `breaking_change: false` → caught.
  - `breaking_change: true` + `type: feature` → caught (reverse biconditional).
  - `status: closed` with no `commit_sha` → accepted (never reached master).
  - `reflect-pr-docs.mjs` with two PRs sharing an `establishes_pattern` → proposal appended once; re-run idempotent.
  - Slugify handles mixed-case + spaces in pattern values so dedup signatures are stable.
- **Coverage gaps:** 
  - No automated test runner — everything verified by hand-dropping synthetic docs.
  - `--check` not wired into CI, so nothing enforces the invariants server-side until that follow-up.
- **Edge cases handled:** empty PR directory, meta-file exclusion list, `pr_id`/filename mismatch (⚠ prefix, not dropped), idempotent reflection re-run.

## Security Impact
None — this PR touches only documentation and helper scripts under `docs/` and `scripts/`. No runtime code, no auth paths, no secrets, no API routes. The new CLAUDE.md section reinforces existing security guardrails rather than modifying them.

## Known Limitations
- PR docs and GitHub PR description are two separate surfaces — drift is possible until CI enforces linkage.
- `commit_sha` backfill post-merge is manual; easy to forget without a sweeper.
- Reflection heuristics are minimal (dead fields, recurring patterns, recurring tags, contradictions, thin rollbacks). Richer signals (decision-log similarity, rollback reuse) need the agent-judgment pass in `REFLECTION.md`.
- No JSON Schema for the frontmatter — validator is the schema. If a field is added to the template, the validator must be updated by hand.

## Rollback
- Delete `docs/PRs/` directory.
- Delete `scripts/regen-pr-index.mjs` and `scripts/reflect-pr-docs.mjs`.
- Revert the **PR Documentation** section in `CLAUDE.md` (everything after line 60 through the new section's end).
- No DB, env, or build-system changes to undo.

## Agent Handoff Notes
- If you add a new meta file under `docs/PRs/`, update `META_FILES` in both scripts and the exclusion list in `INDEX.md`'s regeneration rules — three places.
- If you add a new frontmatter field, update (1) `PR-TEMPLATE.md`, (2) `REQUIRED_FIELDS` in `regen-pr-index.mjs` if mandatory, (3) the invariants list in `README.md` + `CLAUDE.md` if it has cross-field rules, (4) `QUESTIONS.md` with a feeding question.
- GitHub repo slug `cleanmcp/clean-landing-page` is hard-coded in `scripts/regen-pr-index.mjs` PR-link rendering. If the repo is ever renamed, grep for it.
- Reflection script is **additive only** — never mutates existing proposals. If a proposal was accepted and applied, move it to `## Applied` by hand; don't delete it, or the same signal will re-propose.
- `status: superseded` requires BOTH a `commit_sha` (originally merged) AND a `superseded_by` value. The validator enforces both.

## Pattern Observations
- **New pattern seen:** `pr-docs-context-package` — every PR ships a parseable long-form doc + a short GitHub description, both required.
- **Contradicts prior PR:** None — this is the first doc in the system.
- **Question/field that felt unhelpful:** None yet — questions were authored alongside the template.
- **Question/field we wish existed:** `links_to_runbook` — if a PR establishes operational procedure, link to where that lives. Candidate for the first reflection-loop proposal.
