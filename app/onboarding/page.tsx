"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import Image from "next/image";

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
      { value: "2-5", label: "2–5", desc: "Small team" },
      { value: "6-20", label: "6–20", desc: "Growing team" },
      { value: "21-50", label: "21–50", desc: "Mid-size team" },
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
  const progress = ((currentStep + 1) / STEPS.length) * 100;

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#66a6dd]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-[#C7E5F3]">
        <div className="flex items-center gap-2">
          <Image src="/landing/clean-app-icon.svg" alt="Clean" width={28} height={28} />
          <span
            className="text-xl font-semibold text-[#1c1c1c] tracking-tight"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            clean<span className="text-[#66a6dd]">.ai</span>
          </span>
        </div>
        <span className="text-sm text-[#8b949e]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-[#D2E9FF]">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #79C0FF 0%, #1772E7 100%)" }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Step indicator dots */}
              <div className="flex gap-2 mb-8">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentStep ? 24 : 8,
                      background: i <= currentStep ? "#1772E7" : "#D2E9FF",
                    }}
                  />
                ))}
              </div>

              <p
                className="text-sm font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#66a6dd", fontFamily: "var(--font-jakarta)" }}
              >
                {String(currentStep + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </p>
              <h1
                className="text-3xl font-bold text-[#1c1c1c] mb-2 leading-tight"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {step.title}
              </h1>
              <p className="text-[#8b949e] mb-8 text-base" style={{ fontFamily: "var(--font-jakarta)" }}>
                {step.subtitle}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {step.options.map((option) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      className="group relative flex flex-col rounded-2xl border px-5 py-4 text-left transition-all duration-200"
                      style={{
                        border: isSelected ? "1.5px solid #1772E7" : "1.5px solid #C7E5F3",
                        background: isSelected
                          ? "linear-gradient(135deg, #EEF6FF 0%, #D2E9FF 100%)"
                          : "white",
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(23,114,231,0.08)"
                          : "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      {isSelected && (
                        <div
                          className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: "#1772E7" }}
                        >
                          <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: isSelected ? "#1772E7" : "#1c1c1c",
                          fontFamily: "var(--font-jakarta)",
                        }}
                      >
                        {option.label}
                      </span>
                      {option.desc && (
                        <span
                          className="mt-0.5 text-xs"
                          style={{ color: "#8b949e", fontFamily: "var(--font-jakarta)" }}
                        >
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
              className="flex items-center gap-1.5 text-sm font-medium text-[#8b949e] transition-colors hover:text-[#1c1c1c] disabled:invisible"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={next}
              disabled={!selectedValue || submitting}
              className="relative inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                border: "2px solid rgba(255,255,255,0.6)",
                boxShadow: "inset 0px 3px 8px rgba(255,255,255,0.7), inset 0px -2px 5px rgba(20,100,200,0.3), 0 4px 12px rgba(59,146,243,0.3)",
                fontFamily: "var(--font-jakarta)",
              }}
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
