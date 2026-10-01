"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { clearDevSession } from "../actions";

/** Signs out of both dev sign-in and Clerk (Google), then goes to /login.
 *  The dev cookie is cleared first so the single navigation at the end can't
 *  land back on a page while still signed in as a dev user. */
function SignOutButton({ className }: { className?: string }) {
  const clerk = useClerk();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="link"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await clearDevSession();
          if (clerk.session) {
            await clerk.signOut({ redirectUrl: "/login" });
          } else {
            router.push("/login");
          }
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export { SignOutButton };
