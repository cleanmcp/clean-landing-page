"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";

const STEPS = [
  {
    key: "role",
    title: "What's your role?",
    subtitle: "This helps us tailor your experience.",
    options: [
      { value: "developer", label: "Developer", desc: "Writing code day-to-day" },
      { value: "lead", label: "Tech Lead", desc: "Leading a dev team" },
      { value: "cto", label: "CTO / VP Eng", desc: "Engineering leadership" },
      { value: "founder", label: "Founder", desc: "Building a startup" },
      { value: "devops", label: "DevOps / SRE", desc: "Infrastructure & ops" },
      { value: "other", label: "Other", desc: "Something else entirely" },
    ],
  },
  {
    key: "teamSize",
    title: "How big is your team?",
    subtitle: "Helps us recommend the right plan.",
    options: [
      { value: "1", label: "Just me", desc: "Solo developer" },
      { value: "2-5", label: "2-5", desc: "Small team" },
      { value: "6-20", label: "6-20", desc: "Growing team" },
      { value: "21-50", label: "21-50", desc: "Mid-size team" },
      { value: "50+", label: "50+", desc: "Large organization" },
    ],
  },
  {
    key: "heardFrom",
    title: "How did you hear about Clean?",
    subtitle: "We'd love to know what brought you here.",
    options: [
      { value: "twitter", label: "Twitter / X", desc: "" },
      { value: "github", label: "GitHub", desc: "" },
      { value: "friend", label: "Friend / Colleague", desc: "" },
      { value: "blog", label: "Blog / Article", desc: "" },
      { value: "search", label: "Google / Search", desc: "" },
      { value: "other", label: "Other", desc: "" },
    ],
  },
  {
    key: "primaryTool",
    title: "What's your primary AI coding tool?",
    subtitle: "We'll optimize your setup for it.",
    options: [
      { value: "claude", label: "Claude Code", desc: "Anthropic's coding agent" },
      { value: "cursor", label: "Cursor", desc: "AI-first code editor" },
      { value: "codex", label: "Codex / ChatGPT", desc: "OpenAI's coding tools" },
      { value: "windsurf", label: "Windsurf", desc: "Codeium's IDE" },
      { value: "copilot", label: "GitHub Copilot", desc: "GitHub's AI assistant" },
      { value: "other", label: "Other", desc: "" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [checkingStep, setCheckingStep] = useState(true);

  // Check if user already completed onboarding
  useEffect(() => {
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (data.step >= 2) {
          router.replace("/dashboard");
        } else {
          setCheckingStep(false);
        }
      })
      .catch(() => setCheckingStep(false));
  }, [router]);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const selectedValue = answers[step.key] || "";

  function selectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  }

  function next() {
    if (!selectedValue) return;
    if (isLast) {
      submit();
    } else {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }

  function back() {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: answers.role,
          teamSize: answers.teamSize,
          heardFrom: answers.heardFrom,
          primaryTool: answers.primaryTool,
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setSubmitting(false);
    }
  }

  if (checkingStep) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-[#a1a1aa]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <span
          className="text-xl font-normal tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Clean
        </span>
        <span className="text-sm text-[#a1a1aa]">
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-6 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
        <motion.div
          className="h-full rounded-full bg-[var(--dash-accent)]"
          initial={false}
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25 }}
            >
              <h1
                className="mb-2 text-2xl font-normal sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.title}
              </h1>
              <p className="mb-8 text-[#a1a1aa]">{step.subtitle}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {step.options.map((option) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      className={`group relative flex flex-col rounded-xl border px-5 py-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[var(--dash-accent)] bg-[var(--dash-accent)]/5 ring-2 ring-[var(--dash-accent)]/20"
                          : "border-[rgba(255,255,255,0.1)] bg-[#171717] hover:border-[var(--ink-muted)]/30"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--dash-accent)]">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#fafafa]">
                        {option.label}
                      </span>
                      {option.desc && (
                        <span className="mt-0.5 text-xs text-[#a1a1aa]">
                          {option.desc}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={back}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-[#a1a1aa] transition-colors hover:text-[#fafafa] disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={next}
              disabled={!selectedValue || submitting}
              className="btn-primary flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLast ? (
                "Finish"
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
