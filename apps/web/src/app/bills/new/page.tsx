import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { formatBillDate, formatBillTime } from "@/lib/format";
import { CreateBillForm } from "@/modules/bills/components/create-bill-form";
import { requireOnboardedUser } from "@/server/auth";

export default async function NewBillPage() {
  const user = await requireOnboardedUser();
  const now = new Date();

  return (
    <PhoneFrame scene="cream" className="px-6 pt-8 pb-8">
      <Link href="/" className="self-start text-caption text-primary underline underline-offset-4">
        ← Your bills
      </Link>
      <p className="mt-6 text-label text-primary">Hey {user.displayName}!</p>
      <h1 className="mt-1 text-h1 text-ink">Start your bill!</h1>
      <p className="mt-2 mb-6 text-body text-muted-foreground">
        Name it, share it, pile on the snacks.
      </p>
      <CreateBillForm date={formatBillDate(now)} time={formatBillTime(now)} />
    </PhoneFrame>
  );
}
