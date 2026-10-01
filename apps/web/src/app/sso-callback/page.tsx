"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { safeRedirectPath } from "@/server/session";

/** Finishes a Google sign-in that needed an extra step — mainly turning a
 *  first-time Google login into a new account ("transfer"). Follows Clerk's
 *  custom OAuth flow; then continues to the sanitized `next` path. */
function SsoCallback() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next") ?? undefined);
  const hasRun = useRef(false);

  useEffect(() => {
    const backToLogin = () => router.push(`/login?next=${encodeURIComponent(next)}`);
    const go = async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
      const url = decorateUrl(next);
      if (url.startsWith("http")) window.location.href = url;
      else router.push(url);
    };

    void (async () => {
      if (!clerk.loaded || hasRun.current) return;
      // Don't re-run while the session activates and the page re-renders.
      hasRun.current = true;

      if (signIn.status === "complete") return void (await signIn.finalize({ navigate: go }));

      // A sign-up that matched an existing account: turn it into a sign-in.
      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        const status = signIn.status as typeof signIn.status | "complete";
        if (status === "complete") return void (await signIn.finalize({ navigate: go }));
        return backToLogin();
      }

      // A Google account we haven't seen: create the account from it.
      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === "complete") return void (await signUp.finalize({ navigate: go }));
        return backToLogin();
      }

      if (signUp.status === "complete") return void (await signUp.finalize({ navigate: go }));

      // Already signed in on this device with that account: just activate it.
      const sessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (sessionId) return void (await clerk.setActive({ session: sessionId, navigate: go }));

      // Anything else (extra factors etc.) isn't supported here.
      backToLogin();
    })();
  }, [clerk, signIn, signUp, router, next]);

  return null;
}

export default function SsoCallbackPage() {
  return (
    <PhoneFrame scene="blue" className="items-center justify-center gap-4 px-6 text-center">
      <p role="status" className="text-body text-cream">
        Signing you in…
      </p>
      {/* Sign-up may need a captcha; Clerk renders it here. */}
      <div id="clerk-captcha" />
      <Suspense>
        <SsoCallback />
      </Suspense>
    </PhoneFrame>
  );
}
