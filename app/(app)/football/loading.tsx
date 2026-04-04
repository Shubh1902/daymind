import { PageHeaderSkeleton, Shimmer, ListSkeleton } from "@/components/LoadingSkeleton"

export default function FootballLoading() {
  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <PageHeaderSkeleton />
      <div className="flex gap-2 p-1 rounded-xl mb-4" style={{ background: "#f3f4f6" }}>
        <Shimmer className="flex-1 h-10 rounded-lg" />
        <Shimmer className="flex-1 h-10 rounded-lg" />
      </div>
      <Shimmer className="h-12 w-full rounded-xl mb-4" />
      <ListSkeleton count={6} />
    </div>
  )
}
