import { OnboardingGuard } from "./onboarding-guard";
import ClientLayout from "./client-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <ClientLayout>{children}</ClientLayout>
    </OnboardingGuard>
  );
}
