"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  GitBranch,
  Key,
  BarChart3,
  Users,
  CreditCard,
  BookOpen,
  Search,
  X,
  ArrowUpRight,
  Plus,
  Settings,
} from "lucide-react";
import { PlanPickerDialog } from "@/components/dashboard/plan-picker-dialog";

/* ─── Nav config ─── */

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  exact?: boolean;
  external?: boolean;
}

const MENU_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/dashboard/repositories", icon: GitBranch, label: "Repositories" },
  { href: "/dashboard/keys", icon: Key, label: "Keys" },
  { href: "/dashboard/usage", icon: BarChart3, label: "Usage" },
  { href: "/dashboard/team", icon: Users, label: "Team" },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  {
    href: "https://docs.tryclean.ai",
    icon: BookOpen,
    label: "Documentation",
    external: true,
  },
];

/* ─── Plan indicator ─── */

interface PlanInfo {
  tier: string;
  tokenUsage?: { used: number; limit: number } | null;
}

function PlanIndicator({ plan, onUpgrade }: { plan: PlanInfo | null; onUpgrade: () => void }) {
  if (!plan) return null;

  const tierLabel =
    plan.tier === "enterprise"
      ? "Enterprise"
      : plan.tier === "team"
        ? "Team Plan"
        : plan.tier === "pro"
          ? "Pro Plan"
          : "Free Plan";

  const isFree = !plan.tier || plan.tier === "free";
  const usage = plan.tokenUsage;
  const pct = usage && usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

  function formatTokens(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-3">
      <p className="text-sm font-semibold text-sidebar-foreground">{tierLabel}</p>
      {usage && usage.limit > 0 && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTokens(usage.used)} / {formatTokens(usage.limit)} tokens
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
      {isFree && (
        <button
          onClick={onUpgrade}
          className="mt-2 inline-block text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Upgrade →
        </button>
      )}
    </div>
  );
}

