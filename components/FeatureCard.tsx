"use client";

import Image from "next/image";

type FeaturePreviewVariant = "graph" | "plugins" | "sync" | "setup";

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  index?: number;
  previewVariant?: FeaturePreviewVariant;
}

/* ── Sync variant ─────────────────────────────────── */

function SyncVariant() {
  return (
    <div
      className="relative h-full overflow-hidden rounded-t-xl"
      style={{
        background: "linear-gradient(160deg, #152019 0%, #0d1710 60%, #090e09 100%)",
      }}
    >
      {/* Dot-grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(16,185,129,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          opacity: 0.5,
        }}
      />
      {/* Radial glow from below */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 120%, rgba(9,70,63,0.35), transparent 70%)",
        }}
      />

      <div className="relative p-4">
        {/* Tab pills */}
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white/40">
            Shared Context
          </span>
          <span className="rounded-full border border-emerald-400/[0.25] bg-emerald-400/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-emerald-300/60">
            auth/service.ts
          </span>
        </div>

        {/* Claude message */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/[0.1]">
            <Image
              src="/agents/claude.svg"
              alt="Claude"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="rounded-lg bg-white/[0.08] p-2.5 text-[11px] leading-relaxed text-white/90 ring-1 ring-white/[0.07]">
              <div className="mb-1 flex items-center justify-between text-[10px] text-emerald-200">
                <span>Claude</span>
                <span className="rounded-full bg-emerald-400/[0.12] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-300/80">
                  same file
                </span>
              </div>
              &ldquo;AuthService already caches user roles; no need to re-fetch.&rdquo;
            </div>

            {/* Cursor message */}
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/[0.08]">
                <Image
                  src="/agents/cursor.png"
                  alt="Cursor"
                  width={18}
                  height={18}
                  className="h-4 w-4 object-contain"
                />
              </div>
              <div className="flex-1 rounded-lg bg-white/[0.05] p-2.5 text-[11px] leading-relaxed text-white/70 ring-1 ring-white/[0.05]">
                <div className="mb-1 flex items-center justify-between text-[10px] text-emerald-200/60">
                  <span>Cursor</span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/40">
                    shared ctx
                  </span>
                </div>
                &ldquo;I&apos;ll update the tests for{" "}
                <code className="text-white/80">auth/service.ts</code> using
                that cached roles map.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Plugins variant ──────────────────────────────── */

function PluginsVariant() {
  return (
    <div className="relative h-full overflow-hidden rounded-t-xl bg-white/80">
      <div className="relative p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-black/70">
            Choose any agent
          </span>
          <span className="rounded-full border border-black/10 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]">
            MCP
          </span>
        </div>

        {/* Agent icons row with animated cursor */}
        <div className="feature-preview__agentsRow relative mt-3 flex items-center justify-between">
          <div className="feature-preview__agent feature-preview__agent--1">
            <Image
              src="/agents/claude.svg"
              alt="Claude"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="feature-preview__agent feature-preview__agent--2">
            <Image
              src="/agents/cursor.png"
              alt="Cursor"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="feature-preview__agent feature-preview__agent--3">
            <Image
              src="/agents/codex.png"
              alt="Codex"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="feature-preview__agent feature-preview__agent--4">
            <Image
              src="/agents/antigravity.png"
              alt="Antigravity"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="feature-preview__cursor" aria-hidden="true">
            <Image
              src="/mac.png"
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] object-contain opacity-95"
            />
          </div>
        </div>

        {/* Context chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-black/60">
            shared context
          </span>
          <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-black/60">
            repo index
          </span>
          <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-black/60">
            memories
          </span>
        </div>

        <div className="feature-preview__shine" />
      </div>
    </div>
  );
}

/* ── Graph variant ────────────────────────────────── */

function GraphVariant() {
  return (
    <div className="relative h-full overflow-hidden rounded-t-xl bg-[var(--cream-light)]">
      {/* Dot-grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(#00000012 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          opacity: 0.25,
        }}
      />

      <div className="relative h-full">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="60"
            y1="50"
            x2="240"
            y2="78"
            stroke="rgba(9,70,63,0.22)"
            strokeWidth="1.5"
          />
          <line
            x1="60"
            y1="50"
            x2="105"
            y2="150"
            stroke="rgba(9,70,63,0.22)"
            strokeWidth="1.5"
          />
        </svg>
        <div
          className="feature-preview__node"
          style={{
            position: "absolute",
            left: "calc(20% - 17px)",
            top: "calc(25% - 17px)",
          }}
        />
        <div
          className="feature-preview__node"
          style={{
            position: "absolute",
            left: "calc(80% - 17px)",
            top: "calc(39% - 17px)",
            animationDelay: "0.3s",
          }}
        />
        <div
          className="feature-preview__node"
          style={{
            position: "absolute",
            left: "calc(35% - 17px)",
            top: "calc(75% - 17px)",
            animationDelay: "0.6s",
          }}
        />
      </div>
    </div>
  );
}

/* ── Setup variant — terminal aesthetic ───────────── */

function SetupVariant() {
  return (
    <div className="relative h-full overflow-hidden rounded-t-xl bg-[#1e1e1e]">
      <div className="p-5">
        {/* Prompt line */}
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px]">
          <span className="text-emerald-500/80">$</span>
          <span className="text-white/70">npx clean setup</span>
        </div>

        {/* Status lines */}
        <div className="space-y-3 font-mono text-[11px]">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400">✓</span>
            <span className="text-white/60">Repository indexed</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400">✓</span>
            <span className="text-white/60">Context synced</span>
          </div>
          <div className="-mx-2 flex items-center gap-2.5 rounded-md bg-[var(--accent)]/[0.08] px-2 py-1.5">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-white/80">Connecting agents...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Variant picker ───────────────────────────────── */

function pickVariant(title: string): FeaturePreviewVariant {
  const t = title.toLowerCase();
  if (t.includes("sync")) return "sync";
  if (t.includes("compat") || t.includes("universal")) return "plugins";
  if (t.includes("team") || t.includes("align")) return "graph";
  if (t.includes("setup") || t.includes("one-time") || t.includes("configure"))
    return "setup";
  return "sync";
}

const VARIANTS: Record<FeaturePreviewVariant, () => React.ReactElement> = {
  sync: SyncVariant,
  plugins: PluginsVariant,
  graph: GraphVariant,
  setup: SetupVariant,
};

/* ── Card shell ───────────────────────────────────── */

export default function FeatureCard({
  title,
  description,
  index = 0,
  previewVariant,
}: FeatureCardProps) {
  const variant =
    previewVariant ??
    pickVariant(title) ??
    (["sync", "plugins", "graph", "setup"] as const)[index % 4];

  const VariantComponent = VARIANTS[variant];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--cream-dark)]"
      style={{
        background: "var(--cream-light)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}
    >
      {/* Fixed-height text section */}
      <div className="h-[88px] p-4">
        <h3 className="mb-1 text-xl font-semibold text-[var(--ink)]">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--ink-light)]">
          {description}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--cream-dark)]" />

      {/* Preview area — flex-1, clips the 16px bleed */}
      <div className="relative flex-1 overflow-hidden">
        {/* Inner box: mt-4 + h-full bleeds 16px below, clipped by parent */}
        <div className="mx-4 mt-4 h-full overflow-hidden rounded-t-xl">
          <VariantComponent />
        </div>
      </div>
    </div>
  );
}
