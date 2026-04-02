import { PageHeaderSkeleton, SubNavSkeleton, StatCardsSkeleton, Shimmer } from "@/components/LoadingSkeleton"

export default function OrganizeLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <SubNavSkeleton />
      <StatCardsSkeleton count={3} />
      <div className="mt-5 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <Shimmer className="w-9 h-9 rounded-xl" />
              <Shimmer className="h-4 w-28" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <Shimmer key={j} className="w-[120px] shrink-0 rounded-xl" style={{ aspectRatio: "3/4" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
