---
pr_id: PR-2026-04-23-drop-jigsaw-logo
date: 2026-04-23
commit_sha:
branch: PavanCodesNY/drop-jigsaw-logo
target_branch: master
main_change: Remove Jigsaw logo from the trusted-by marquee
type: chore
status: open
superseded_by:
breaking_change: false
authored_by: agent
model: claude-opus-4-7
author: PavanCodesNY
github_pr:
files_touched: [app/page.tsx, public/landing/trusted-by/jigsaw.png]
depends_on: []
related_prs: []
tags: [landing-page, marketing, trusted-by]
establishes_pattern:
env_changes: []
database_migrations: false
rollback_complexity: low
---

## Summary
Removes the Jigsaw logo from the trusted-by marquee on the marketing landing page. Deletes the `jigsaw.png` asset and drops the corresponding entry from the `DISPLAY_NAMES` map in `app/page.tsx`. User-facing impact: Jigsaw no longer appears in the logo carousel; the marquee continues to loop seamlessly because the component auto-derives its copies from the remaining logo count.

## Decision Log

### Decision: Remove both the image and the DISPLAY_NAMES entry
- **Chose:** Delete `public/landing/trusted-by/jigsaw.png` and the `jigsaw: "Jigsaw"` key in `DISPLAY_NAMES`.
- **Rejected:** Delete only the image file, because `DISPLAY_NAMES` would hold a stale, unused entry (dead code).
- **Rejected:** Delete only the map entry, because `getTrustedByLogos()` auto-discovers by directory scan and would still render the logo with a fallback label.
- **Why this matters later:** The logo list is driven by directory scan + display-name map. Future logo removals must touch both surfaces to stay consistent.

### Decision: Leave `TrustedByMarquee.tsx` untouched
- **Chose:** No changes to the marquee component.
- **Rejected:** Adjusting the 4-copy duplication or `repeatsPerCopy` math, because both adapt automatically to `logos.length`.
- **Why this matters later:** The infinite-scroll animation is count-agnostic; adding or removing a single logo does not require component edits.

## Files Touched
- `app/page.tsx`: remove `jigsaw: "Jigsaw"` entry from `DISPLAY_NAMES`.
- `public/landing/trusted-by/jigsaw.png`: deleted asset.

## Dependencies
- **Builds on:** existing trusted-by marquee (`components/landing/TrustedByMarquee.tsx`) and directory-scan loader in `app/page.tsx`.
- **Enables:** None — cosmetic content removal.
- **Will break if:** the marquee loader is ever hard-coded to a specific logo count instead of `logos.length`.

## Testing
- **Tested:** Local `npm run dev`; confirmed Jigsaw no longer appears in the marquee and scroll-coupled wrap continues without a visible seam.
- **Coverage gaps:** No automated tests for the marquee; verification is visual.
- **Edge cases handled:** Logo count change flows through `repeatsPerCopy = Math.max(6, Math.ceil(20 / logos.length))`; 4-copy wrap logic is unchanged.

## Security Impact
None — change is limited to static marketing assets and a display-name map. No auth, validation, secret, CSRF, or RBAC paths listed in root `CLAUDE.md` are touched.

## Known Limitations
None.

## Rollback
- `git revert` the squash commit on `master`. Restores `jigsaw.png` and the `DISPLAY_NAMES` entry. No env, DB, or config state to reconcile.

## Agent Handoff Notes
- If you add or remove a trusted-by logo, update **both** the file in `public/landing/trusted-by/` and the `DISPLAY_NAMES` map in `app/page.tsx`. Files starting with `orca` are filtered out by design.
- The marquee renders exactly 4 duplicated copies of the logo array; this is intentional for the seamless wrap math in `TrustedByMarquee.tsx`. Do not reduce the copy count.
- `repeatsPerCopy` scales with logo count, so the visual density is stable even as the list shrinks or grows.

## Pattern Observations
- **New pattern seen:** None
- **Contradicts prior PR:** None
- **Question/field that felt unhelpful:** None
- **Question/field we wish existed:** None
