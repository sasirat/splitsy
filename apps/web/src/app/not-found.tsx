import Link from "next/link";
import { PhoneFrame } from "@/components/ui/phone-frame";

export default function NotFound() {
  return (
    <PhoneFrame scene="cream" className="items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-h2 text-ink">Page not found</h1>
      <p className="text-body text-muted-foreground">
        There&apos;s nothing here. Maybe the link was mistyped?
      </p>
      <Link href="/" className="text-caption text-primary underline underline-offset-4">
        Back to your bills
      </Link>
    </PhoneFrame>
  );
}
