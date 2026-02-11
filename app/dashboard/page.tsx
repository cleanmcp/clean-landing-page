"use client";

import { useState } from "react";
import {
  FolderGit2,
  Users,
  FileText,
  Key,
  DollarSign,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type View = "repositories" | "team" | "keys" | "billing";

const navItems = [
  { id: "repositories" as View, icon: FolderGit2, label: "Repositories" },
  { id: "team" as View, icon: Users, label: "Team" },
  { id: "keys" as View, icon: Key, label: "Keys" },
  { id: "billing" as View, icon: DollarSign, label: "Billing & Usage" },
];

const mockRepos = [
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
];

const mockTeamMembers = [
  {
    email: "studlanjulis@gmail.com",
    mfaEnabled: true,
    role: "Owner",
  },
];

const mockKeys = [
  {
    name: "Production API Key",
    key: "clean_sk_prod_***************",
    created: "2025-01-15",
    lastUsed: "2025-02-11",
  },
  {
    name: "Development API Key",
    key: "clean_sk_dev_***************",
    created: "2025-01-10",
    lastUsed: "2025-02-10",
  },
];

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<View>("repositories");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen flex-col bg-[var(--cream)]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[var(--accent)] px-6 py-4">
        <h1
          className="text-2xl font-normal text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Clean
        </h1>
        <button className="h-10 w-10 rounded-full bg-gray-300" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="group flex w-16 flex-col items-center gap-4 border-r border-[var(--cream-dark)] bg-[var(--cream)] py-6 transition-all duration-300 hover:w-48">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex h-10 w-10 items-center justify-start gap-3 overflow-hidden rounded-lg transition-all duration-300 group-hover:w-40 group-hover:px-3 ${
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--ink)] hover:bg-[var(--cream-dark)]"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            );
          })}
          <a
            href="/documentation"
            className="mt-2 flex h-10 w-10 items-center justify-start gap-3 overflow-hidden rounded-lg text-[var(--ink)] transition-all duration-300 hover:bg-[var(--cream-dark)] group-hover:w-40 group-hover:px-3"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Documentation
            </span>
          </a>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[var(--cream)] p-8">
          {activeView === "repositories" && (
            <div>
              <h2 className="mb-6 text-2xl font-medium text-[var(--ink)]">
                Repositories
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockRepos.map((repo, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[var(--cream-dark)] bg-white p-4"
                  >
                    <h3 className="mb-2 font-mono text-sm font-medium text-[var(--ink)]">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Last updated: {repo.lastUpdated}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Indexed by: {repo.indexedBy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "team" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-medium text-[var(--ink)]">Team</h2>
                <div className="flex items-center gap-4">
                  <button className="rounded-lg border border-[var(--cream-dark)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                    Docs
                  </button>
                  <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]">
                    Invite member
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                  <input
                    type="text"
                    placeholder="Filter members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-[var(--cream-dark)] bg-white py-2 pl-10 pr-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
                <table className="w-full">
                  <thead className="border-b border-[var(--cream-dark)] bg-[var(--cream)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        Enabled MFA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        Role
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTeamMembers.map((member, i) => (
                      <tr key={i} className="border-b border-[var(--cream-dark)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cream-dark)]">
                              <Users className="h-3 w-3 text-[var(--ink-muted)]" />
                            </div>
                            <span className="text-sm text-[var(--ink)]">
                              {member.email}
                            </span>
                            <span className="rounded bg-[var(--cream-dark)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                              YOU
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {member.mfaEnabled ? (
                            <X className="h-4 w-4 text-[var(--ink-muted)]" />
                          ) : (
                            <span className="text-sm text-[var(--ink-muted)]">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--ink)]">
                          {member.role}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="rounded-lg border border-[var(--cream-dark)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                            Leave team
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-[var(--cream-dark)] px-4 py-3">
                  <span className="text-sm text-[var(--ink-muted)]">1 user</span>
                  <div className="flex items-center gap-2">
                    <button className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--cream-dark)]">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--cream-dark)]">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "keys" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-medium text-[var(--ink)]">Keys</h2>
                <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]">
                  Create API Key
                </button>
              </div>

              <div className="space-y-4">
                {mockKeys.map((keyData, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[var(--cream-dark)] bg-white p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="mb-1 text-sm font-medium text-[var(--ink)]">
                          {keyData.name}
                        </h3>
                        <p className="font-mono text-xs text-[var(--ink-muted)]">
                          {keyData.key}
                        </p>
                      </div>
                      <button className="rounded-lg border border-[var(--cream-dark)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                        Revoke
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs text-[var(--ink-muted)]">
                      <span>Created: {keyData.created}</span>
                      <span>Last used: {keyData.lastUsed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "billing" && (
            <div>
              <h2 className="mb-6 text-2xl font-medium text-[var(--ink)]">
                Billing & Usage
              </h2>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Current Period
                  </p>
                  <p className="text-2xl font-bold text-[var(--ink)]">$24.50</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Feb 1 - Feb 28, 2026
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Tokens Used
                  </p>
                  <p className="text-2xl font-bold text-[var(--ink)]">1.2M</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    70% less than without Clean
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Active Agents
                  </p>
                  <p className="text-2xl font-bold text-[var(--ink)]">5</p>
                  <p className="text-xs text-[var(--ink-muted)]">All synced</p>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-6">
                <h3 className="mb-4 text-lg font-medium text-[var(--ink)]">
                  Payment Method
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded border border-[var(--cream-dark)] bg-[var(--cream)]">
                    <DollarSign className="h-5 w-5 text-[var(--ink-muted)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Expires 12/2027
                    </p>
                  </div>
                  <button className="ml-auto rounded-lg border border-[var(--cream-dark)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
