"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const A = "/landing";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const email = "hello@tryclean.ai";

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
      </div>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #79c0ff 0%, #3b92f3 40%, transparent 70%)",
        }}
      />

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2.5 text-sm text-white/40 transition-colors hover:text-white/80"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <div className="relative z-10 w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-0.5 mb-10">
          <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
          <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
        </Link>

        <h1 className="mb-3 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white" style={{ fontFamily: "var(--font-jakarta)" }}>
          Get in <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>touch</em>
        </h1>
        <p className="mb-10 text-base text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
          Have questions? We&apos;d love to hear from you.
        </p>

        <div
          className="rounded-[24px] p-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
          }}
        >
          <p className="mb-4 text-sm text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>Email us at</p>
          <a
            href={`mailto:${email}`}
            className="text-xl font-semibold text-[#79c0ff] hover:text-[#aed8ff] transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            {email}
          </a>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center h-[48px] rounded-[24px] px-6 text-[15px] font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                border: "3px solid rgba(255,255,255,0.4)",
                boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6)",
                fontFamily: "var(--font-jakarta)",
              }}
            >
              Open email client
            </a>
            <button
              onClick={copyEmail}
              className="inline-flex items-center justify-center h-[48px] rounded-[24px] border border-white/10 bg-white/5 px-6 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {copied ? "Copied!" : "Copy email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
