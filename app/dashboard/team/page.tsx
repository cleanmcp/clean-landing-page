"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface OrgMember {
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  apiKeyCount: number;
  members: OrgMember[];
}

export default function TeamPage() {
  const { user: clerkUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then(setOrgData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const members = orgData?.members ?? [];
  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[var(--ink)]">Team</h2>
        <div className="flex items-center gap-4">
          <button className="rounded-lg border border-[var(--cream-dark)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
            Docs
          </button>
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
            onClick={() => alert("Team invitations coming soon!")}
          >
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
          <table className="w-full">
            <thead className="border-b border-[var(--cream-dark)] bg-[var(--cream)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  Joined
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.userId}
                  className="border-b border-[var(--cream-dark)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name ?? ""}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cream-dark)]">
                          <Users className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {member.user.name || member.user.email || "Unknown"}
                        </span>
                        {member.user.email && member.user.name && (
                          <p className="text-xs text-[var(--ink-muted)]">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                      {member.userId === clerkUser?.id && (
                        <span className="rounded bg-[var(--cream-dark)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--ink)]">
                    {member.role}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--ink-muted)]">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.userId === clerkUser?.id && (
                      <button className="rounded-lg border border-[var(--cream-dark)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                        Leave team
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[var(--cream-dark)] px-4 py-3">
            <span className="text-sm text-[var(--ink-muted)]">
              {filteredMembers.length}{" "}
              {filteredMembers.length === 1 ? "user" : "users"}
            </span>
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
      )}
    </div>
  );
}
