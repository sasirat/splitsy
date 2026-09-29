import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { initialsOf } from "@/lib/format";
import { signInAs } from "../actions";
import type { DevUser } from "../queries";

/** Login screen (Figma "login"): the paper collage with the wordmark, and the
 *  sign-in actions in the footer. Until Clerk lands, the footer offers one
 *  "Continue as …" button per user (dev only). */
function LoginScreen({
  users,
  next,
  devSignIn,
}: {
  users: DevUser[];
  next?: string;
  devSignIn: boolean;
}) {
  return (
    <PhoneFrame scene="blue" className="justify-between">
      <div className="flex flex-1 items-center justify-center px-4 pt-12 pb-6">
        {/* Positions are the Figma frame's, as % of the 360×304 collage. */}
        <div className="relative aspect-[360/304] w-full max-w-[360px]">
          <Image
            src="/art/login-collage.png"
            alt=""
            fill
            priority
            sizes="360px"
            className="object-contain"
          />
          <Image
            src="/art/star-red.png"
            alt=""
            width={900}
            height={806}
            className="absolute top-0 left-[6%] h-auto w-[31%] -rotate-[18deg]"
          />
          <div className="absolute inset-y-[12%] right-[15%] left-[20%] flex flex-col items-center justify-center text-center text-primary">
            <h1 className="text-wordmark leading-none">Splitsy</h1>
            <p className="text-script opacity-90">Split the bill, keep the vibe.</p>
            <p className="text-sm opacity-80">Nobody does mental math.</p>
          </div>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-6 px-6 pb-8">
        {devSignIn ? (
          users.length > 0 ? (
            <div className="flex w-full flex-col items-center gap-3">
              <p className="text-micro text-cream/60">Dev sign-in · pick a friend</p>
              <ul className="flex w-full flex-col gap-3">
                {users.map((user) => {
                  const name = user.displayName ?? user.email;
                  return (
                    <li key={user.id}>
                      <form action={signInAs}>
                        <input type="hidden" name="userId" value={user.id} />
                        {next ? <input type="hidden" name="next" value={next} /> : null}
                        <Button type="submit" size="lg" className="h-12.5 w-full">
                          <Avatar size="md" tone="white">
                            {initialsOf(name)}
                          </Avatar>
                          Continue as {name}
                        </Button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-center text-body text-cream">
              No users yet — run <code className="font-mono">pnpm --filter web db:seed</code>.
            </p>
          )
        ) : (
          <p className="text-center text-body text-cream">Sign-in isn&apos;t available yet.</p>
        )}
        <p className="text-micro text-cream/60">Terms, privacy, the usual</p>
      </footer>
    </PhoneFrame>
  );
}

export { LoginScreen };
