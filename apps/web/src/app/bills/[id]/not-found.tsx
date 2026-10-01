import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";

/** Same message whether the bill doesn't exist or you're not in its group,
 *  so outsiders can't probe which bill ids are real. */
export default function BillNotFound() {
  return (
    <PhoneFrame scene="green" className="items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-h2 text-white">Bill not found</h1>
      <p className="text-body text-cream/90">
        It may not exist, or you&apos;re not in its group. Ask whoever shared it to send you an
        invite.
      </p>
      <Link href="/" className="text-caption text-cream underline underline-offset-4">
        Back to your bills
      </Link>
    </PhoneFrame>
  );
}