/* ─── Nav link ─── */

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const classes = active
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      <span className="text-sm font-medium">{item.label}</span>
      {item.external && (
        <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-40" />
      )}
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${classes}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${classes}`}
    >
      {inner}
    </Link>
  );
}

/* ─── Section label ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

/* ─── Command palette items ─── */

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  section: string;
  keywords?: string[];
  external?: boolean;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "Pages", keywords: ["home", "dashboard"] },
  { id: "repos", label: "Repositories", href: "/dashboard/repositories", icon: GitBranch, section: "Pages", keywords: ["repos", "github", "index"] },
  { id: "keys", label: "API Keys", href: "/dashboard/keys", icon: Key, section: "Pages", keywords: ["api", "token", "secret"] },
  { id: "usage", label: "Usage", href: "/dashboard/usage", icon: BarChart3, section: "Pages", keywords: ["stats", "analytics", "metrics"] },
  { id: "team", label: "Team", href: "/dashboard/team", icon: Users, section: "Pages", keywords: ["members", "invite", "people"] },
  { id: "billing", label: "Billing", href: "/dashboard/billing", icon: CreditCard, section: "Pages", keywords: ["plan", "subscription", "payment"] },
  { id: "new-key", label: "Create API Key", href: "/dashboard/keys/new", icon: Plus, section: "Actions", keywords: ["new", "generate", "add"] },
  { id: "add-repo", label: "Add Repository", href: "/dashboard/repositories/add", icon: Plus, section: "Actions", keywords: ["new", "index", "github"] },
  { id: "onboarding", label: "Setup Wizard", href: "/dashboard/onboarding", icon: Settings, section: "Actions", keywords: ["onboard", "configure", "setup"] },
  { id: "docs", label: "Documentation", href: "https://docs.tryclean.ai", icon: BookOpen, section: "Links", keywords: ["help", "guide", "api"], external: true },
];

/* ─── Command palette ─── */

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = query.trim() === ""
    ? COMMAND_ITEMS
    : COMMAND_ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.includes(q))
        );
      });

  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = useCallback((item: CommandItem) => {
    onClose();
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  }, [onClose, router]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        select(filtered[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, filtered, activeIndex, select, onClose]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[#27272a] bg-[#09090b] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#27272a] px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-[#27272a] bg-[#18181b] px-2 py-0.5 text-xs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            sections.map((section) => (
              <div key={section}>
                <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {section}
                </p>
                {filtered
                  .filter((i) => i.section === section)
                  .map((item) => {
                    flatIdx++;
                    const idx = flatIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => select(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          activeIndex === idx
                            ? "bg-[#1772E7]/15 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.external && (
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-40" />
                        )}
                        {activeIndex === idx && (
                          <span className="text-xs text-muted-foreground">↵</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar content (shared between desktop and mobile drawer) ─── */

function SidebarContent({
  plan,
  onNavClick,
  onOpenSearch,
  onUpgrade,
}: {
  plan: PlanInfo | null;
  onNavClick?: () => void;
  onOpenSearch: () => void;
  onUpgrade: () => void;
}) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.external) return false;
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-3 pt-1 pb-2">
        <Image src="/landing/clean-icon.svg" alt="" width={22} height={22} />
        <span className="text-lg font-bold tracking-tight text-foreground">
          lean.ai
        </span>
      </div>

      {/* Search bar — opens command palette */}
      <div className="mt-3 px-0">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 transition-colors hover:border-muted-foreground/30"
        >
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="flex-1 text-left text-sm text-muted-foreground">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav: MENU */}
      <nav className="mt-6 flex flex-col gap-1">
        <SectionLabel>Menu</SectionLabel>
        <div className="mt-2 flex flex-col gap-0.5">
          {MENU_ITEMS.map((item) => (
            <div key={item.href} onClick={onNavClick}>
              <NavLink item={item} active={isActive(item)} />
            </div>
          ))}
        </div>
      </nav>

      {/* Nav: ACCOUNT */}
      <nav className="mt-6 flex flex-col gap-1">
        <SectionLabel>Account</SectionLabel>
        <div className="mt-2 flex flex-col gap-0.5">
          {ACCOUNT_ITEMS.map((item) => (
            <div key={item.href} onClick={item.external ? undefined : onNavClick}>
              <NavLink item={item} active={isActive(item)} />
            </div>
          ))}
        </div>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Plan indicator */}
      <PlanIndicator plan={plan} onUpgrade={onUpgrade} />

      {/* Clerk user button */}
      <div className="mt-3 flex items-center gap-3 rounded-lg px-1 py-2">
        <UserButton
          appearance={{
            variables: {
              colorPrimary: "#1772E7",
              colorBackground: "#09090b",
              colorInputBackground: "#09090b",
              colorText: "#fafafa",
              colorTextSecondary: "#a1a1aa",
              colorNeutral: "#fafafa",
            },
            elements: {
              avatarBox: "h-8 w-8",
              userButtonPopoverCard: "bg-[#09090b] border border-[#27272a]",
            },
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main Sidebar export ─── */

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const pathname = usePathname();

  // Mobile drawer closes via onNavClick prop on SidebarContent

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Fetch plan info
  useEffect(() => {
    fetch("/api/org")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.org) {
          setPlan({
            tier: data.org.tier ?? "free",
            tokenUsage: null,
          });
        } else {
          setPlan({ tier: "free", tokenUsage: null });
        }
      })
      .catch(() => setPlan({ tier: "free", tokenUsage: null }));
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openUpgrade = useCallback(() => setUpgradeOpen(true), []);

  return (
    <>
      {/* Command palette */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Plan picker dialog */}
      <PlanPickerDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <SidebarContent plan={plan} onOpenSearch={openSearch} onUpgrade={openUpgrade} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-sidebar-border bg-sidebar p-4 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <SidebarContent plan={plan} onNavClick={() => setMobileOpen(false)} onOpenSearch={openSearch} onUpgrade={openUpgrade} />
          </aside>
        </div>
      )}

      <MobileTogglePortal onToggle={() => setMobileOpen(true)} />
    </>
  );
}

function MobileTogglePortal({ onToggle }: { onToggle: () => void }) {
  useEffect(() => {
    const handler = () => onToggle();
    window.addEventListener("dash-sidebar-toggle", handler);
    return () => window.removeEventListener("dash-sidebar-toggle", handler);
  }, [onToggle]);

  return null;
}
