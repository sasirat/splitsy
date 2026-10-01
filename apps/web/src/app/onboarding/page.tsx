import { OnboardingScreen } from "@/modules/auth/components/onboarding-screen";
import { requireUser, suggestedDisplayName } from "@/server/auth";
import { safeRedirectPath } from "@/server/session";

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const user = await requireUser();
  const { next } = await searchParams;
  // Keeps where the user was heading (e.g. an invite link) across onboarding.
  const nextPath = safeRedirectPath(typeof next === "string" ? next : undefined);
  // New Google users get their first name prefilled — one tap to continue.
  const suggestion = user.displayName ? null : await suggestedDisplayName();
  return (
    <OnboardingScreen currentName={user.displayName} suggestedName={suggestion} next={nextPath} />
  );
}
