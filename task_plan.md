# Task Plan: Clean Cloud Engine — Robust Indexing, Progress UI, Smart Branch System

## Goal
Make the Clean cloud indexing pipeline production-ready: fix deployed bugs, show real-time indexing progress in the UI, and implement smart branch indexing using git worktrees with on-demand indexing and fallback-to-main search.

## Current Phase
Phase 4 (Phases 1-3 complete)

---

## Phases

### Phase 1: Deploy Bug Fixes & Progress UI (PARTIALLY DONE)
- [x] Fix clone branch path bug — pass `branch=branch` to `update_remote_url` in `manager.py`
- [x] Add partial clone dir cleanup — remove dirs without `.git` before re-clone
- [x] Bump `max_workers` from 4 → 8 in `cloud/api.py`
- [x] Add job progress data to engine `GET /repos` list endpoint
- [x] Website GET `/api/cloud-repos` syncs live status from engine (status sync fix)
- [x] Website GET handler passes through `job` progress (phase, progress%, files_processed, files_total, entities_found)
- [x] Frontend `cloud-repos.tsx` shows progress bar + file count during indexing
- [x] Push engine changes, rebuild container, restart
- [x] Verify engine is healthy after latest restart — 7,512 entities indexed, no errors
- [ ] Verify progress bar renders during active indexing (trigger new index to test)
- [x] Commit + push Website changes (progress UI) — e236e9b to master
- **Status:** in_progress (progress bar visual verification remaining)

### Phase 2: Smart Branch Indexing — Engine Changes
**IMPLEMENTED.**

- [x] Add per-repo locking: `self._repo_locks: dict[str, threading.Lock]` in RepoManager
- [x] Write `.clean-meta.json` at clone time with `{"default_branch": "main"}`
- [x] Add `RepoManager._get_default_branch(full_name)` — reads `.clean-meta.json`
- [x] Modify `RepoManager.clone()` — use `--filter=blob:none` instead of `--depth=1`
- [x] Modify `RepoManager.repo_path()` — return worktree path for non-default branches
- [x] Modify `RepoManager.exists()` — accept `.git` file (worktree) in addition to `.git` dir
- [x] Modify `RepoManager.pull()` — for worktrees: fetch in base, merge in worktree
- [x] Add `RepoManager.create_worktree(full_name, branch)` — fetch + worktree add
- [x] Add `RepoManager.remove_worktree(full_name, branch)` — worktree remove + prune
- [x] Add `RepoManager.list_worktrees(full_name)` — parse `git worktree list --porcelain`
- [x] Add `LanceDBStore.copy_table(source_project_id, dest_project_id)` — Arrow-level table copy with project_id + root_path rewrite
- [x] Update `_clone_and_index_cloud()` — base-clone check → worktree creation → vector bootstrap → incremental index
- [x] Branch cleanup: drop table + remove worktree when branch deleted/merged
- **Status:** complete

### Phase 3: On-Demand Branch Indexing (Search Fallback)
**IMPLEMENTED.**

- [x] Modify `POST /search` endpoint to accept `branch` parameter
- [x] If branch is not indexed:
  1. Return results from default branch immediately with `"branch_status": "not_indexed", "fell_back_to": "main"`
  2. Kick off background branch indexing (worktree + copy-table + diff-embed)
- [x] If branch IS indexed: search branch's table directly
- [x] Add `GET /repos/branches?repo=owner/repo` endpoint to list indexed branches per repo
- [ ] Incremental branch updates: when webhook fires for a branch push, `git fetch` + diff + re-embed changed files only
- **Status:** complete (webhook-driven updates deferred to Phase 5)

### Phase 4: Dashboard UI for Branches
- [ ] Update `cloud-repos.tsx` to show branches per repo
  - Main repo row with branch dropdown/selector
  - Show indexed branches with their status (ready/indexing)
  - Branches don't count toward repo limit — only the repo itself counts
- [ ] "Index Branch" button or auto-index on first search (show status)
- [ ] Branch cleanup UI — delete indexed branches user no longer needs
- [ ] Update `GET /api/cloud-repos` to include branch info from engine
- **Status:** pending

### Phase 5: Webhook-Driven Incremental Updates
- [ ] Wire up GitHub webhook `push` events in cloud engine
  - On push to any indexed branch → `git fetch` → incremental re-index
  - On push to non-indexed branch → ignore (will be indexed on-demand)
- [ ] Handle branch deletion webhook → cleanup worktree + drop vector table
- [ ] Handle repository deletion webhook → cleanup all data
- **Status:** pending

