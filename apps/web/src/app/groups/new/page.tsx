import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { CreateGroupForm } from "@/modules/groups/components/create-group-form";
import { requireOnboardedUser } from "@/server/auth";

export default async function NewGroupPage() {
  await requireOnboardedUser();

  return (
    <PhoneFrame scene="cream" className="px-6 pt-8 pb-8">
      <Link href="/" className="self-start text-caption text-primary underline underline-offset-4">
        ← Your bills
      </Link>
      <h1 className="mt-6 text-h1 text-ink">New group</h1>
      <p className="mt-2 mb-6 text-body text-muted-foreground">
        For people you split with again and again.
      </p>
      <CreateGroupForm />
    </PhoneFrame>
  );
}
