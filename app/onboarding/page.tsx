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
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/landing/clean-icon.svg" alt="Clean" width={20} height={20} />
          <span className="text-base font-bold tracking-tight text-foreground">
            lean.ai
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-border">
        <motion.div
          className="h-full bg-[#1772E7]"
          initial={false}
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Step dots */}
              <div className="mb-8 flex gap-1.5">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full"
                    animate={{
                      width: i === currentStep ? 24 : 8,
                      backgroundColor: i <= currentStep ? "#1772E7" : "oklch(1 0 0 / 10%)",
                    }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </div>

              <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {step.title}
              </h1>
              <p className="mb-8 text-sm text-muted-foreground">{step.subtitle}</p>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {step.options.map((option) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      className={`group relative flex flex-col rounded-lg border px-4 py-3.5 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-[#1772E7] bg-[#1772E7]/10"
                          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-card/80"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#1772E7]">
                          <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                      <span className={`text-sm font-medium ${isSelected ? "text-[#1772E7]" : "text-foreground"}`}>
                        {option.label}
                      </span>
                      {option.desc && (
                        <span className="mt-0.5 text-xs text-muted-foreground">
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
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={next}
              disabled={!selectedValue || submitting}
              className="flex items-center gap-2 rounded-lg bg-[#1772E7] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1560c8] disabled:pointer-events-none disabled:opacity-40"
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
