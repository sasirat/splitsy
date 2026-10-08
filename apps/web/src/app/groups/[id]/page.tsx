import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { MemberTile } from "@/components/ui/member-tile";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { initialsOf, personName } from "@/lib/format";
import { BillCard } from "@/modules/bills/components/bill-card";
import { InviteButton } from "@/modules/groups/components/invite-button";
import { getGroup } from "@/modules/groups/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function GroupPage({ params }: PageProps<"/groups/[id]">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  return (
    <PhoneFrame scene="petal" className="gap-6 px-5 pt-8 pb-8">
      <Link href="/" className="self-start text-caption text-lagoon underline underline-offset-4">
        ← Your bills
      </Link>

      <header className="flex flex-col">
        <p className="text-sm text-pebble">Group</p>
        <h1 className="text-4xl wrap-anywhere text-primary">{group.name}</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-pebble">Members · {group.members.length}</h2>
        <div className="flex flex-col gap-5 rounded-lg bg-white p-5 shadow-[0_4px_4px_rgb(193_190_190/0.25)]">
          <ul className="grid grid-cols-4 justify-items-center gap-y-3">
            {group.members.map((member) => {
              const name = personName(member);
              return (
                <li key={member.id}>
                  <MemberTile
                    initials={initialsOf(name)}
                    name={member.id === user.id ? "You" : name}
                  />
                </li>
              );
            })}
          </ul>
          <InviteButton
            groupId={group.id}
            label="Invite Friends +"
            className="h-11 text-base text-lagoon"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-pebble">Bills · {group.bills.length}</h2>
        {group.bills.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {group.bills.map((bill) => (
              <li key={bill.id}>
                <BillCard {...bill} look="sticker" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-white px-6 py-6 text-center text-body text-pebble">
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
