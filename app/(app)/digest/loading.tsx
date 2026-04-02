import { PageHeaderSkeleton, StatCardsSkeleton, Shimmer } from "@/components/LoadingSkeleton"

export default function DigestLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="mt-5 rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
        <Shimmer className="h-5 w-32 mb-3" />
        <Shimmer className="h-3 w-full mb-2" />
        <Shimmer className="h-3 w-4/5 mb-2" />
        <Shimmer className="h-3 w-2/3" />
      </div>
    </div>
  )
}
