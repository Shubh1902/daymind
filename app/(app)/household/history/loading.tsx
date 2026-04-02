import { PageHeaderSkeleton, ListSkeleton, Shimmer } from "@/components/LoadingSkeleton"

export default function HouseholdHistoryLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <div className="flex gap-2 mb-4 overflow-hidden">
        {[50, 90, 80, 80, 70, 80].map((w, i) => (
          <Shimmer key={i} className="h-8 shrink-0 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>
      <Shimmer className="h-4 w-16 mb-2" />
      <ListSkeleton count={6} />
    </div>
  )
}
