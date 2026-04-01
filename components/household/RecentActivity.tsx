"use client"

import { getChoreEmoji, getChoreLabel } from "@/lib/household-chores"

type TaskItem = {
  id: string; choreType: string; description: string | null
  durationMinutes: number; completedAt: string; source: string
  member: { name: string; color: string; slug: string }
}

interface Props { tasks: TaskItem[] }

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

export default function RecentActivity({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-2xl block mb-2">📝</span>
        <p className="text-sm" style={{ color: "#9ca3af" }}>No chores logged yet this week</p>
        <p className="text-xs mt-1" style={{ color: "#d1d5db" }}>Tap the + button to log your first chore</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: "#1f2937" }}>Recent Activity</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            {/* Member dot */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: task.member.color }}
            >
              {task.member.name[0]}
            </div>

            {/* Chore info */}
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

            {/* Duration + time */}
            <div className="shrink-0 text-right">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >
                {task.durationMinutes}m
              </span>
              <p className="text-xs mt-0.5" style={{ color: "#d1d5db" }}>{timeAgo(task.completedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
