"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import TokenCounter from "@/components/TokenCounter";
import AgentMarquee from "@/components/AgentMarquee";
import FeatureCard from "@/components/FeatureCard";
import RotatingText from "@/components/RotatingText";
import ScrollVelocity from "@/components/ScrollVelocity";
import {
  UngroupIcon,
  EnlargeIcon,
  CoinDollarIcon,
  CodeIcon,
  BoltIcon,
  SyncIcon,
  PlugIcon,
  NetworkIcon,
  ArrowRightIcon,
} from "@/components/Icons";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      {/* Simple, natural background */}
      <div className="fixed inset-0 -z-10">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(9,70,63,0.03) 0%, transparent 50%)' }} />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-5 pt-20 text-center sm:px-6">
        <motion.div
          className="mx-auto w-full max-w-6xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Main Headline - 2 lines */}
          <h1 className="mb-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl md:text-6xl lg:text-7xl">
            <div className="text-[var(--ink-light)]" style={{ fontFamily: "var(--font-playfair)" }}>
              Stop burning tokens.
            </div>
            <div className="flex items-center w-full justify-center gap-3 mt-2 flex-wrap">
              <span className="text-[var(--ink)]" style={{ fontFamily: "var(--font-playfair)" }}>
                Sync context across
              </span>
              <RotatingText
                texts={["agents", "engineers", "codebases"]}
                mainClassName="px-4 py-2 bg-[var(--accent)] text-white rounded-xl overflow-hidden inline-flex items-center justify-center"
                style={{ fontFamily: "var(--font-playfair)" }}
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </div>
          </h1>

          {/* Sub-headline with glow */}
          <motion.p
            className="glow-text mb-12 px-2 text-base font-medium text-[var(--accent)] sm:text-xl md:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            One MCP. Every agent synced. 70% less spend.
          </motion.p>

          {/* Token Counter */}
          <div className="mb-12">
            <TokenCounter />
          </div>

          {/* CTAs */}
          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <a
              href="#get-started"
              className="btn-primary flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a
              href="#demo"
              className="btn-secondary rounded-full px-8 py-3 text-base font-medium"
            >
              Book a Demo
            </a>
          </motion.div>
        </motion.div>

        {/* Agent Marquee */}
        <div className="mt-16 w-full max-w-5xl">
          <AgentMarquee />
        </div>
      </section>

      {/* Scroll Velocity Divider */}
      <div className="overflow-hidden border-y border-[var(--cream-dark)] bg-[var(--ink)] py-4">
        <ScrollVelocity
          texts={["SYNC", "CONTEXT", "AGENTS", "CLEAN"]}
          velocity={60}
          damping={100}
          stiffness={150}
          className="text-4xl font-bold tracking-tight text-[var(--cream)]/20 md:text-5xl"
        />
      </div>

      {/* Problem Section */}
      <section className="relative px-6 py-24 md:py-32">
        {/* Background text pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[12rem] font-black tracking-tighter text-[var(--ink)] whitespace-nowrap" style={{ fontFamily: "var(--font-geist-sans)" }}>
              PROBLEM PROBLEM PROBLEM PROBLEM PROBLEM
            </div>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ THE PROBLEM ]
            </p>
            <h2
              className="mb-12 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Your agents are working blind.
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <CoinDollarIcon className="h-6 w-6" />,
                title: "Wasted Tokens",
                description:
                  "Every agent re-explores your codebase from scratch. That's 300,000 tokens burned per session.",
              },
              {
                icon:<UngroupIcon className="h-6 w-6" /> ,
                title: "Lost Context",
                description:
                  "Switching between agents? All that context disappears. Start explaining everything again.",
              },
              {
                icon: <EnlargeIcon className="h-6 w-6" />,
                title: "Teams Out of Sync",
                description:
                  "Your team's agents don't share knowledge. Everyone's duplicating work in isolation.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  {item.icon}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-light)]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative px-6 py-24 md:py-32">
        {/* Background text pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[12rem] font-black tracking-tighter text-[var(--ink)] whitespace-nowrap" style={{ fontFamily: "var(--font-geist-sans)" }}>
              SOLUTION SOLUTION SOLUTION SOLUTION SOLUTION
            </div>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ THE SOLUTION ]
            </p>
            <motion.div
              className="relative inline-block mb-6"
              initial={{ opacity: 1 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              onViewportEnter={(entry) => {
                if (entry?.target) {
                  const el = entry.target.querySelector('.selection-box');
                  if (el) el.setAttribute('data-in-view', 'true');
                }
              }}
            >
              <h2
                className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                How Clean Works
              </h2>
              {/* Selection overlay - border + corners scale together */}
              <div className="selection-box" data-in-view="false">
                <span className="selection-box__corner selection-box__corner--tl" />
                <span className="selection-box__corner selection-box__corner--br" />
              </div>
            </motion.div>
            <p className="mx-auto max-w-2xl text-lg text-[var(--ink-light)]">
              One MCP server that pre-indexes your codebase and syncs context
              across every agent your team uses.
            </p>
          </motion.div>

          {/* Visual Flow */}
          <div className="mb-16 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-8">
            {[
              {
                label: "Your Codebase",
                icon: <CodeIcon className="h-8 w-8" />,
              },
              {
                label: "Clean MCP",
                icon: <BoltIcon className="h-8 w-8" />,
                highlight: true,
              },
              {
                label: "All Agents Synced",
                icon: (
                  <svg
                    viewBox="0 0 640 640"
                    className="h-8 w-8"
                    aria-hidden="true"
                  >
                    <path d="M352 64C352 46.3 337.7 32 320 32C302.3 32 288 46.3 288 64L288 128L192 128C139 128 96 171 96 224L96 448C96 501 139 544 192 544L448 544C501 544 544 501 544 448L544 224C544 171 501 128 448 128L352 128L352 64zM160 432C160 418.7 170.7 408 184 408L216 408C229.3 408 240 418.7 240 432C240 445.3 229.3 456 216 456L184 456C170.7 456 160 445.3 160 432zM280 432C280 418.7 290.7 408 304 408L336 408C349.3 408 360 418.7 360 432C360 445.3 349.3 456 336 456L304 456C290.7 456 280 445.3 280 432zM400 432C400 418.7 410.7 408 424 408L456 408C469.3 408 480 418.7 480 432C480 445.3 469.3 456 456 456L424 456C410.7 456 400 445.3 400 432zM224 240C250.5 240 272 261.5 272 288C272 314.5 250.5 336 224 336C197.5 336 176 314.5 176 288C176 261.5 197.5 240 224 240zM368 288C368 261.5 389.5 240 416 240C442.5 240 464 261.5 464 288C464 314.5 442.5 336 416 336C389.5 336 368 314.5 368 288zM64 288C64 270.3 49.7 256 32 256C14.3 256 0 270.3 0 288L0 384C0 401.7 14.3 416 32 416C49.7 416 64 401.7 64 384L64 288zM608 256C590.3 256 576 270.3 576 288L576 384C576 401.7 590.3 416 608 416C625.7 416 640 401.7 640 384L640 288C640 270.3 625.7 256 608 256z" />
                  </svg>
                ),
              },
            ].map((step, index) => (
              <React.Fragment key={step.label}>
                {index > 0 && (
                  <span className="text-[var(--ink-muted)]">
                    <ArrowRightIcon className="h-5 w-5 rotate-90 md:rotate-0" />
                  </span>
                )}
                <motion.div
                  className="flex flex-col items-center gap-3 md:flex-row md:gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl md:h-20 md:w-20 ${
                      step.highlight
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--cream-dark)] bg-[var(--cream)]"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium md:text-base">{step.label}</span>
                </motion.div>
              </React.Fragment>
            ))}
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect Once",
                description:
                  "Point Clean at your codebase. We index everything intelligently-structure, patterns, dependencies.",
              },
              {
                step: "02",
                title: "Use Any Agent",
                description:
                  "Claude, Cursor, Codex-doesn't matter. They all tap into the same pre-built context.",
              },
              {
                step: "03",
                title: "Stay in Sync",
                description:
                  "Your whole team shares the same codebase understanding. No more repeated explanations.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span className="mb-4 block font-mono text-4xl font-bold text-[var(--cream-dark)]">
                  {item.step}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="text-[var(--ink-light)]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Scroll Velocity */}
      <section className="relative overflow-hidden border-y border-[var(--cream-dark)] bg-[var(--cream-dark)]/30 py-24 md:py-32">
        {/* Background scroll text */}
        <div className="pointer-events-none absolute inset-0 flex items-center opacity-[0.03]">
          <ScrollVelocity
            texts={["70% LESS SPEND", "3X FASTER", "ONE MCP"]}
            velocity={30}
            damping={100}
            stiffness={150}
            className="text-[6rem] font-black tracking-tighter text-[var(--ink)] md:text-[10rem]"
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ DATA-DRIVEN RESULTS ]
            </p>
          </motion.div>
          <div className="grid gap-12 text-center md:grid-cols-3">
            {[
              { value: "70%", label: "less token spend" },
              { value: "3x", label: "faster onboarding" },
              { value: "1", label: "MCP to rule them all" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span
                  className="stat-number mb-2 block text-6xl font-bold tracking-tight text-[var(--ink)] md:text-7xl"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  {stat.value}
                </span>
                <span className="text-lg text-[var(--ink-light)]">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative px-6 py-24 md:py-32">
        {/* Background text pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[12rem] font-black tracking-tighter text-[var(--ink)] whitespace-nowrap" style={{ fontFamily: "var(--font-geist-sans)" }}>
              FEATURES FEATURES FEATURES FEATURES FEATURES
            </div>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ FEATURES ]
            </p>
            <h2
              className="mb-6 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Everything you need
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <FeatureCard
              icon={<SyncIcon className="h-5 w-5" />}
              title="Synced Context"
              description="Every agent works from the same understanding. No more repeated codebase exploration."
              index={0}
              previewVariant="sync"
            />
            <FeatureCard
              icon={<NetworkIcon className="h-5 w-5" />}
              title="Team Alignment"
              description="Share context across your entire team. Everyone's agents speak the same language."
              index={1}
              previewVariant="graph"
            />
            <FeatureCard
              icon={<PlugIcon className="h-5 w-5" />}
              title="Universal Compatibility"
              description="Works with Claude, Cursor, Codex, Windsurf, and any MCP-compatible agent."
              index={2}
              previewVariant="plugins"
            />
            <FeatureCard
              icon={<BoltIcon className="h-5 w-5" />}
              title="One-time Setup"
              description="Configure once, benefit forever. Clean keeps your index fresh automatically."
              index={3}
              previewVariant="setup"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ GET STARTED ]
            </p>
            <h2
              className="mb-6 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Ready to stop burning tokens?
            </h2>
            <p className="mb-8 text-lg text-[var(--ink-light)]">
              Join teams saving thousands on AI agent costs every month.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#get-started"
                className="btn-primary flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium"
              >
                Get Started Free
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                href="#demo"
                className="btn-secondary rounded-full px-8 py-3 text-base font-medium"
              >
                Book a Demo
              </a>
            </div>
            <p className="glow-text mt-8 text-sm font-medium text-[var(--accent)]">
              Powered by one MCP
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-12"
        style={{ borderTop: "1px solid var(--cream-dark)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <span
            className="text-xl font-medium tracking-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Clean
          </span>
          <div className="flex gap-6 text-sm text-[var(--ink-light)]">
            <a href="#" className="hover:text-[var(--ink)]">
              Documentation
            </a>
            <a href="#" className="hover:text-[var(--ink)]">
              GitHub
            </a>
            <a href="#" className="hover:text-[var(--ink)]">
              Contact
            </a>
          </div>
          <span className="text-sm text-[var(--ink-muted)]">
            2026 Clean. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
