import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  boolean,
  index,
  boolean,
  pgEnum,
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
// WAITLIST
// ============================================================================

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    status: waitlistStatusEnum("status").notNull().default("pending"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),
  },
  (table) => [
    index("waitlist_email_idx").on(table.email),
    index("waitlist_status_idx").on(table.status),
    index("waitlist_created_at_idx").on(table.createdAt),
  ]
);

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
    clerkOrgId: text("clerk_org_id"),
    metadata: jsonb("metadata").$type<OrgMetadata>(),
    licenseKey: text("license_key"),
    tier: text("tier").$type<"free" | "starter" | "pro" | "enterprise">().default("free"),
    seatLimit: integer("seat_limit"), // null = unlimited
    licenseExpiresAt: timestamp("license_expires_at"),
    licenseJti: text("license_jti"),
    licenseRevoked: boolean("license_revoked").default(false),
    // Stripe
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("organizations_slug_idx").on(table.slug),
    index("organizations_clerk_org_id_idx").on(table.clerkOrgId),
    index("organizations_stripe_customer_id_idx").on(table.stripeCustomerId),
  ]
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
      .references(() => users.id, { onDelete: "set null" }),
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
// ORG TOKENS
// ============================================================================

export const orgTokens = pgTable(
  "org_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("default"),
    tokenHash: text("token_hash").notNull().unique(),
    lastSeenAt: timestamp("last_seen_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("org_tokens_org_id_idx").on(table.orgId),
    index("org_tokens_token_hash_idx").on(table.tokenHash),
  ]
);

// ============================================================================
// INVITES
// ============================================================================

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    role: text("role").$type<OrgRole>().notNull().default("MEMBER"),
    email: text("email"),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invites_org_id_idx").on(table.orgId),
    index("invites_token_idx").on(table.token),
  ]
);

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid"
  | "paused";

export type Plan = "starter" | "pro" | "enterprise";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status").$type<SubscriptionStatus>().notNull(),
    plan: text("plan").$type<Plan>().notNull(),
    stripePriceId: text("stripe_price_id").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at"),
    trialEnd: timestamp("trial_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_org_id_idx").on(table.orgId),
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("subscriptions_status_idx").on(table.status),
  ]
);

// ============================================================================
// PAYMENT TRANSACTIONS
// ============================================================================

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" }
    ),
    stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    amountPaid: integer("amount_paid").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull(),
    billingReason: text("billing_reason"),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payment_transactions_subscription_id_idx").on(table.subscriptionId),
    index("payment_transactions_org_id_idx").on(table.orgId),
    index("payment_transactions_user_id_idx").on(table.userId),
  ]
);

// ============================================================================
// STRIPE WEBHOOK EVENTS (idempotency guard)
// ============================================================================

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(), // Stripe event ID (evt_xxx)
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});
