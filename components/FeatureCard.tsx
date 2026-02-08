"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type FeaturePreviewVariant = "graph" | "plugins" | "sync" | "setup";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
  previewVariant?: FeaturePreviewVariant;
}

function FeaturePreview({ variant }: { variant: FeaturePreviewVariant }) {
  return (
    <div className="feature-preview mt-5 overflow-hidden rounded-xl border border-black/10 bg-[var(--cream-light)]">
      <div className="feature-preview__topbar flex items-center gap-1.5 border-b border-black/10 bg-white/40 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/5" />
        <span className="ml-2 text-[10px] font-medium tracking-wide text-black/40">
          Preview
        </span>
      </div>

      <div className="feature-preview__body relative p-4">
        {/* Subtle dotted grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:radial-gradient(#00000012_1px,transparent_1px)] [background-size:16px_16px]" />

        {variant === "graph" && (
          <div className="relative h-[140px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 140" preserveAspectRatio="none" aria-hidden="true">
              {/* Lines connecting node centers */}
              <line x1="60" y1="35" x2="240" y2="55" stroke="rgba(9,70,63,0.22)" strokeWidth="1.5" />
              <line x1="60" y1="35" x2="105" y2="105" stroke="rgba(9,70,63,0.22)" strokeWidth="1.5" />
            </svg>
            {/* Nodes use same coordinate basis: viewBox is 300×140 mapped to full container */}
            <div className="feature-preview__node" style={{ position: 'absolute', left: 'calc(20% - 17px)', top: 'calc(25% - 17px)' }} />
            <div className="feature-preview__node" style={{ position: 'absolute', left: 'calc(80% - 17px)', top: 'calc(39.3% - 17px)', animationDelay: '0.3s' }} />
            <div className="feature-preview__node" style={{ position: 'absolute', left: 'calc(35% - 17px)', top: 'calc(75% - 17px)', animationDelay: '0.6s' }} />
          </div>
        )}

        {variant === "plugins" && (
          <div className="relative h-[140px] overflow-hidden rounded-xl bg-white/70 p-4 text-[var(--ink)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-black/70">
                Choose any agent
              </span>
              <span className="rounded-full border border-black/10 bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]">
                MCP
              </span>
            </div>

            {/* Agent icons (white UI) */}
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
                  src="/agents/windsurf.svg"
                  alt="Windsurf"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>

              {/* Animated cursor that "hovers" different icons */}
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

            {/* Context "chips" that appear as selections */}
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
        )}

        {variant === "sync" && (
          <div className="relative h-[140px] overflow-hidden rounded-xl bg-[var(--ink)] p-4 text-white">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                shared context
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                auth/service.ts
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Image
                  src="/agents/claude.svg"
                  alt="Claude"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-lg bg-white/8 p-2 text-[11px] leading-relaxed text-white/90">
                  <div className="flex items-center justify-between text-[10px] text-emerald-200">
                    <span>Claude</span>
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-100">
                      same file
                    </span>
                  </div>
                  <div className="mt-1">“AuthService already caches user roles; no need to re-fetch.”</div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    <Image
                      src="/agents/cursor.png"
                      alt="Cursor"
                      width={18}
                      height={18}
                      className="h-4 w-4 object-contain"
                    />
                  </div>
                  <div className="flex-1 rounded-lg bg-white/6 p-2 text-[11px] leading-relaxed text-white/85">
                    <div className="flex items-center justify-between text-[10px] text-emerald-200/90">
                      <span>Cursor</span>
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-100/90">
                        shared context
                      </span>
                    </div>
                    <div className="mt-1">
                      “I’ll update the tests for <code className="text-white">auth/service.ts</code> using that cached roles map.”
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-preview__scanline" />
          </div>
        )}

        {variant === "setup" && (
          <div className="relative h-[140px] overflow-hidden rounded-xl bg-white/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)]/15" />
              <div className="flex-1">
                <div className="h-2 w-32 rounded bg-black/20" />
                <div className="mt-1 h-2 w-24 rounded bg-black/10" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                Clean
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-40 rounded bg-black/10" />
              <div className="h-2 w-44 rounded bg-black/10" />
              <div className="h-2 w-36 rounded bg-black/10" />
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded bg-black/10">
              <div className="feature-preview__progress h-full w-1/2 rounded bg-[var(--accent)]/70" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pickVariantFromTitle(title: string): FeaturePreviewVariant {
  const t = title.toLowerCase();
  if (t.includes("sync")) return "sync";
  if (t.includes("compat") || t.includes("universal")) return "plugins";
  if (t.includes("team") || t.includes("align")) return "graph";
  if (t.includes("setup") || t.includes("one-time") || t.includes("configure"))
    return "setup";
  return "sync";
}

export default function FeatureCard({
  title,
  description,
  index = 0,
  previewVariant,
}: FeatureCardProps) {
  const variant =
    previewVariant ?? pickVariantFromTitle(title) ?? (["sync", "plugins", "graph", "setup"] as const)[index % 4];

  return (
    <motion.div
      className="group rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] p-6 transition-all hover:border-[var(--accent)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
 
      <h3 className="mb-2 text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--ink-light)]">
        {description}
      </p>

      <div className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
        <FeaturePreview variant={variant} />
      </div>
    </motion.div>
  );
}
