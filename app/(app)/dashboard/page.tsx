export const dynamic = "force-dynamic"

import { Suspense } from "react"
import DashboardAISection from "./DashboardAISection"
import { Shimmer, ListSkeleton } from "@/components/LoadingSkeleton"

export default function DashboardPage() {
  const greeting = getGreeting()

  return (
    <div className="pb-40 animate-fade-in">
      {/* Header — renders instantly */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">{greeting}</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* AI + tasks stream in behind skeleton */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardAISection />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
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
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}
