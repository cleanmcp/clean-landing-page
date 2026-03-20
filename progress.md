# Progress Log

## Session: 2026-03-08

### Completed
- [x] Fixed `branch=branch` bug in `manager.py:141` — was causing "Repo not cloned" error
- [x] Added partial clone dir cleanup in `manager.py:110-112` — removes dirs without `.git`
- [x] Bumped `max_workers` 4→8 in `cloud/api.py:648`
- [x] Added job progress to engine `GET /repos` endpoint (`cloud/api.py:1033-1056`)
- [x] Website GET `/api/cloud-repos` now syncs live status from engine
- [x] Website GET passes through job progress (phase, progress, files, entities)
- [x] Frontend `cloud-repos.tsx` shows progress bar + file count
- [x] Engine committed + pushed to `cleanmcp/Clean.git` main (commits: c700963, 6db7101)
- [x] Engine deployed to prod: git pull → docker compose build → docker compose up -d
- [x] Cleared stale error records from engine metadata.db
- [x] Cleaned up old clone dirs on server
- [x] Verified engine healthy: `{"status":"healthy","orgs_loaded":0,"version":"1.0.0"}`
- [x] Verified gateway healthy: `{"status":"ok","engineHealthy":true}`
- [x] User tested: indexing started successfully (lokus-ai/lokus indexing)

### Pending
- [x] Verify engine healthy after rebuild — confirmed: 7,512 entities indexed for lokus-ai/lokus
- [x] Commit + push Website progress UI — commit e236e9b pushed to master
- [ ] Verify progress bar renders during active indexing (need to trigger a new index)
- [ ] Deploy Phase 2 to production

### Phase 2 Implementation Complete
- [x] `repo/manager.py` — Full worktree refactor: blobless clones, per-repo locking, `.clean-meta.json`, create/remove/list worktrees, branch-aware exists/pull/delete
- [x] `storage/lancedb.py` — Added `copy_table()` for vector table bootstrapping (entity + state tables with project_id and path rebasing)
- [x] `cloud/api.py` — Wired everything together:
  - `_clone_and_index_cloud()`: Adds vector table bootstrap from main branch for non-default branches before incremental indexing
  - `search_code()`: Accepts `branch` parameter, falls back to main when branch not indexed, kicks off background on-demand branch indexing
  - `index_repo()`: Branches don't count toward repo limit, stores branch in ProjectRecord
  - `list_repos()`: Returns branch field per project
  - `repo_status()`: Returns branch field
  - `delete_repo()`: Properly handles branch worktree cleanup via `repo_manager.delete(repo, branch)`
  - New endpoint `GET /repos/branches?repo=owner/repo`: Lists all indexed branches for a repo
  - New helper `_start_background_branch_index()`: On-demand indexing triggered by search fallback

### Phase 2 Design Complete
- Full worktree refactor design doc produced by research agent
- Key insight: must switch from --depth=1 to --filter=blob:none (shallow clones can't use worktrees)
- Key insight: must rewrite file paths in ProjectState when copying table for branch bootstrap
- Key insight: need per-repo threading locks for concurrent worktree operations
- Design saved in findings.md

### Issues Hit
1. Docker stale container name conflict — fixed by `docker rm -f` before `compose up`
2. `npx tsx` can't do top-level await — used dynamic imports wrapper
3. Git "dubious ownership" on server — fixed with `git config --global --add safe.directory`
