import { PhoneFrame } from "@/components/ui/phone-frame";
import { Skeleton } from "@/components/ui/skeleton";

/** Covers the bill page and its summary while the bill loads. */
export default function Loading() {
  return (
    <PhoneFrame scene="green" className="gap-6 px-5 pt-8" aria-busy>
      <span className="sr-only" role="status">
        Loading bill…
      </span>
      <Skeleton className="h-4 w-24" />
      <div className="mt-4 flex flex-col gap-4 bg-paper/10 px-5 py-6">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto h-3 w-32" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </PhoneFrame>
  );
}
