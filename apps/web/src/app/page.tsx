import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { signOut } from "@/modules/auth/actions";
import { BillCard } from "@/modules/bills/components/bill-card";
import { listMyBills } from "@/modules/bills/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function Home() {
  const user = await requireOnboardedUser();
  const bills = await listMyBills();

  return (
    <PhoneFrame scene="blue" className="gap-6 px-5 pt-10 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-label text-cream/80">Hey {user.displayName}!</p>
          <h1 className="text-h1 text-white">Your bills</h1>
        </div>
        <Link
          href="/onboarding"
          className="pt-1 text-caption text-cream underline underline-offset-4"
        >
          Edit name
        </Link>
      </header>

      {bills.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {bills.map((bill) => (
            <li key={bill.id}>
              <BillCard {...bill} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-paper/10 px-6 py-10 text-center text-cream">
          <p className="text-h4">No bills yet</p>
          <p className="text-body text-cream/80">Start one and nobody does mental math again.</p>
        </div>
      )}

      <div className="mt-auto flex flex-col items-center gap-2">
        <Link href="/bills/new" className={buttonVariants({ size: "lg", className: "w-full" })}>
          + New bill
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="link" className="text-cream">
            Sign out
          </Button>
        </form>
      </div>
    </PhoneFrame>
  );
}
