import { PageHeaderSkeleton, SubNavSkeleton, CardGridSkeleton } from "@/components/LoadingSkeleton"

export default function CombosLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <SubNavSkeleton />
      <CardGridSkeleton count={6} cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
    </div>
  )
}
