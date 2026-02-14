import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable("users", {
  // Clerk user IDs are strings (e.g. "user_2abc..."), not UUIDs
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  image: text("image"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export type OrgMetadata = {
  role?: string;
  teamSize?: string;
  heardFrom?: string;
  primaryTool?: string;
};

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    metadata: jsonb("metadata").$type<OrgMetadata>(),
    licenseKey: text("license_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("organizations_slug_idx").on(table.slug)]
);

// ============================================================================
// ORG MEMBERS
// ============================================================================

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<OrgRole>().notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orgId, table.userId] }),
    index("org_members_user_id_idx").on(table.userId),
    index("org_members_org_id_idx").on(table.orgId),
  ]
);

// ============================================================================
// API KEYS
// ============================================================================

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").array().notNull(),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_org_id_idx").on(table.orgId),
    index("api_keys_key_prefix_idx").on(table.keyPrefix),
    index("api_keys_created_by_id_idx").on(table.createdById),
  ]
);

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_org_id_idx").on(table.orgId),
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// ============================================================================
// SEARCH LOGS
// ============================================================================

export const searchLogs = pgTable(
  "search_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id),
    repo: text("repo").notNull(),
    query: text("query").notNull(),
    resultCount: integer("result_count").notNull(),
    jsonChars: integer("json_chars").notNull(),
    toonChars: integer("toon_chars").notNull(),
    charsSaved: integer("chars_saved").notNull(),
    tokensSavedEst: integer("tokens_saved_est").notNull(),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("search_logs_org_id_idx").on(table.orgId),
    index("search_logs_api_key_id_idx").on(table.apiKeyId),
    index("search_logs_created_at_idx").on(table.createdAt),
    index("search_logs_repo_idx").on(table.repo),
  ]
);

// ============================================================================
// TUNNELS
// ============================================================================

export const tunnels = pgTable(
  "tunnels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    cloudflareTunnelId: text("cloudflare_tunnel_id").notNull(),
    hostname: text("hostname").notNull().unique(),
    dnsRecordId: text("dns_record_id").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tunnels_cloudflare_tunnel_id_idx").on(table.cloudflareTunnelId),
  ]
);
