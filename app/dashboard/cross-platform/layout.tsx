import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { earlyAccessUsers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const FEATURE = "cross-platform";

export default async function CrossPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [access] = await db
    .select({ id: earlyAccessUsers.id })
    .from(earlyAccessUsers)
    .where(
      and(
        eq(earlyAccessUsers.userId, userId),
        eq(earlyAccessUsers.feature, FEATURE),
      ),
    )
    .limit(1);

  if (!access) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1772E7]/10">
          <svg
            className="h-8 w-8 text-[#1772E7]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">
          Early Access Only
        </h2>
        <p className="text-sm text-[var(--dash-text-muted)] max-w-md">
          Cross-Platform Sync is currently available to early access users.
          Contact us to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
