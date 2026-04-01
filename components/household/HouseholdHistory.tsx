"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getChoreEmoji, getChoreLabel } from "@/lib/household-chores"

type Member = { id: string; name: string; slug: string; color: string }
type TaskItem = {
  id: string; choreType: string; description: string | null
  durationMinutes: number; effortScore: number; completedAt: string
  source: string; member: Member
}

interface Props {
  initialTasks: TaskItem[]
  members: Member[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export default function HouseholdHistory({ initialTasks, members }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [filterMember, setFilterMember] = useState<string | null>(null)
  const [range, setRange] = useState<"week" | "month" | "all">("week")
  const [loading, setLoading] = useState(false)

  async function fetchTasks(r: string, m: string | null) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ range: r })
      if (m) params.set("memberId", m)
      const res = await fetch(`/api/household/tasks?${params}`)
      if (res.ok) setTasks(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks(range, filterMember)
  }, [range, filterMember])

  async function deleteTask(id: string) {
    if (!confirm("Remove this entry?")) return
    await fetch(`/api/household/tasks/${id}`, { method: "DELETE" })
    setTasks((prev) => prev.filter((t) => t.id !== id))
    router.refresh()
  }

  // Group by date
  const grouped = new Map<string, TaskItem[]>()
  for (const task of tasks) {
    const key = formatDate(task.completedAt)
    const list = grouped.get(key) ?? []
    list.push(task)
    grouped.set(key, list)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilterMember(null)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: !filterMember ? "#fff7ed" : "#f9fafb",
            color: !filterMember ? "#9a3412" : "#9ca3af",
            border: !filterMember ? "1.5px solid #f97316" : "1px solid #e5e7eb",
          }}
        >
          All
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all"
            style={{
              background: filterMember === m.id ? `${m.color}15` : "#f9fafb",
              color: filterMember === m.id ? m.color : "#9ca3af",
              border: filterMember === m.id ? `1.5px solid ${m.color}` : "1px solid #e5e7eb",
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
            {m.name}
          </button>
        ))}
        <div className="w-px shrink-0" style={{ background: "#e5e7eb" }} />
        {(["week", "month", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
            style={{
              background: range === r ? "#f3f4f6" : "#f9fafb",
              color: range === r ? "#1f2937" : "#9ca3af",
              border: range === r ? "1.5px solid #d1d5db" : "1px solid #e5e7eb",
            }}
          >
            {r === "all" ? "All time" : `This ${r}`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Task list grouped by date */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-12">
          <span className="text-3xl block mb-2">📭</span>
          <p className="text-sm font-medium" style={{ color: "#6b7280" }}>No chores found</p>
          <p className="text-xs mt-1" style={{ color: "#d1d5db" }}>Try a different filter or time range</p>
        </div>
      )}

      {!loading && Array.from(grouped.entries()).map(([dateLabel, dateTasks]) => (
        <div key={dateLabel}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "#9ca3af" }}>
            {dateLabel}
          </p>
          <div className="space-y-1.5">
            {dateTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ background: task.member.color }}
                >
                  {task.member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{getChoreEmoji(task.choreType)}</span>
                    <span className="text-sm font-medium" style={{ color: "#1f2937" }}>
                      {getChoreLabel(task.choreType)}
                    </span>
                    {task.source === "voice" && (
                      <span className="text-xs" title="Logged via voice">🎙️</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs truncate" style={{ color: "#9ca3af" }}>{task.description}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#374151" }}>
                      {task.durationMinutes}m
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: "#d1d5db" }}>{formatTime(task.completedAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#d1d5db" }}
                    aria-label="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
