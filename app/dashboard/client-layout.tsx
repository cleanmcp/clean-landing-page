"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Redirect users who haven't completed the initial onboarding form
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (pathname.startsWith("/dashboard/onboarding")) return;

    fetch("/api/onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.step < 2) {
          router.replace("/onboarding");
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => setOnboardingChecked(true));
  }, [isLoaded, user, pathname, router]);

  if (
    !isLoaded ||
    !user ||
    (!onboardingChecked && !pathname.startsWith("/dashboard/onboarding"))
  ) {
    return (
      <div className="dark flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          },
        }}
      />

      {/* Sidebar (desktop: fixed, mobile: drawer) */}
      <Sidebar />

      {/* Content area */}
      <div className="min-h-screen md:ml-[260px]">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => window.dispatchEvent(new Event("dash-sidebar-toggle"))}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            Clean
          </span>
        </div>

        {/* Page content */}
        <main className="p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
