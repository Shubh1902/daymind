"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CHORE_CATEGORIES, getChoreEmoji, getChoreLabel, getChoreDefaults } from "@/lib/household-chores"

type Member = { id: string; name: string; slug: string; color: string }
type TaskItem = {
  id: string; choreType: string; description: string | null
  durationMinutes: number; effortScore: number; completedAt: string
  source: string; member: Member; memberId?: string
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

const DURATION_CHIPS = [10, 15, 20, 30, 45, 60, 90]

export default function HouseholdHistory({ initialTasks, members }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [filterMember, setFilterMember] = useState<string | null>(null)
  const [range, setRange] = useState<"week" | "month" | "all">("week")
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit state
  const [editChore, setEditChore] = useState("")
  const [editDuration, setEditDuration] = useState(0)
  const [editMemberId, setEditMemberId] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)

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

  function startEdit(task: TaskItem) {
    setEditingId(task.id)
    setEditChore(task.choreType)
    setEditDuration(task.durationMinutes)
    setEditMemberId(task.memberId ?? task.member.id)
    setEditDescription(task.description ?? "")
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/household/tasks/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreType: editChore,
          durationMinutes: editDuration,
          memberId: editMemberId,
          description: editDescription || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTasks((prev) => prev.map((t) => t.id === editingId ? updated : t))
        setEditingId(null)
        router.refresh()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

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

      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

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
            {dateTasks.map((task) => {
              const isEditing = editingId === task.id

              if (isEditing) {
                return (
                  <div key={task.id} className="rounded-xl p-4 space-y-3 animate-slide-up" style={{ background: "#ffffff", border: "2px solid #f97316", boxShadow: "0 4px 12px rgba(249,115,22,0.1)" }}>
                    {/* Who */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>Who</p>
                      <div className="flex gap-2">
                        {members.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setEditMemberId(m.id)}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: editMemberId === m.id ? m.color : "#f9fafb",
                              color: editMemberId === m.id ? "#fff" : "#6b7280",
                              border: editMemberId === m.id ? `2px solid ${m.color}` : "1px solid #e5e7eb",
                            }}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chore type */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>Chore</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {CHORE_CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setEditChore(c.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: editChore === c.id ? "#fff7ed" : "#f9fafb",
                              color: editChore === c.id ? "#9a3412" : "#6b7280",
                              border: editChore === c.id ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                            }}
                          >
                            {c.emoji} {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>Duration</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {DURATION_CHIPS.map((d) => (
                          <button
                            key={d}
                            onClick={() => setEditDuration(d)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: editDuration === d ? "#fff7ed" : "#f9fafb",
                              color: editDuration === d ? "#9a3412" : "#6b7280",
                              border: editDuration === d ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                            }}
                          >
                            {d}m
                          </button>
                        ))}
                        <input
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 rounded-lg text-xs text-center input-dark"
                          min={1} max={480}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>Notes</p>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Optional note..."
                        className="input-dark w-full text-xs px-3 py-2 rounded-lg"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 btn-primary text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        {saving ? (
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl group cursor-pointer transition-all hover:shadow-sm"
                  style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
                  onClick={() => startEdit(task)}
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
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "#ef4444", background: "#fef2f2" }}
                      aria-label="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