### Phase 6: Testing & Stress Test
- [ ] Test indexing 5+ repos in parallel (8 workers)
- [ ] Test branch indexing: create worktree, copy table, diff-embed
- [ ] Test on-demand search fallback: search unindexed branch → get main results + background index
- [ ] Test incremental: push changes to indexed branch → verify only changed files re-embedded
- [ ] Test cleanup: delete branch → verify worktree + table removed
- [ ] Monitor disk usage with multiple branches
- **Status:** pending

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Git worktrees (not separate clones) | Shares `.git` objects — 5 branches ≠ 5x disk. Only working tree files differ (~5-10% extra per branch) |
| Copy main's vector table for new branch | Avoids full re-index. 1000 files but only 5-20 changed = copy + diff-embed in ~10-15s instead of 2-5min |
| On-demand branch indexing | Don't waste resources indexing branches nobody searches. Index when agent first queries. |
| Fallback to main during branch indexing | Agent gets instant results (from main) while branch builds in background. Next query hits real branch data. |
| Branches don't count toward repo limit | Branch is a feature of the repo, not a separate repo. Only the base repo counts. |
| 8 max workers | Server has enough RAM (24GB limit). 8 parallel indexing jobs across all orgs. |
| Single LanceDB per org, separate table per branch | Tables are lightweight (separate lance files). Same DB connection, filtered by project_id which includes branch. |
| Webhook-driven incremental for indexed branches | Push 3 files → fetch + diff → re-embed 3 files → 2-5 seconds. Near-instant updates. |

## Key Technical Details

### Project ID Format
```
{org_id}--{owner}_{repo}--{branch}
```
Example: `b2935e49--codewithinferno_lokus--main`

### Filesystem Layout (NEW with worktrees)
```
/data/orgs/{org_id}/
├── lancedb/                                    # ONE LanceDB per org
│   ├── entities_orgid--owner_repo--main.lance   # vectors for main
│   ├── entities_orgid--owner_repo--fix-auth.lance # vectors for branch
│   ├── state_orgid--owner_repo--main.lance
│   └── state_orgid--owner_repo--fix-auth.lance
├── metadata.db                                  # project/job records
└── repos/
    └── owner/repo/
        ├── .git/                # shared object store
        ├── (main files)         # default branch working tree
        └── .worktrees/
            ├── fix-auth/        # worktree
            └── feat-dashboard/  # worktree
```

### On-Demand Search Flow
```
Agent → POST /search { repo: "owner/repo", branch: "fix-auth", query: "..." }
  ├─ Branch indexed? YES → search branch table → return results
  └─ Branch indexed? NO
       ├─ Search main table → return results + { branch_status: "indexing", fell_back_to: "main" }
       └─ Background: git fetch → worktree add → copy main table → diff → re-embed changed files
           └─ Next search hits real branch data (~10-30s later)
```

### Incremental Branch Update Flow (webhook)
```
GitHub push to fix-auth →
  ├─ Branch indexed? YES → git fetch → diff → re-embed changed files (2-5s)
  └─ Branch indexed? NO → ignore (will index on-demand when searched)
```

## Files to Modify

### Engine (tryclean/)
| File | Changes |
|------|---------|
| `src/clean/repo/manager.py` | Add worktree methods, refactor clone to single-clone model |
| `src/clean/storage/lancedb.py` | Add `copy_table()` method |
| `src/clean/cloud/api.py` | Branch param in search, on-demand indexing, branch list endpoint |
| `src/clean/indexing/incremental.py` | Support diffing branch against main's state |
| `src/clean/jobs/worker.py` | Already at 8 workers (done) |

### Website (Website/)
| File | Changes |
|------|---------|
| `app/api/cloud-repos/route.ts` | Pass through job progress + branch info (partially done) |
| `app/dashboard/repositories/cloud-repos.tsx` | Progress bar (done), branch dropdown (Phase 4) |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Clone crash — "Repo not cloned" | 1 | Missing `branch=branch` in `update_remote_url` call |
| Status stuck at "Cloning..." forever | 1 | GET handler never polled engine. Added engine sync. |
| Stale Docker container name conflict | 1 | Force remove old containers before `docker compose up` |
| Partial clone dirs blocking re-clone | 1 | Added cleanup: remove dirs without `.git` before cloning |

## What's Already Deployed
- Engine with clone fix + partial dir cleanup + 8 workers + progress endpoint
- Engine container restarted and healthy
- Website status sync code (GET polls engine)
- Website progress UI code (not yet pushed to Vercel)

## What's NOT Yet Deployed/Tested
- Website progress UI needs commit + Vercel push
- End-to-end progress bar test during active indexing
- All branch indexing work (Phases 2-5)
