"use client"

import { useState } from "react"
import DayPlan from "./DayPlan"
import WeekStrip from "./WeekStrip"
import TaskFocusView from "./TaskFocusView"
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

  return (
    <>
      {/* View toggle */}
      <div
        className="flex gap-1 rounded-2xl p-1 mb-6"
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

      <div className="animate-fade-in" key={view}>
        {view === "schedule" ? (
          <>
            <WeekStrip tasks={allTasks} />
            <DayPlan plan={plan} tasks={openTasks} />
          </>
        ) : (
          <TaskFocusView tasks={openTasks} />
        )}
      </div>
    </>
  )
}
