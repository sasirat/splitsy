"use client";

import { useClerk } from "@clerk/nextjs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

/** Signs out of both Clerk (Google) and dev sign-in, then goes to /login. */
function SignOutButton({ className }: { className?: string }) {
  const clerk = useClerk();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="link"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (clerk.session) await clerk.signOut();
          await signOut(); // clears the dev cookie and redirects to /login
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export { SignOutButton };
