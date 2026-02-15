"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { InviteModal } from "./invite-modal";

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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  async function fetchOrg() {
    try {
      const r = await fetch("/api/org");
      const d = await r.json();
      setOrgData(d?.org ? { ...d.org, ...d } : d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrg();
  }, []);

  const members = orgData?.members ?? [];
  const currentMember = members.find((m) => m.userId === clerkUser?.id);
  const currentRole = currentMember?.role ?? "MEMBER";
  const isAdminOrOwner = currentRole === "OWNER" || currentRole === "ADMIN";

  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  async function handleRoleChange(targetUserId: string, newRole: string) {
    try {
      const res = await fetch("/api/org/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update role");
        return;
      }
      toast.success("Role updated");
      fetchOrg();
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleRemoveMember(targetUserId: string, name: string) {
    const isSelf = targetUserId === clerkUser?.id;
    const msg = isSelf
      ? "Are you sure you want to leave this team?"
      : `Remove ${name} from the team?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/org/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to remove member");
        return;
      }
      toast.success(isSelf ? "You left the team" : "Member removed");
      if (isSelf) {
        window.location.href = "/";
      } else {
        fetchOrg();
      }
    } catch {
      toast.error("Failed to remove member");
    }
  }

  function getRoleOptions(memberRole: string): string[] {
    if (currentRole === "OWNER") {
      return ["OWNER", "ADMIN", "MEMBER"];
    }
    // ADMINs can only set MEMBER
    if (currentRole === "ADMIN" && memberRole !== "OWNER") {
      return ["ADMIN", "MEMBER"];
    }
    return [];
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[var(--ink)]">Team</h2>
        <div className="flex items-center gap-4">
          <button className="rounded-lg border border-[var(--cream-dark)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
            Docs
          </button>
          {isAdminOrOwner && (
            <button
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
              onClick={() => setInviteModalOpen(true)}
            >
              Invite member
            </button>
          )}
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
              {filteredMembers.map((member) => {
                const isSelf = member.userId === clerkUser?.id;
                const roleOptions = !isSelf
                  ? getRoleOptions(member.role)
                  : [];
                const canRemove =
                  isAdminOrOwner && !isSelf && member.role !== "OWNER";

                return (
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
                            {member.user.name ||
                              member.user.email ||
                              "Unknown"}
                          </span>
                          {member.user.email && member.user.name && (
                            <p className="text-xs text-[var(--ink-muted)]">
                              {member.user.email}
                            </p>
                          )}
                        </div>
                        {isSelf && (
                          <span className="rounded bg-[var(--cream-dark)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdminOrOwner && roleOptions.length > 0 ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.userId,
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-[var(--cream-dark)] bg-white px-2 py-1 text-sm text-[var(--ink)]"
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-[var(--ink)]">
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink-muted)]">
                      {new Date(member.joinedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              member.user.name || "yourself"
                            )
                          }
                          className="rounded-lg border border-[var(--cream-dark)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
                        >
                          Leave team
                        </button>
                      ) : canRemove ? (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              member.user.name || "this member"
                            )
                          }
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
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

      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        isOwner={currentRole === "OWNER"}
      />
    </div>
  );
}
