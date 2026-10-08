import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";

/** Same message whether the group doesn't exist or you're not in it. */
export default function GroupNotFound() {
  return (
    <PhoneFrame scene="petal" className="items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-h2 text-primary">Group not found</h1>
      <p className="text-body text-pebble">
        It may not exist, or you&apos;re not a member. Ask someone in the group to invite you.
      </p>
      <Link href="/" className="text-caption text-lagoon underline underline-offset-4 tap-target">
        Back to your bills
      </Link>
    </PhoneFrame>
  );
}
