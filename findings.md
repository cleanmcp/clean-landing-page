# Findings

## Engine Architecture (from code reading)

### Multi-Tenancy Model
- **OrgRouter** (`cloud/org_router.py`): Per-org filesystem isolation under `/data/orgs/{org_id}/`
- Each org gets: own LanceDB, own metadata.db (SQLite), own repos dir
- Containers cached in memory with LRU eviction after 10min idle
- Shared embedding model across orgs (SentenceTransformerEmbedder, all-MiniLM-L6-v2, 384 dims)
- Org ID validated: `^[a-zA-Z0-9\-]{1,64}$`, path traversal blocked

### Auth Flow
- Gateway trust: `X-Engine-Secret` (HMAC timing-safe) + `X-Clean-Org-Id` headers
- Direct Bearer: `clean_sk_*` verified against `cloud.db`
- All requests resolve to `org_id` → scoped to that org's data

### Data Isolation (Security)
- Search always goes through `router.get_container(org_id)` → org-scoped LanceDB
- No cross-org query path exists — store instance itself is scoped
- Cannot trick via project_id — auth resolves org_id independently

### LanceDB Storage Model
- ONE LanceDB connection per org (not per repo/branch)
- Each project_id gets its own table: `entities_{project_id}` and `state_{project_id}`
- Tables are lightweight lance files on disk
- Has rebuild-table pattern: build new table, swap atomically (zero-downtime re-index)
- `copy_table()` does NOT exist yet — needs to be added for branch optimization

### Incremental Indexing
- `IncrementalIndexer.detect_changes()`:
  1. First index: everything new → full index
  2. Re-index: `git diff --name-only {stored_head}..HEAD` → only changed files
  3. Fallback: SHA-256 hash comparison if git diff fails
- `ProjectState` stores git HEAD hash + per-file content hashes
- Only works on re-index of existing clone (not fresh clone)

### Job Worker
- `ThreadPoolExecutor(max_workers=8)` — 8 parallel indexing jobs globally
- Jobs persisted in SQLite for crash recovery
- Stale jobs (from server restart) auto-marked as failed
- Supports cancel via `cancel_requested` flag

### Current Clone Model (to be replaced)
- Separate clone per branch: `owner/repo@branch`
- Each branch = full shallow clone (`--depth=1`)
- Wastes disk for multi-branch scenarios

## Production Server
- IP: 206.180.209.252
- Docker: engine (port 8000) + gateway (port 4000) on same network
- Engine data volume: `clean_engine-data` mounted at `/data/orgs`
- Engine memory limit: 24GB, reservation: 4GB
- Health check: 30s interval, 120s start period for model warmup

## Git Worktrees (research for Phase 2)
- `git worktree add <path> <branch>` — creates lightweight checkout
- Shares `.git/objects` — no duplicate object storage
- Multiple worktrees can be read simultaneously (parallel indexing)
- `git worktree remove <path>` — clean removal
- `git fetch origin <branch>` needed before worktree if branch not yet fetched
- Worktree creation: ~1-2 seconds (just file checkout)
- Cannot have two worktrees for the same branch
