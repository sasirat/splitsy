import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { initialsOf, personName } from "@/lib/format";
import { BillCard } from "@/modules/bills/components/bill-card";
import { getGroup } from "@/modules/groups/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function GroupPage({ params }: PageProps<"/groups/[id]">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  return (
    <PhoneFrame scene="blue" className="gap-6 px-5 pt-8 pb-8">
      <Link href="/" className="self-start text-caption text-cream underline underline-offset-4">
        ← Your bills
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-label text-cream/80">Group</p>
        <h1 className="text-h1 wrap-anywhere text-white">{group.name}</h1>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-label text-cream/80">Members · {group.members.length}</h2>
        <ul className="flex flex-col gap-2 rounded-xl bg-paper px-4 py-3">
          {group.members.map((member) => {
            const name = personName(member);
            return (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar size="md" tone="pink">
                  {initialsOf(name)}
                </Avatar>
                <span className="min-w-0 text-body wrap-anywhere text-ink">
                  {member.id === user.id ? "You" : name}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-label text-cream/80">Bills · {group.bills.length}</h2>
        {group.bills.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {group.bills.map((bill) => (
              <li key={bill.id}>
                <BillCard {...bill} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-paper/10 px-6 py-6 text-center text-body text-cream/80">
            No bills in this group yet.
          </p>
        )}
      </section>

      <Link
        href={`/bills/new?group=${group.id}`}
        className={buttonVariants({ size: "lg", className: "mt-auto w-full" })}
      >
        + New bill in this group
      </Link>
    </PhoneFrame>
  );
}
