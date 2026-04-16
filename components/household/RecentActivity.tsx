"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CHORE_CATEGORIES, getChoreEmoji, getChoreLabel, getChoreDefaults } from "@/lib/household-chores"

type Member = { id: string; name: string; slug: string; color: string }
type TaskItem = {
  id: string; choreType: string; description: string | null
  durationMinutes: number; completedAt: string; source: string
  memberId?: string
  member: { name: string; color: string; slug: string; id?: string }
}

interface Props {
  tasks: TaskItem[]
  members: Member[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

const DURATION_CHIPS = [10, 15, 20, 30, 45, 60, 90]

export default function RecentActivity({ tasks: initialTasks, members }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editChore, setEditChore] = useState("")
  const [editDuration, setEditDuration] = useState(0)
  const [editMemberId, setEditMemberId] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function startEdit(task: TaskItem) {
    setEditingId(task.id)
    setEditChore(task.choreType)
    setEditDuration(task.durationMinutes)
    setEditMemberId(task.memberId ?? task.member.id ?? members.find((m) => m.slug === task.member.slug)?.id ?? "")
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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-2xl block mb-2">📝</span>
        <p className="text-sm" style={{ color: "#9ca3af" }}>No chores logged yet this week</p>
        <p className="text-xs mt-1" style={{ color: "#d1d5db" }}>Use the text input above or tap the mic</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: "#1f2937" }}>Recent Activity</h3>
      <div className="space-y-2">
        {tasks.map((task) => {
          if (editingId === task.id) {
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

                {/* Chore */}
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

                {/* Notes */}
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
                  <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
                    Cancel
                  </button>
                  <button onClick={saveEdit} disabled={saving} className="flex-1 btn-primary text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
                    {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={task.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group hover:shadow-sm"
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
                  <span className="text-sm font-medium truncate" style={{ color: "#1f2937" }}>
                    {getChoreLabel(task.choreType)}
                  </span>
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
                  <p className="text-xs mt-0.5" style={{ color: "#d1d5db" }}>{mounted ? timeAgo(task.completedAt) : ""}</p>
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
  )
}
