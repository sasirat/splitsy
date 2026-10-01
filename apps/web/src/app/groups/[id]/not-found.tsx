import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";

/** Same message whether the group doesn't exist or you're not in it. */
export default function GroupNotFound() {
  return (
    <PhoneFrame scene="blue" className="items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-h2 text-white">Group not found</h1>
      <p className="text-body text-cream/90">
        It may not exist, or you&apos;re not a member. Ask someone in the group to invite you.
      </p>
      <Link href="/" className="text-caption text-cream underline underline-offset-4">
        Back to your bills
      </Link>
    </PhoneFrame>
  );
}
