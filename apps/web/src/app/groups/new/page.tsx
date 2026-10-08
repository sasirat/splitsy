import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { CreateGroupForm } from "@/modules/groups/components/create-group-form";
import { requireOnboardedUser } from "@/server/auth";

export default async function NewGroupPage() {
  await requireOnboardedUser();

  return (
    <PhoneFrame scene="sky" className="px-6 pt-8 pb-8">
      <Link
        href="/"
        className="self-start text-caption text-lagoon underline underline-offset-4 tap-target"
      >
        ← Your bills
      </Link>
      <h1 className="mt-6 text-center text-flourish whitespace-nowrap text-primary">New Group</h1>
      <p className="-mt-2 text-center text-sm text-primary/80">
        For people you split with again and again.
      </p>
      <CreateGroupForm />
    </PhoneFrame>
  );
}
