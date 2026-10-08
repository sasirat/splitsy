import { PhoneFrame } from "@/components/ui/phone-frame";
import { Skeleton } from "@/components/ui/skeleton";

/** The settle page's own skeleton, on its sky scene (the bill's is green). */
export default function Loading() {
  return (
    <PhoneFrame scene="sky" className="gap-6 px-5 pt-8" aria-busy>
      <span className="sr-only" role="status">
        Loading settle-up…
      </span>
      <Skeleton tone="light" className="h-4 w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton tone="light" className="h-3 w-28" />
        <Skeleton tone="light" className="h-8 w-48" />
      </div>
      <Skeleton tone="light" className="h-14 w-full" />
      <div className="flex flex-col gap-3 bg-paper/60 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} tone="light" className="h-14 w-full" />
        ))}
      </div>
    </PhoneFrame>
  );
}
