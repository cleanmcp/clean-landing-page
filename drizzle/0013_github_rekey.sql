-- Phase 1: Rekey github_installations from (org_id, installation_id) to (org_id, account_login)

-- Step 1: Deactivate duplicate (org_id, account_login) rows, keeping the one with the highest installation_id
UPDATE github_installations SET active = false, updated_at = now()
WHERE id IN (
    SELECT id FROM (
        SELECT id,
            ROW_NUMBER() OVER (PARTITION BY org_id, account_login ORDER BY installation_id DESC) as rn
        FROM github_installations
    ) ranked
    WHERE rn > 1
);

-- Step 2: Drop old unique index on (org_id, installation_id) if it exists
DROP INDEX IF EXISTS github_installations_org_installation_uniq;

-- Step 3: Delete fully duplicate rows (same org_id + account_login) keeping only the latest
-- First delete inactive duplicates where an active one exists
DELETE FROM github_installations
WHERE id IN (
    SELECT gi.id FROM github_installations gi
    INNER JOIN (
        SELECT org_id, account_login, MAX(installation_id) as max_install
        FROM github_installations
        GROUP BY org_id, account_login
    ) keep ON gi.org_id = keep.org_id AND gi.account_login = keep.account_login
    WHERE gi.installation_id != keep.max_install
);

-- Step 4: Add new unique constraint on (org_id, account_login)
CREATE UNIQUE INDEX github_installations_org_account_uniq
    ON github_installations (org_id, account_login);
