"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";

/** Catches unexpected errors anywhere under the root layout. Server errors
 *  arrive with a generic message + digest, so we never show error.message. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PhoneFrame scene="cream" className="items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-h2 text-ink">Something went wrong</h1>
      <p className="text-body text-muted-foreground">
        That didn&apos;t load. It&apos;s probably temporary — try again.
      </p>
      <Button size="lg" className="w-full" onClick={() => retry()}>
        Try again
      </Button>
      <Link href="/" className="text-caption text-primary underline underline-offset-4 tap-target">
        Back to your bills
      </Link>
      {error.digest ? (
        <p className="text-caption text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
    </PhoneFrame>
  );
}
