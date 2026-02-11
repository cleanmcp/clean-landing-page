"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AgentMarquee from "@/components/AgentMarquee";
import TerminalComparison from "@/components/TerminalComparison";
import FeatureCard from "@/components/FeatureCard";
import RotatingText from "@/components/RotatingText";
import ScrollVelocity from "@/components/ScrollVelocity";
import {
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
      <section className="flex min-h-screen items-center px-5 pt-24 pb-8 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-7xl">
          {/* Two-column hero */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            {/* Left — headline */}
            <motion.div
              className="flex-1 lg:max-w-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1
                className="mb-6 text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span className="text-[var(--ink-light)]">
                  Stop burning <em>tokens.</em>
                </span>
                <br />
                <span className="mt-2 flex items-center gap-3 flex-wrap text-[var(--ink)]">
                  Sync context across
                  <RotatingText
                    texts={["agents.", "engineers.", "codebases."]}
                    mainClassName="px-4 py-2 bg-[var(--accent)] text-white italic rounded-xl overflow-hidden inline-flex items-center justify-center"
                    style={{ fontFamily: "var(--font-display)" }}
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden"
                    transition={{
                      type: "spring",
                      damping: 30,
                      stiffness: 400,
                    }}
                    rotationInterval={2500}
                  />
                </span>
              </h1>

              <motion.p
                className="text-base text-[var(--ink-light)] md:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Every agent synced. 50% less spend. 3x faster.
              </motion.p>
            </motion.div>

            {/* Right — terminal comparison */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <TerminalComparison />
            </motion.div>
          </div>

          {/* Agent tagline + marquee */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="mb-4 text-2xl font-normal md:text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Let all your coding agents work <em>together.</em>
            </h2>
            <div className="mx-auto max-w-5xl">
              <AgentMarquee />
            </div>
          </motion.div>
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
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            {/* Left — text */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                [ THE PROBLEM ]
              </p>
              <h2
                className="mb-6 text-3xl font-normal leading-tight md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Every agent re-reads your entire codebase.{" "}
                <em>Every time.</em>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-[var(--ink-light)]">
                Every AI coding tool uses the same models. The difference is
                context. Without shared context, each agent burns through
                hundreds of thousands of tokens re-exploring code that another
                agent already understood.
              </p>
            </motion.div>

            {/* Right — token waste chart */}
            <motion.div
              className="flex-1 lg:max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="rounded-2xl bg-[var(--ink)] p-6 md:p-8">
                <p className="mb-6 font-mono text-xs text-gray-500 uppercase tracking-wider">
                  Avg. tokens burned per coding session
                </p>

                <div className="space-y-4">
                  {[
                    { label: "Claude Code", tokens: 250 },
                    { label: "Cursor", tokens: 200 },
                    { label: "Codex", tokens: 180 },
                    { label: "Windsurf", tokens: 170 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-gray-300">{item.label}</span>
                        <span className="font-mono text-gray-500">
                          {item.tokens}k
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-800">
                        <motion.div
                          className="h-full rounded-full bg-gray-500"
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${(item.tokens / 250) * 100}%`,
                          }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="my-4 border-t border-gray-800" />

                  <p className="mb-3 font-mono text-[10px] text-gray-600 uppercase tracking-wider">
                    With Clean
                  </p>
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-green-400">
                        Any agent
                      </span>
                      <span className="font-mono text-green-400">70k</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <motion.div
                        className="h-full rounded-full bg-green-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(70 / 250) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-xs text-gray-600">
                    Same models. Better results. It&apos;s the context.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section — mirrors Problem layout (visual left, text right) */}
      <section id="solution" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            {/* Left — flow diagram */}
            <motion.div
              className="flex-1 lg:max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="rounded-2xl border border-[var(--cream-dark)] bg-white p-6 md:p-8">
                <p className="mb-8 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  How context flows
                </p>

                <div className="flex flex-col items-center">
                  {/* Source node */}
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--cream-dark)] px-5 py-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
                    <span className="text-sm font-medium text-[var(--ink)]">
                      Your Codebase
                    </span>
                    <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                      847 files
                    </span>
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center py-1">
                    <div className="h-6 w-px bg-[var(--cream-dark)]" />
                    <span className="py-1 text-[10px] text-[var(--ink-muted)]">
                      index
                    </span>
                    <div className="h-6 w-px bg-[var(--cream-dark)]" />
                  </div>

                  {/* Clean MCP node */}
                  <div className="rounded-lg bg-[var(--accent)] px-6 py-3 text-center">
                    <div className="text-sm font-semibold text-white">
                      Clean MCP
                    </div>
                    <div className="text-[11px] text-white/60">
                      cached &middot; 2.4s
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center py-1">
                    <div className="h-6 w-px bg-[var(--cream-dark)]" />
                    <span className="py-1 text-[10px] text-[var(--ink-muted)]">
                      serve
                    </span>
                    <div className="h-6 w-px bg-[var(--cream-dark)]" />
                  </div>

                  {/* Fan-out line + agent nodes */}
                  <div className="relative w-full max-w-[280px]">
                    {/* Horizontal bar */}
                    <div className="mx-[10%] h-px bg-[var(--cream-dark)]" />

                    {/* Agent columns */}
                    <div className="mt-0 flex justify-between px-[10%]">
                      {[
                        "Claude",
                        "Cursor",
                        "Codex",
                        "Windsurf",
                      ].map((name) => (
                        <div
                          key={name}
                          className="flex flex-col items-center"
                        >
                          <div className="h-4 w-px bg-[var(--cream-dark)]" />
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)]/50" />
                          <span className="mt-1 text-[9px] font-medium text-[var(--ink-muted)]">
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Token badge */}
                  <div className="mt-6 rounded-full bg-[var(--accent)]/10 px-4 py-1.5">
                    <span className="text-xs font-medium text-[var(--accent)]">
                      70k tokens each
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — text + steps */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                [ THE SOLUTION ]
              </p>
              <h2
                className="mb-6 text-3xl font-normal leading-tight md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How Clean <em>works.</em>
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-[var(--ink-light)]">
                One MCP server that pre-indexes your codebase and syncs context
                across every agent your team uses.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Connect Once",
                    description:
                      "Point Clean at your codebase. We index everything intelligently\u2014structure, patterns, dependencies.",
                  },
                  {
                    title: "Use Any Agent",
                    description:
                      "Claude, Cursor, Codex\u2014doesn\u2019t matter. They all tap into the same pre-built context.",
                  },
                  {
                    title: "Stay in Sync",
                    description:
                      "Your whole team shares the same codebase understanding. No more repeated explanations.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
                  >
                    <span className="mt-1 font-mono text-xs text-[var(--ink-muted)]">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-[var(--ink)]">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--ink-light)]">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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
              className="text-3xl font-normal leading-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              We have <em>everything</em> you need.
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

      {/* Stats Section with Scroll Velocity */}
      <section className="relative overflow-hidden border-y border-[var(--cream-dark)] bg-[var(--cream-dark)]/30 py-24 md:py-32">
        {/* Background scroll text */}
        <div className="pointer-events-none absolute inset-0 flex items-center opacity-[0.03]">
          <ScrollVelocity
            texts={["50% LESS SPEND", "3X FASTER", "ONE MCP"]}
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
              { value: "50%", label: "less token spend" },
              { value: "3x", label: "faster sessions" },
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
            style={{ fontFamily: "var(--font-display)" }}
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
