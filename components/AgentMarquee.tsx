"use client";

import Image from "next/image";

type AgentWithLogo = { name: string; logo: string };
type AgentWithIcon = { name: string; icon: string };
type Agent = AgentWithLogo | AgentWithIcon;

const agents: Agent[] = [
  { name: "Claude", logo: "/agents/claude.svg" },
  { name: "Cursor", logo: "/agents/cursor.png" },
  { name: "Codex", logo: "/agents/codex.png" },
  { name: "Windsurf", logo: "/agents/windsurf.svg" },
  { name: "Antigravity", logo: "/agents/antigravity.png" },
];

function hasLogo(agent: Agent): agent is AgentWithLogo {
  return "logo" in agent;
}

export default function AgentMarquee() {
  const doubledAgents = [...agents, ...agents];

  return (
    <div className="w-full overflow-hidden py-8">
      <div className="relative">
        {/* Gradient fade on edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[var(--dash-bg)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[var(--dash-bg)] to-transparent" />

        {/* Scrolling content */}
        <div className="animate-marquee flex w-max gap-12">
          {doubledAgents.map((agent, index) => (
            <div
              key={`${agent.name}-${index}`}
              className="flex items-center gap-3 rounded-full border border-[var(--dash-border)] bg-white/50 px-6 py-3 backdrop-blur-sm transition-all hover:border-[var(--dash-accent)] hover:bg-white"
            >
              {hasLogo(agent) ? (
                <Image
                  src={agent.logo}
                  alt={agent.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-contain"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dash-text)] text-sm font-medium text-[var(--dash-bg)]">
                  {agent.icon}
                </span>
              )}
              <span className="text-base font-medium text-[var(--dash-text)]">
                {agent.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
