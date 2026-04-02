import { PageHeaderSkeleton, ListSkeleton } from "@/components/LoadingSkeleton"

export default function TasksLoading() {
  return (
    <div className="animate-fade-in pb-24">
      <PageHeaderSkeleton />
      <ListSkeleton count={8} />
    </div>
  )
}
