import { OnboardingScreen } from "@/modules/auth/components/onboarding-screen";
import { requireUser } from "@/server/auth";

export default async function OnboardingPage() {
  const user = await requireUser();
  return <OnboardingScreen currentName={user.displayName} />;
}
