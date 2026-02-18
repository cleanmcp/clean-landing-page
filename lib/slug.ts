// Reserved slugs that conflict with infrastructure subdomains
const RESERVED_SLUGS = new Set([
  "www", "api", "app", "admin", "dashboard", "mail", "status",
  "docs", "blog", "cdn", "staging", "dev", "test", "support",
  "help", "billing", "auth", "login", "signup", "clean",
]);

/**
 * Generate a valid slug from an org name.
 * Rules: 3-63 chars, starts/ends with alphanumeric, only lowercase alphanumeric + hyphens.
 */
export function generateSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Ensure it starts and ends with alphanumeric
  slug = slug.replace(/^[^a-z0-9]+/, "").replace(/[^a-z0-9]+$/, "");

  if (!slug || slug.length < 3) {
    slug = slug ? slug + "-org" : "org";
  }

  // Truncate to 63 chars max (valid subdomain length)
  if (slug.length > 63) {
    slug = slug.slice(0, 63).replace(/-+$/, "");
  }

  return slug;
}

/**
 * Validate a slug meets all requirements.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Slug must be at least 3 characters";
  if (slug.length > 63) return "Slug must be at most 63 characters";
  if (!/^[a-z0-9]/.test(slug)) return "Slug must start with a letter or number";
  if (!/[a-z0-9]$/.test(slug)) return "Slug must end with a letter or number";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 3) {
    return "Slug can only contain lowercase letters, numbers, and hyphens";
  }
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved and cannot be used`;
  return null;
}
