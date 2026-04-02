import { PageHeaderSkeleton, RingSkeleton, StatCardsSkeleton, ListSkeleton, Shimmer } from "@/components/LoadingSkeleton"

export default function HouseholdLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      {/* Quick input skeleton */}
      <div className="flex gap-2 mb-4">
        <Shimmer className="flex-1 h-11 rounded-xl" />
        <Shimmer className="w-14 h-11 rounded-xl" />
      </div>
      <RingSkeleton />
      <div className="mb-5">
        <StatCardsSkeleton count={2} />
      </div>
      <div className="flex gap-3 mb-5">
        <Shimmer className="flex-1 h-14 rounded-xl" />
        <Shimmer className="flex-1 h-14 rounded-xl" />
      </div>
      <ListSkeleton count={4} />
    </div>
  )
}
