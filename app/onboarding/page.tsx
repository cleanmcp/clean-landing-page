"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OnboardingData = {
  step: number;
  orgName: string;
  orgSlug: string;
  metadata: {
    role?: string;
    teamSize?: string;
    heardFrom?: string;
    primaryTool?: string;
  };
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 2;
const DONE_STEP = 2; // step >= 2 means onboarding complete

const TOOLS = [
  {
    id: "claude_code",
    label: "Claude Code",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "cursor",
    label: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "windsurf",
    label: "Windsurf",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <path
          d="M3 20C8 10 13 6 21 4c-3 4-6 8-8 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 20c5-2 10-2 15 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const ROLES = [
  { id: "developer", label: "Developer" },
  { id: "eng_manager", label: "Eng Manager" },
  { id: "cto", label: "CTO / Founder" },
  { id: "other", label: "Other" },
];

const TEAM_SIZES = [
  { id: "just_me", label: "Just me" },
  { id: "2-5", label: "2\u20135" },
  { id: "6-20", label: "6\u201320" },
  { id: "20+", label: "20+" },
];

const HEARD_FROM = [
  { id: "twitter", label: "Twitter / X" },
  { id: "github", label: "GitHub" },
  { id: "friend", label: "Friend / Colleague" },
  { id: "search", label: "Search" },
  { id: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  // Persisted state from server
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0→1 form state
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [heardFrom, setHeardFrom] = useState("");

  // Step 1→2 form state
  const [selectedTool, setSelectedTool] = useState("");

  // Fetch persisted onboarding state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding");
      if (!res.ok) return;
      const data: OnboardingData = await res.json();

      if (data.step >= DONE_STEP) {
        router.push("/dashboard");
        return;
      }

      setCurrentStep(data.step);
      setOrgName(data.orgName || "");

      if (data.metadata.role) setRole(data.metadata.role);
      if (data.metadata.teamSize) setTeamSize(data.metadata.teamSize);
      if (data.metadata.heardFrom) setHeardFrom(data.metadata.heardFrom);
      if (data.metadata.primaryTool) setSelectedTool(data.metadata.primaryTool);
    } catch {
      // fail open
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchState();
  }, [isLoaded, user, fetchState]);

  // Advance step
  const advance = async (
    targetStep: number,
    data?: Record<string, unknown>
  ) => {
    setError("");
    setAdvancing(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: targetStep, data }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return;
      }

      setCurrentStep(json.step);

      if (json.step >= DONE_STEP) {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdvancing(false);
    }
  };

  // ------- Loading & auth guards -------

  if (!isLoaded || !user || loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  // ------- Progress bar -------

  const displayStep = Math.min(currentStep + 1, TOTAL_STEPS);
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  // ------- Step renderers -------

  const renderStep0 = () => (
    <>
      <h1
        className="mb-1 text-2xl font-normal"
        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
      >
        Welcome to Clean
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        Let&apos;s set up your workspace.
      </p>

      {/* Org name */}
      <label
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--ink-light)" }}
      >
        Organization name
      </label>
      <input
        type="text"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="Acme Inc."
        className="mb-5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          background: "var(--cream)",
          borderColor: "var(--cream-dark)",
          color: "var(--ink)",
          // @ts-expect-error CSS custom property
          "--tw-ring-color": "var(--accent)",
        }}
      />

      {/* Role */}
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: "var(--ink-light)" }}
      >
        Your role
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
              role === r.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--cream-dark)] text-[var(--ink-muted)] hover:border-[var(--ink-muted)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Team size */}
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: "var(--ink-light)" }}
      >
        Team size
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {TEAM_SIZES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTeamSize(t.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
              teamSize === t.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--cream-dark)] text-[var(--ink-muted)] hover:border-[var(--ink-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* How did you hear about us */}
      <label
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--ink-light)" }}
      >
        How did you hear about us?
      </label>
      <select
        value={heardFrom}
        onChange={(e) => setHeardFrom(e.target.value)}
        className="mb-6 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          background: "var(--cream)",
          borderColor: "var(--cream-dark)",
          color: heardFrom ? "var(--ink)" : "var(--ink-muted)",
          // @ts-expect-error CSS custom property
          "--tw-ring-color": "var(--accent)",
        }}
      >
        <option value="" disabled>
          Select one...
        </option>
        {HEARD_FROM.map((h) => (
          <option key={h.id} value={h.id}>
            {h.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => advance(1, { orgName, role, teamSize, heardFrom })}
        disabled={advancing || !orgName.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
        style={{ background: "var(--accent)", color: "var(--cream)" }}
      >
        {advancing ? "Saving..." : "Continue"}
        {!advancing && <ChevronRight className="h-4 w-4" />}
      </button>
    </>
  );

  const renderStep1 = () => (
    <>
      <h1
        className="mb-1 text-2xl font-normal"
        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
      >
        What&apos;s your primary AI tool?
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        We&apos;ll tailor your experience accordingly.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setSelectedTool(tool.id)}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200 ${
              selectedTool === tool.id
                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                : "border-[var(--cream-dark)] hover:border-[var(--ink-muted)]"
            }`}
            style={{
              color:
                selectedTool === tool.id
                  ? "var(--accent)"
                  : "var(--ink-muted)",
            }}
          >
            {tool.icon}
            <span
              className="text-sm font-medium"
              style={{
                color:
                  selectedTool === tool.id ? "var(--ink)" : "var(--ink-muted)",
              }}
            >
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => advance(2, { primaryTool: selectedTool })}
        disabled={advancing || !selectedTool}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
        style={{ background: "var(--accent)", color: "var(--cream)" }}
      >
        {advancing ? "Finishing up..." : "Get started"}
        {!advancing && <ChevronRight className="h-4 w-4" />}
      </button>
    </>
  );

  // ------- Render -------

  const stepRenderers = [renderStep0, renderStep1];

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            className="text-3xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clean
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--ink-muted)" }}
            >
              Step {displayStep} of {TOTAL_STEPS}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--cream-dark)] bg-white p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {stepRenderers[currentStep]?.() ?? (
            <div className="text-center">
              <p style={{ color: "var(--ink-muted)" }}>Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
