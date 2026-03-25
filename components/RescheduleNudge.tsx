"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PlanItem } from "@/app/actions/ai"
import { forcePlanRegenerate } from "@/app/actions/ai"

type Task = {
  id: string
  completed: boolean
}

const DISMISS_KEY = "daymind_nudge_dismissed"

function parseScheduledTime(timeStr: string): Date | null {
  // Parse "9:00 AM", "2:30 PM" etc into today's date
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
}

export default function RescheduleNudge({
  plan,
  tasks,
}: {
  plan: PlanItem[]
  tasks: Task[]
}) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(true)
  const [rescheduling, setRescheduling] = useState(false)
  const [behindMinutes, setBehindMinutes] = useState(0)

  useEffect(() => {
    // Check if already dismissed this session
    const dismissedAt = sessionStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      if (dismissedDate.toDateString() === new Date().toDateString()) {
        setDismissed(true)
        return
      }
    }

    // Find first uncompleted task in the plan
    const completedIds = new Set(tasks.filter((t) => t.completed).map((t) => t.id))
    const firstUncompleted = plan.find((item) => !completedIds.has(item.taskId))
    if (!firstUncompleted) {
      setDismissed(true)
      return
    }

    const scheduledTime = parseScheduledTime(firstUncompleted.scheduledTime)
    if (!scheduledTime) {
      setDismissed(true)
      return
    }

    const now = new Date()
    const diffMs = now.getTime() - scheduledTime.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin >= 30) {
      setBehindMinutes(diffMin)
      setDismissed(false)
    }
  }, [plan, tasks])

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, new Date().toISOString())
    setDismissed(true)
  }

  async function handleReschedule() {
    setRescheduling(true)
    try {
      await forcePlanRegenerate("user_me")
      router.refresh()
    } finally {
      setRescheduling(false)
      setDismissed(true)
    }
  }

  if (dismissed) return null

  const hours = Math.floor(behindMinutes / 60)
  const mins = behindMinutes % 60
  const behindText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div
      className="rounded-2xl p-4 mb-6 animate-slide-up"
      style={{
        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.04))",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        boxShadow: "0 0 20px rgba(245, 158, 11, 0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(245, 158, 11, 0.15)" }}
        >
          <svg className="w-4 h-4" style={{ color: "#fbbf24" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "#fbbf24" }}>
            Running ~{behindText} behind
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(236, 253, 245, 0.6)" }}>
            Your plan has shifted. Want me to reschedule the rest of your day from now?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReschedule}
              disabled={rescheduling}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                boxShadow: "0 2px 12px rgba(245, 158, 11, 0.3)",
              }}
            >
              {rescheduling ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rescheduling...
                </span>
              ) : (
                "Reschedule"
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ color: "rgba(245, 158, 11, 0.6)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            >
              I&apos;m on track
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
