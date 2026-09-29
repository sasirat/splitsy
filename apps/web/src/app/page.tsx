import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { signOut } from "@/modules/auth/actions";
import { requireUser } from "@/server/auth";

// Placeholder signed-in home; M3 replaces it with the bills list.
export default async function Home() {
  const user = await requireUser();
  const name = user.displayName ?? user.email;

  return (
    <PhoneFrame scene="blue" className="items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-paper px-10 py-8 text-center shadow-card">
        <h1 className="text-h2 text-primary">Hi, {name} 👋</h1>
        <p className="text-script text-primary">Split the bill, keep the vibe.</p>
      </div>

      <Link
        href="/playground"
        className="rounded-full bg-blush px-8 py-3 font-body text-xl text-primary shadow-button"
      >
        View the design system →
      </Link>

      <form action={signOut}>
        <Button type="submit" variant="link" className="text-cream">
          Sign out
        </Button>
      </form>
    </PhoneFrame>
  );
}
