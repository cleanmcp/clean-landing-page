"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  FolderGit2,
  Users,
  FileText,
  Key,
  DollarSign,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/repositories", icon: FolderGit2, label: "Repositories" },
  { href: "/dashboard/team", icon: Users, label: "Team" },
  { href: "/dashboard/keys", icon: Key, label: "Keys" },
  { href: "/dashboard/billing", icon: DollarSign, label: "Billing & Usage" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--cream)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

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
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">
            {user.primaryEmailAddress?.emailAddress ?? user.fullName}
          </span>
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName ?? "User"}
              className="h-9 w-9 rounded-full border-2 border-white/20 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-medium text-white">
              {(user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="group flex w-16 flex-col items-center gap-4 border-r border-[var(--cream-dark)] bg-[var(--cream)] py-6 transition-all duration-300 hover:w-48">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:w-40 group-hover:justify-start group-hover:gap-3 group-hover:px-3 ${
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--ink)] hover:bg-[var(--cream-dark)]"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden whitespace-nowrap text-sm font-medium group-hover:inline">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <Link
            href="/documentation"
            className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink)] transition-all duration-300 hover:bg-[var(--cream-dark)] group-hover:w-40 group-hover:justify-start group-hover:gap-3 group-hover:px-3"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="hidden whitespace-nowrap text-sm font-medium group-hover:inline">
              Documentation
            </span>
          </Link>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[var(--cream)] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

