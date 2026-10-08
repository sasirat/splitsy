import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { BillCard } from "@/modules/bills/components/bill-card";
import { listMyBills } from "@/modules/bills/queries";
import { GroupCard } from "@/modules/groups/components/group-card";
import { listMyGroups } from "@/modules/groups/queries";
import { requireOnboardedUser } from "@/server/auth";

/** Home: your groups and bills, in the group page's style (petal scene). */
export default async function Home() {
  const user = await requireOnboardedUser();
  const [bills, groups] = await Promise.all([listMyBills(), listMyGroups()]);

  return (
    <PhoneFrame scene="petal" className="gap-6 px-5 pt-10 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <p className="text-sm wrap-anywhere text-pebble">Hey {user.displayName}!</p>
          <h1 className="text-4xl text-primary">Your bills</h1>
        </div>
        <Link
          href="/onboarding"
          className="shrink-0 pt-1 text-caption text-lagoon underline underline-offset-4"
        >
          Edit name
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-pebble">Your groups</h2>
          <Link
            href="/groups/new"
            className="text-caption text-lagoon underline underline-offset-4"
          >
            + New group
          </Link>
        </div>
        {groups.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupCard {...group} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-pebble">Bills · {bills.length}</h2>
        {bills.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {bills.map((bill) => (
              <li key={bill.id}>
                <BillCard {...bill} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-10 text-center">
            <p className="text-2xl text-primary">No bills yet</p>
            <p className="text-body text-pebble">Start one and nobody does mental math again.</p>
          </div>
        )}
      </section>

      <div className="mt-auto flex flex-col items-center gap-2">
        <Link href="/bills/new" className={buttonVariants({ size: "lg", className: "w-full" })}>
          + New bill
        </Link>
        <SignOutButton className="text-pebble" />
      </div>
    </PhoneFrame>
  );
}
