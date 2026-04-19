import ClientLayout from "./client-layout";

// Every dashboard page is behind auth and reads per-user state, so none of
// them should ever be prerendered. Marking the segment dynamic also prevents
// preview builds from failing when Clerk env vars aren't present (the build
// previously tried to prerender /dashboard/billing and hit "useUser outside
// ClerkProvider" in the preview environment).
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
