import { PageHeaderSkeleton, Shimmer, ListSkeleton } from "@/components/LoadingSkeleton"

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      {/* Briefing card skeleton */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
        <Shimmer className="h-5 w-40 mb-3" />
        <Shimmer className="h-3 w-full mb-2" />
        <Shimmer className="h-3 w-4/5 mb-2" />
        <Shimmer className="h-3 w-3/5" />
      </div>
      {/* Schedule skeleton */}
      <Shimmer className="h-5 w-36 mb-3" />
      <ListSkeleton count={5} />
    </div>
  )
}
