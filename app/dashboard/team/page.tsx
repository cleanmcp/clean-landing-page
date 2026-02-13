"use client";

import { useState } from "react";
import {
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const mockTeamMembers = [
  {
    email: "studlanjulis@gmail.com",
    mfaEnabled: true,
    role: "Owner",
  },
];

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
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
  );
}

