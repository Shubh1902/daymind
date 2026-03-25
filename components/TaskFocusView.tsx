"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import FocusTimer from "./FocusTimer"

type Task = {
  id: string
  text: string
  deadline: Date | null
  priority: string
  estimatedMinutes: number | null
  category: string | null
  notes: string | null
  completed: boolean
  deferCount: number
}

const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 }
const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high:   { label: "High",   bg: "rgba(244, 63, 94, 0.12)",  text: "#fb7185" },
  medium: { label: "Medium", bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24" },
  low:    { label: "Low",    bg: "rgba(20, 184, 166, 0.12)", text: "#34d399" },
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const pa = priorityScore[a.priority] ?? 0
      const pb = priorityScore[b.priority] ?? 0
      if (pb !== pa) return pb - pa
      if (a.deadline && b.deadline)
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return 0
    })
    .slice(0, 8)
}

export default function TaskFocusView({
  tasks,
  onClose,
}: {
  tasks: Task[]
  onClose: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [localTasks, setLocalTasks] = useState(() => sortTasks(tasks))
  const [activeIndex, setActiveIndex] = useState(0)
  const [completing, setCompleting] = useState<string | null>(null)
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setLocalTasks(sortTasks(tasks))
  }, [tasks])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || localTasks.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (idx !== -1) setActiveIndex(idx)
          }
        }
      },
      { root: container, threshold: 0.6 }
    )

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [localTasks])

  const scrollToIndex = useCallback((idx: number) => {
    const el = cardRefs.current[idx]
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [])

  async function handleDone(taskId?: string, actualMinutes?: number) {
    const id = taskId ?? localTasks[activeIndex]?.id
    const task = localTasks.find((t) => t.id === id)
    if (!task || completing) return
    setCompleting(task.id)
    setTimerTaskId(null)

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, ...(actualMinutes && { actualMinutes }) }),
      })

      const next = localTasks.filter((t) => t.id !== task.id)
      setLocalTasks(next)

      if (next.length === 0) {
        setTimeout(() => router.refresh(), 300)
      } else {
        const newIdx = Math.min(activeIndex, next.length - 1)
        setActiveIndex(newIdx)
        requestAnimationFrame(() => scrollToIndex(newIdx))
        router.refresh()
      }
    } finally {
      setCompleting(null)
    }
  }

  function handlePass() {
    if (localTasks.length === 0) return
    const nextIdx = activeIndex < localTasks.length - 1 ? activeIndex + 1 : 0
    scrollToIndex(nextIdx)
  }

  function handleGoDeeper() {
    const task = localTasks[activeIndex]
    if (!task) return
    router.push(`/tasks/${task.id}/edit`)
  }

  function handleStartTimer(taskId: string) {
    setTimerTaskId(taskId)
  }

  function handleTimerMoreTime() {
    // Restart timer on same task (component remounts with new key)
    const id = timerTaskId
    setTimerTaskId(null)
    requestAnimationFrame(() => setTimerTaskId(id))
  }

  function handleTimerSkip() {
    setTimerTaskId(null)
    handlePass()
  }

  if (!mounted) return null

  const timerTask = timerTaskId ? localTasks.find((t) => t.id === timerTaskId) : null

  const overlayContent = (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-overlay-in"
      style={{
        background: "rgba(6, 13, 18, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.12)" }}
          aria-label="Close focus mode"
        >
          <svg className="w-5 h-5" style={{ color: "rgba(52, 211, 153, 0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {localTasks.length > 0 && (
          <div className="flex items-center gap-1.5">
            {localTasks.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeIndex ? 20 : 6,
                  height: 6,
                  background: i === activeIndex
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : i < activeIndex
                    ? "rgba(16, 185, 129, 0.35)"
                    : "rgba(16, 185, 129, 0.1)",
                  boxShadow: i === activeIndex ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none",
                }}
              />
            ))}
          </div>
        )}

        <span className="text-xs font-medium" style={{ color: "rgba(16, 185, 129, 0.4)", minWidth: 40, textAlign: "right" }}>
          {localTasks.length > 0 ? `${activeIndex + 1}/${localTasks.length}` : ""}
        </span>
      </div>

      {/* Empty state */}
      {localTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 animate-float"
            style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}
          >
            <svg className="w-10 h-10" style={{ color: "#34d399" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold" style={{ color: "rgba(52, 211, 153, 0.7)" }}>All caught up!</p>
          <p className="text-sm mt-2" style={{ color: "rgba(16, 185, 129, 0.4)" }}>No open tasks to focus on</p>
          <button
            onClick={onClose}
            className="mt-8 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}
          >
            Back to schedule
          </button>
        </div>
      ) : (
        <>
          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 py-6 gap-4 items-center"
            style={{ scrollPaddingInline: "16px" }}
          >
            {localTasks.map((task, i) => {
              const pConfig = priorityConfig[task.priority]
              const isCompleting = completing === task.id
              return (
                <div
                  key={task.id}
                  ref={(el) => { cardRefs.current[i] = el }}
                  className="snap-center shrink-0 flex flex-col rounded-3xl p-7"
                  style={{
                    width: "calc(100vw - 48px)",
                    maxWidth: 380,
                    minHeight: 360,
                    background: "linear-gradient(155deg, var(--surface-3), var(--surface-2))",
                    border: "1px solid rgba(16, 185, 129, 0.18)",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.06)",
                    opacity: isCompleting ? 0.4 : 1,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {/* Priority + category */}
                  <div className="flex items-center gap-2 mb-5">
                    {pConfig && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: pConfig.bg, color: pConfig.text }}
                      >
                        {pConfig.label}
                      </span>
                    )}
                    {task.category && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(16, 185, 129, 0.08)", color: "rgba(52, 211, 153, 0.7)" }}
                      >
                        {task.category}
                      </span>
                    )}
                  </div>

                  {/* Task text */}
                  <h2
                    className="text-2xl font-bold leading-snug flex-1"
                    style={{ color: "rgba(236, 253, 245, 0.95)" }}
                  >
                    {task.text}
                  </h2>

                  {/* Meta info */}
                  <div
                    className="flex flex-col gap-2 mt-5 pt-4"
                    style={{ borderTop: "1px solid rgba(16, 185, 129, 0.1)" }}
                  >
                    {task.deadline && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(52, 211, 153, 0.6)" }}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Due {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    )}
                    {task.estimatedMinutes && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(52, 211, 153, 0.6)" }}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>~{task.estimatedMinutes} min</span>
                      </div>
                    )}
                    {task.notes && (
                      <p className="text-sm italic line-clamp-2" style={{ color: "rgba(16, 185, 129, 0.4)" }}>
                        {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Action links */}
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => handleStartTimer(task.id)}
                      className="flex items-center gap-2 text-sm font-medium transition-opacity duration-200"
                      style={{ color: "#6ee7b7" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Timer
                    </button>
                    <button
                      onClick={handleGoDeeper}
                      className="flex items-center gap-2 text-sm font-medium transition-opacity duration-200"
                      style={{ color: "rgba(52, 211, 153, 0.6)" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Go Deeper
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div
            className="flex flex-col gap-3 px-6 pb-safe"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            <button
              onClick={() => handleDone()}
              disabled={completing !== null}
              className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 4px 24px rgba(16, 185, 129, 0.35)",
              }}
            >
              {completing ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </>
              )}
            </button>

            <button
              onClick={handlePass}
              disabled={completing !== null}
              className="w-full py-3 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-40"
              style={{
                background: "transparent",
                color: "rgba(52, 211, 153, 0.7)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              Pass
            </button>
          </div>
        </>
      )}

      {/* Focus Timer overlay — renders on top of focus view */}
      {timerTask && (
        <FocusTimer
          key={timerTaskId}
          task={timerTask}
          onDone={(mins) => handleDone(timerTask.id, mins)}
          onMoreTime={handleTimerMoreTime}
          onSkip={handleTimerSkip}
          onCancel={() => setTimerTaskId(null)}
        />
      )}
    </div>
  )

  return createPortal(overlayContent, document.body)
}
