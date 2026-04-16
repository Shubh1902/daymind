import { Suspense } from "react"
import Link from "next/link"
import TaskList from "./TaskList"
import { ListSkeleton } from "@/components/LoadingSkeleton"

export default function TasksPage() {
  return (
    <div className="animate-fade-in">
      {/* Header — renders instantly */}
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">All Tasks</h1>
        </div>
        <Link
          href="/tasks/new"
          className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {/* Task list streams in behind skeleton */}
      <Suspense fallback={<ListSkeleton count={6} />}>
        <TaskList />
      </Suspense>
    </div>
  )
}
