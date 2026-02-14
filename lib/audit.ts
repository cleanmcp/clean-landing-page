import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/**
 * Fire-and-forget audit log entry.
 * Never throws — logs errors to console but doesn't break the caller.
 */
export function audit(entry: {
  orgId?: string | null;
  userId?: string | null;
  apiKeyId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  db.insert(auditLogs)
    .values({
      orgId: entry.orgId ?? undefined,
      userId: entry.userId ?? undefined,
      apiKeyId: entry.apiKeyId ?? undefined,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? undefined,
      metadata: entry.metadata ?? undefined,
      ipAddress: entry.ipAddress ?? undefined,
    })
    .catch((err) => {
      console.error("Audit log failed:", err);
    });
}
