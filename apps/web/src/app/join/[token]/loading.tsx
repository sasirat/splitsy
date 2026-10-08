import { PhoneFrame } from "@/components/ui/phone-frame";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PhoneFrame scene="green" className="items-center justify-center gap-4 px-6" aria-busy>
      <span className="sr-only" role="status">
        Loading invite…
      </span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-4 h-12 w-full rounded-full" />
    </PhoneFrame>
  );
}
