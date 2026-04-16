export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Link from "next/link"
import FootballContent from "./FootballContent"
import { Shimmer, ListSkeleton } from "@/components/LoadingSkeleton"

export default function FootballPage() {
  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      {/* Header — renders instantly */}
      <div className="flex items-center justify-between mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Football</h1>
        <div className="flex gap-2">
          <Link
            href="/football/stats"
            className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
          >
            📊 Stats
          </Link>
          <Link
            href="/football/history"
            className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
          >
            📋 History
          </Link>
        </div>
      </div>

      {/* Data streams in behind skeleton */}
      <Suspense fallback={<FootballSkeleton />}>
        <FootballContent />
      </Suspense>
    </div>
  )
}

function FootballSkeleton() {
  return (
    <>
      {/* Stats line */}
      <Shimmer className="h-3 w-48 mb-5" />

      {/* Dashboard card skeleton */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
        <Shimmer className="h-5 w-32 mb-3" />
        <div className="flex gap-3">
          <Shimmer className="flex-1 h-16 rounded-xl" />
          <Shimmer className="flex-1 h-16 rounded-xl" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "#f3f4f6" }}>
        {[80, 75, 65, 80, 90].map((w, i) => (
          <Shimmer key={i} className="flex-1 h-9 rounded-lg" />
        ))}
      </div>

      {/* Player list skeleton */}
      <ListSkeleton count={8} />
    </>
  )
}
