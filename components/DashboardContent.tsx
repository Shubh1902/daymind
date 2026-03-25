"use client"

import { useState } from "react"
import DayPlan from "./DayPlan"
import WeekStrip from "./WeekStrip"
import TaskFocusView from "./TaskFocusView"
import EveningReview from "./EveningReview"
import type { PlanItem } from "@/app/actions/ai"

type Task = {
  id: string
  text: string
  deadline: Date | null
  estimatedMinutes: number | null
  priority: string
  category: string | null
  completed: boolean
  notes: string | null
  deferCount: number
}

type View = "schedule" | "focus"

export default function DashboardContent({
  openTasks,
  allTasks,
  plan,
}: {
  openTasks: Task[]
  allTasks: Task[]
  plan: PlanItem[]
}) {
  const [view, setView] = useState<View>("schedule")
  const [showReview, setShowReview] = useState(false)

  return (
    <>
      {/* View toggle + Evening Review */}
      <div className="flex gap-2 mb-6">
        <div
          className="flex gap-1 rounded-2xl p-1 flex-1"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          {(["schedule", "focus"] as View[]).map((v) => {
            const isActive = view === v
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl capitalize transition-all duration-200"
                style={{
                  background: isActive ? "linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(16, 185, 129, 0.2))" : "transparent",
                  color: isActive ? "#6ee7b7" : "rgba(16, 185, 129, 0.4)",
                  boxShadow: isActive ? "0 0 12px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                  border: isActive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid transparent",
                }}
              >
                {v === "schedule" ? "Schedule" : "Focus"}
              </button>
            )
          })}
        </div>

        {/* Evening Review button */}
        <button
          onClick={() => setShowReview(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "rgba(16, 185, 129, 0.5)",
          }}
          aria-label="Start evening review"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
          <span className="hidden sm:inline">Review</span>
        </button>
      </div>

      {view === "schedule" && (
        <div className="animate-fade-in">
          <WeekStrip tasks={allTasks} />
          <DayPlan plan={plan} tasks={openTasks} />
        </div>
      )}

      {view === "focus" && (
        <TaskFocusView tasks={openTasks} onClose={() => setView("schedule")} />
      )}

      {showReview && (
        <EveningReview tasks={openTasks} onClose={() => setShowReview(false)} />
      )}
    </>
  )
}
