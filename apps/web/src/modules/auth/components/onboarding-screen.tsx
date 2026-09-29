"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { updateDisplayName } from "../actions";

/** "Who's at the table?" — pick the name friends see on every item you claim.
 *  Shown to new users after sign-in, and from "Edit name" on home. */
function OnboardingScreen({ currentName }: { currentName: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = String(new FormData(event.currentTarget).get("displayName") ?? "");
    startTransition(async () => {
      const result = await updateDisplayName({ displayName });
      if (!result.ok) return setError(result.error);
      router.push("/");
    });
  }

  return (
    <PhoneFrame scene="cream" className="px-6 pt-12 pb-8">
      <p className="text-label text-primary">Splitsy · {currentName ? "Your name" : "Welcome"}</p>
      <h1 className="mt-4 text-h1 text-ink">Who&apos;s at the table?</h1>
      <p className="mt-2 text-body text-muted-foreground">
        Your name gets stuck on every item you pick.
      </p>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col">
        {/* The input sits in the tag's white writing area. */}
        <div className="relative mt-8 aspect-[900/694] w-full">
          <Image
            src="/art/name-tag.png"
            alt=""
            fill
            priority
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-contain"
          />
          <div className="absolute top-[45%] right-[21%] bottom-[28%] left-[7%] flex items-center">
            <label htmlFor="displayName" className="sr-only">
              Your name
            </label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={currentName ?? ""}
              placeholder="Your name"
              maxLength={30}
              autoComplete="nickname"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby="displayName-hint"
              className="h-full border-transparent bg-transparent text-center text-h2 text-primary focus-visible:border-transparent"
            />
          </div>
        </div>

        <p
          id="displayName-hint"
          role={error ? "alert" : undefined}
          className={
            error
              ? "text-center text-body text-primary"
              : "text-center text-caption text-muted-foreground"
          }
        >
          {error ?? "Nicknames welcome · you can change it any time"}
        </p>

        <Button
          type="submit"
          variant="solid"
          size="lg"
          className="mt-auto w-full"
          disabled={pending}
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </form>
    </PhoneFrame>
  );
}

export { OnboardingScreen };
