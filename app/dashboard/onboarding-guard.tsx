import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export async function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const completed = await hasCompletedOnboarding(userId);
  if (!completed) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
