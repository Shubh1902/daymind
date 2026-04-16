export const dynamic = "force-dynamic"

import { Suspense } from "react"
import DigestSection from "./DigestSection"
import { Shimmer, StatCardsSkeleton, ListSkeleton } from "@/components/LoadingSkeleton"

export default function DigestPage() {
  return (
    <div className="pb-24 animate-fade-in">
      {/* Header — renders instantly */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Weekly Digest</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Last 7 days
        </p>
      </div>

      {/* Digest content streams in behind skeleton */}
      <Suspense fallback={<DigestSkeleton />}>
        <DigestSection />
      </Suspense>
    </div>
  )
}

function DigestSkeleton() {
  return (
    <>
      <StatCardsSkeleton count={2} />
      <div className="mt-5">
        <Shimmer className="h-5 w-32 mb-3" />
        <ListSkeleton count={4} />
      </div>
      <div className="mt-5">
        <Shimmer className="h-5 w-40 mb-3" />
        <ListSkeleton count={3} />
      </div>
    </>
  )
}
