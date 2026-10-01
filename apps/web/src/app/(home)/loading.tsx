import { PhoneFrame } from "@/components/ui/phone-frame";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PhoneFrame scene="blue" className="gap-6 px-5 pt-10 pb-8" aria-busy>
      <span className="sr-only" role="status">
        Loading your bills…
      </span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </PhoneFrame>
  );
}
