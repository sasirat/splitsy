import { PhoneFrame } from "@/components/ui/phone-frame";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PhoneFrame scene="petal" className="gap-6 px-5 pt-8" aria-busy>
      <span className="sr-only" role="status">
        Loading group…
      </span>
      <Skeleton tone="light" className="h-4 w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton tone="light" className="h-4 w-16" />
        <Skeleton tone="light" className="h-10 w-48" />
      </div>
      <Skeleton tone="light" className="h-20 w-full rounded-xl" />
      {[0, 1].map((i) => (
        <Skeleton key={i} tone="light" className="h-24 w-full rounded-xl" />
      ))}
    </PhoneFrame>
  );
}
