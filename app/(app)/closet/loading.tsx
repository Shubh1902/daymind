import { PageHeaderSkeleton, SubNavSkeleton, CardGridSkeleton } from "@/components/LoadingSkeleton"

export default function ClosetLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <SubNavSkeleton />
      <div className="space-y-3 mb-4">
        <div className="animate-pulse h-10 rounded-xl" style={{ background: "#f3f4f6" }} />
        <div className="flex gap-2 overflow-hidden">
          {[60, 80, 90, 80, 70].map((w, i) => (
            <div key={i} className="animate-pulse h-10 shrink-0 rounded-xl" style={{ background: "#f3f4f6", width: `${w}px` }} />
          ))}
        </div>
      </div>
      <CardGridSkeleton count={6} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
    </div>
  )
}
