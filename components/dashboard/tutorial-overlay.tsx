"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  ArrowRight,
  Check,
  X,
  Github,
  Plus,
  Sparkles,
  Copy,
  Rocket,
} from "lucide-react";

/* ─── Step definitions ─── */

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetPage: string; // pathname where this step is relevant
  highlightSelector?: string; // CSS selector of element to highlight
  sidebarHighlight?: string; // sidebar nav label to highlight
  position?: "center" | "top" | "bottom"; // tooltip position relative to highlight
  icon: React.ComponentType<{ className?: string }>;
  action?: "navigate" | "click" | "wait" | "done";
}

const STEPS: TutorialStep[] = [
  {
    id: "go-to-repos",
    title: "Go to Repositories",
    description:
      "First, let's connect your GitHub repos. Click on Repositories in the sidebar.",
    targetPage: "/dashboard",
    sidebarHighlight: "Repositories",
    icon: GitBranch,
    action: "navigate",
  },
  {
    id: "connect-github",
    title: "Connect GitHub",
    description:
      'Click "Connect GitHub" to install the Clean GitHub App on your account.',
    targetPage: "/dashboard/repositories",
    highlightSelector: '[data-tutorial="connect-github"]',
    icon: Github,
    action: "click",
  },
  {
    id: "install-app",
    title: "Install the GitHub App",
    description:
      "Follow the GitHub prompts to install the app. Once done, you'll be redirected back here.",
    targetPage: "/dashboard/repositories",
    highlightSelector: '[data-tutorial="install-github-app"]',
    icon: Github,
    action: "click",
  },
  {
    id: "pick-repo",
    title: "Pick a Repository",
    description:
      "Select a repository to index. Clean will analyze your codebase to provide intelligent search.",
    targetPage: "/dashboard/repositories",
    highlightSelector: '[data-tutorial="add-repos"]',
    icon: Plus,
    action: "click",
  },
  {
    id: "wait-indexing",
    title: "Wait for Indexing",
    description:
      "Your repository is being indexed. This takes a few minutes. Once it's done, an API key will be created for you automatically — hang tight!",
    targetPage: "/dashboard/repositories",
    icon: Sparkles,
    action: "wait",
    position: "center",
  },
  {
    id: "mcp-config",
    title: "Set Up MCP Configuration",
    description:
      "Your API key is ready. Copy the MCP configuration for your editor and paste it into your settings to start searching with Clean.",
    targetPage: "/dashboard/onboarding",
    highlightSelector: '[data-tutorial="mcp-config"]',
    icon: Copy,
    action: "wait",
  },
  {
    id: "done",
    title: "You're All Set!",
    description: "",
    targetPage: "/dashboard/keys",
    icon: Rocket,
    action: "done",
  },
];

/* ─── Pulsing ring around highlighted elements ─── */

function HighlightRing({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        // Element might still be in DOM but offscreen / zero-size during unmount
        if (r.width > 0 && r.height > 0) {
          setRect(r);
          setVisible(true);
          return;
        }
      }
      setVisible(false);
    }
    update();
    // Use a MutationObserver to react instantly when the element leaves the DOM
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [selector]);

  if (!rect || !visible) return null;

  const pad = 6;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9998]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    >
      {/* Highlight cutout glow */}
      <div className="absolute inset-0 rounded-xl border-2 border-[#1772E7] shadow-[0_0_20px_rgba(23,114,231,0.4)]" />
      {/* Pulsing ring */}
      <div className="absolute inset-0 rounded-xl border-2 border-[#1772E7] animate-ping opacity-30" />
    </motion.div>
  );
}

/* ─── Sidebar highlight ring ─── */

function SidebarHighlight({ label }: { label: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      const links = document.querySelectorAll("aside a, aside button");
      for (const el of links) {
        if (el.textContent?.trim() === label) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            setRect(r);
            setVisible(true);
            return;
          }
        }
      }
      setVisible(false);
    }
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [label]);

  if (!rect || !visible) return null;

  const pad = 4;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9998]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    >
      <div className="absolute inset-0 rounded-lg border-2 border-[#1772E7] shadow-[0_0_15px_rgba(23,114,231,0.4)]" />
      <div className="absolute inset-0 rounded-lg border-2 border-[#1772E7] animate-ping opacity-30" />
    </motion.div>
  );
}

/* ─── Completion modal ─── */

function DoneModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-[#27272a] bg-[#09090b] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">You&apos;re all set!</h2>
          <p className="mt-2 text-sm text-[#a1a1aa] leading-relaxed">
            You&apos;ve completed the setup. Your repos are indexed, your API key is ready, and
            your editor is configured. Start searching your codebase with Clean!
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-[#1772E7] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
            >
              Let&apos;s go!
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── localStorage helpers ─── */

const STORAGE_KEY = "clean-tutorial";

function loadTutorialState(): { step: number; dismissed: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { step: 0, dismissed: false };
}

function saveTutorialState(step: number, dismissed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, dismissed }));
  } catch {}
}

/* ─── Main tutorial overlay ─── */

export default function TutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(() => loadTutorialState().step);
  const [dismissed, setDismissed] = useState(() => loadTutorialState().dismissed);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [hydrated] = useState(true);

  // Persist every time step or dismissed changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveTutorialState(currentStep, dismissed);
  }, [currentStep, dismissed, hydrated]);

  const step = STEPS[currentStep];

  // Listen for page navigation to auto-advance steps
  useEffect(() => {
    if (!hydrated || dismissed || !step) return;

    // Auto-advance if we navigated to the right page
    if (step.id === "go-to-repos" && pathname.startsWith("/dashboard/repositories")) {
      startTransition(() => setCurrentStep(1));
    }
    // When onboarding lands on the MCP config step, auto-advance to it
    if (step.id === "wait-indexing" && pathname.startsWith("/dashboard/onboarding")) {
      startTransition(() => {
        setCurrentStep((prev) => {
          const mcpStep = STEPS.findIndex((s) => s.id === "mcp-config");
          return mcpStep > prev ? mcpStep : prev;
        });
      });
    }
  }, [pathname, step, dismissed, currentStep, hydrated]);

  const handleNext = useCallback(() => {
    const nextIdx = currentStep + 1;
    if (nextIdx >= STEPS.length) {
      setShowDoneModal(true);
      return;
    }

    const nextStep = STEPS[nextIdx];

    // If next step is on a different page, navigate
    if (nextStep.sidebarHighlight === "Repositories") {
      router.push("/dashboard/repositories");
    }

    setCurrentStep(nextIdx);
  }, [currentStep, router]);

  const handleSkip = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleDoneClose = useCallback(() => {
    setShowDoneModal(false);
    setDismissed(true);
  }, []);

  // Don't render until localStorage is read (avoids flash of wrong step)
  if (!hydrated) return null;

  if (dismissed && !showDoneModal) return null;

  if (!step) return null;

  const Icon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <>
      <AnimatePresence>
        {showDoneModal && <DoneModal onClose={handleDoneClose} />}
      </AnimatePresence>

      {!dismissed && !showDoneModal && (
        <>
          {/* Highlight ring on target element */}
          <AnimatePresence>
            {step.highlightSelector && <HighlightRing key={step.highlightSelector} selector={step.highlightSelector} />}
          </AnimatePresence>

          {/* Sidebar highlight */}
          <AnimatePresence>
            {step.sidebarHighlight && <SidebarHighlight key={step.sidebarHighlight} label={step.sidebarHighlight} />}
          </AnimatePresence>

          {/* Bottom tutorial card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed bottom-6 left-1/2 z-[9999] w-[90vw] max-w-lg -translate-x-1/2 md:left-[calc(130px+50%)] md:-translate-x-1/2"
            >
              <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#0c0c0f]/95 shadow-2xl backdrop-blur-xl">
                {/* Progress bar */}
                <div className="h-1 w-full bg-[#27272a]">
                  <motion.div
                    className="h-full bg-[#1772E7]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1772E7]/10 ring-1 ring-[#1772E7]/30">
                        <Icon className="h-4.5 w-4.5 text-[#1772E7]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#a1a1aa]">
                            Step {currentStep + 1} of {STEPS.length}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      </div>
                    </div>
                    <button
                      onClick={handleSkip}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-white"
                      aria-label="Dismiss tutorial"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                    {step.description}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={handleSkip}
                      className="text-xs font-medium text-[#a1a1aa] transition-colors hover:text-white"
                    >
                      Skip tutorial
                    </button>
                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <button
                          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                          className="rounded-lg border border-[#27272a] px-3 py-1.5 text-xs font-medium text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-white"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1.5 rounded-lg bg-[#1772E7] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1565d0]"
                      >
                        {step.action === "done" ? "Finish" : "Next"}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="fixed bottom-2 left-1/2 z-[9999] flex -translate-x-1/2 gap-1 md:left-[calc(130px+50%)]">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-4 bg-[#1772E7]"
                    : i < currentStep
                      ? "w-1.5 bg-[#1772E7]/50"
                      : "w-1.5 bg-[#27272a]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
