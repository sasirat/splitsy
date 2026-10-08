import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { formatBillDate, formatBillTime } from "@/lib/format";
import { notFound } from "next/navigation";
import { CreateBillForm } from "@/modules/bills/components/create-bill-form";
import { getGroup } from "@/modules/groups/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function NewBillPage({ searchParams }: PageProps<"/bills/new">) {
  const user = await requireOnboardedUser();
  const { group: groupParam } = await searchParams;
  // ?group=<id> starts the bill inside a group you're in; anything else 404s.
  const group = typeof groupParam === "string" ? await getGroup(groupParam) : null;
  if (groupParam !== undefined && !group) notFound();
  const now = new Date();

  return (
    <PhoneFrame scene="petal" className="px-6 pt-8 pb-8">
      <Link
        href={group ? `/groups/${group.id}` : "/"}
        className="self-start text-caption text-lagoon underline underline-offset-4 tap-target"
      >
        {group ? `← ${group.name}` : "← Your bills"}
      </Link>
      <p className="mt-6 text-sm break-words text-pebble">Hey {user.displayName}!</p>
      <h1 className="text-4xl text-primary">Start your bill!</h1>
      <p className="mt-2 mb-6 text-body text-pebble">
        {group ? (
          <>
            In <span className="text-body-bold text-primary">{group.name}</span> — everyone in the
            group can see it and claim items.
          </>
        ) : (
          "Name it, share it, pile on the snacks."
        )}
      </p>
      <CreateBillForm date={formatBillDate(now)} time={formatBillTime(now)} groupId={group?.id} />
    </PhoneFrame>
  );
}
