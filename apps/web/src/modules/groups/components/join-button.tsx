"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { joinGroup } from "../actions";

/** Joins via a button (not on page load), so link-preview bots that fetch
 *  /join/<token> can't add anyone. */
function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function join() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => joinGroup({ token }));
      if (!result.ok) return setError(result.error);
      router.push(result.redirectTo);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button size="lg" className="w-full" onClick={join} disabled={pending}>
        {pending ? "Joining…" : "Join"}
      </Button>
      {error ? (
        <p role="alert" className="text-center text-body text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { JoinButton };
