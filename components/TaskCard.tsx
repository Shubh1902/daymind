"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const TaskAgentModal = dynamic(() => import("./TaskAgentModal"), { ssr: false })

type Task = {
  id: string
  text: string
  deadline: Date | null
  estimatedMinutes: number | null
  priority: string
  category: string | null
  completed: boolean
  notes: string | null
  capability?: string | null
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  high:   { bg: "rgba(244, 63, 94, 0.12)",  text: "#fb7185", dot: "#f43f5e" },
  medium: { bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24", dot: "#f59e0b" },
  low:    { bg: "rgba(20, 184, 166, 0.12)", text: "#34d399", dot: "#10b981" },
}

function formatDeadline(date: Date | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function TaskCard({ task }: { task: Task }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const pConfig = priorityConfig[task.priority]

  async function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    })
    router.refresh()
    setLoading(false)
  }

  async function deleteTask(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this task?")) return
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
    router.refresh()
    setLoading(false)
  }

  function handleCardClick() {
    if (!loading) router.push(`/tasks/${task.id}/edit`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="card-hover flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        opacity: loading ? 0.5 : 1,
        transition: "opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        disabled={loading}
        className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={{
          background: task.completed ? "linear-gradient(135deg, #ea580c, #f97316)" : "transparent",
          borderColor: task.completed ? "#f97316" : "rgba(249, 115, 22, 0.25)",
          boxShadow: task.completed ? "0 0 10px rgba(249, 115, 22, 0.4)" : "none",
        }}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: task.completed ? "rgba(249, 115, 22, 0.3)" : "#431407",
            textDecoration: task.completed ? "line-through" : "none",
          }}
        >
          {task.text}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {task.priority && pConfig && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: pConfig.bg, color: pConfig.text }}
            >
              {task.priority}
            </span>
          )}
          {task.category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(249, 115, 22, 0.1)", color: "rgba(234, 88, 12, 0.7)" }}
            >
              {task.category}
            </span>
          )}
          {task.deadline && (
            <span className="text-xs flex items-center gap-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDeadline(task.deadline)}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="text-xs flex items-center gap-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~{task.estimatedMinutes}m
            </span>
          )}
          {task.capability && !task.completed && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAgent(true) }}
              className="text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-200"
              style={{
                background: "rgba(96, 165, 250, 0.12)",
                color: "#93c5fd",
                border: "1px solid rgba(96, 165, 250, 0.2)"
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96, 165, 250, 0.22)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96, 165, 250, 0.12)" }}
            >
              ✨ AI can help
            </button>
          )}
        </div>
        {task.notes && (
          <p className="text-xs mt-1.5 truncate italic" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
            {task.notes}
          </p>
        )}
      </div>

      {/* Edit icon hint */}
      <div className="shrink-0 mt-0.5 p-1" style={{ color: "rgba(249, 115, 22, 0.15)" }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>

      {/* Delete */}
      <button
        onClick={deleteTask}
        disabled={loading}
        className="shrink-0 mt-0.5 p-1 rounded-lg transition-all duration-200"
        style={{ color: "rgba(249, 115, 22, 0.2)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fb7185"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(244, 63, 94, 0.1)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(249, 115, 22, 0.2)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
        aria-label="Delete task"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {showAgent && task.capability && (
        <TaskAgentModal
          taskId={task.id}
          taskText={task.text}
          capability={task.capability as import("@/lib/classifier").Capability}
          onClose={() => setShowAgent(false)}
        />
      )}
    </div>
  )
}
