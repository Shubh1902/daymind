"use client"

import { useState, useRef } from "react"

type Task = {
  id: string
  text: string
  deadline: Date | null
  priority: string
  estimatedMinutes: number | null
  category: string | null
  notes: string | null
  completed: boolean
}

const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 }
const priorityConfig: Record<string, { label: string; bg: string; text: string; glow: string }> = {
  high:   { label: "High Priority",   bg: "rgba(244, 63, 94, 0.12)",  text: "#fb7185", glow: "rgba(244, 63, 94, 0.3)" },
  medium: { label: "Medium Priority", bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24", glow: "rgba(245, 158, 11, 0.3)" },
  low:    { label: "Low Priority",    bg: "rgba(20, 184, 166, 0.12)", text: "#34d399", glow: "rgba(20, 184, 166, 0.3)" },
}

function getTopTasks(tasks: Task[]): Task[] {
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
    .slice(0, 5)
}

export default function TaskFocusView({ tasks }: { tasks: Task[] }) {
  const topTasks = getTopTasks(tasks)
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null)
  const startXRef = useRef(0)

  if (topTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float"
          style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
        >
          <svg className="w-8 h-8" style={{ color: "rgba(139, 92, 246, 0.4)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold" style={{ color: "rgba(167, 139, 250, 0.5)" }}>All caught up!</p>
        <p className="text-sm mt-1" style={{ color: "rgba(139, 92, 246, 0.3)" }}>No open tasks to focus on</p>
      </div>
    )
  }

  const task = topTasks[index]
  const pConfig = priorityConfig[task.priority]

  function navigate(dir: "left" | "right") {
    if (dir === "left" && index >= topTasks.length - 1) return
    if (dir === "right" && index <= 0) return
    setAnimDir(dir)
    setDragX(0)
    setTimeout(() => {
      setIndex((i) => (dir === "left" ? i + 1 : i - 1))
      setAnimDir(null)
    }, 280)
  }

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }
  function onTouchMove(e: React.TouchEvent) {
    setDragX(e.touches[0].clientX - startXRef.current)
  }
  function onTouchEnd() {
    setIsDragging(false)
    if (dragX < -80) navigate("left")
    else if (dragX > 80) navigate("right")
    else setDragX(0)
  }

  function onMouseDown(e: React.MouseEvent) {
    startXRef.current = e.clientX
    setIsDragging(true)
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    setDragX(e.clientX - startXRef.current)
  }
  function onMouseUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX < -80) navigate("left")
    else if (dragX > 80) navigate("right")
    else setDragX(0)
  }

  const translateX = animDir === "left" ? -500 : animDir === "right" ? 500 : dragX
  const rotation = dragX * 0.04
  const flyingOut = animDir !== null

  return (
    <div className="flex flex-col items-center gap-8 pt-2 pb-4 select-none">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {topTasks.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              background: i === index
                ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                : i < index
                ? "rgba(139, 92, 246, 0.35)"
                : "rgba(139, 92, 246, 0.1)",
              boxShadow: i === index ? "0 0 10px rgba(168, 85, 247, 0.5)" : "none",
            }}
          />
        ))}
      </div>

      {/* Card stack */}
      <div
        className="relative w-full max-w-sm"
        style={{ height: 400 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Background peek cards */}
        {index < topTasks.length - 1 && (
          <div
            className="absolute inset-x-6 top-4 bottom-0 rounded-3xl"
            style={{ background: "var(--surface-3)", border: "1px solid rgba(139, 92, 246, 0.1)" }}
          />
        )}
        {index < topTasks.length - 2 && (
          <div
            className="absolute inset-x-10 top-8 bottom-0 rounded-3xl"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(139, 92, 246, 0.06)" }}
          />
        )}

        {/* Main card */}
        <div
          className="absolute inset-0 rounded-3xl p-8 flex flex-col cursor-grab active:cursor-grabbing"
          style={{
            background: "linear-gradient(145deg, var(--surface-3), var(--surface-2))",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.08)",
            transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
            opacity: flyingOut ? 0 : 1,
            transition: isDragging ? "none" : "transform 0.28s ease, opacity 0.28s ease",
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-2 mb-auto">
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
                style={{ background: "rgba(139, 92, 246, 0.1)", color: "rgba(167, 139, 250, 0.7)" }}
              >
                {task.category}
              </span>
            )}
            <span
              className="ml-auto text-xs font-medium"
              style={{ color: "rgba(139, 92, 246, 0.35)" }}
            >
              {index + 1} / {topTasks.length}
            </span>
          </div>

          {/* Task text */}
          <h2
            className="text-2xl font-bold leading-snug mt-6 flex-1"
            style={{ color: "rgba(240, 238, 255, 0.95)" }}
          >
            {task.text}
          </h2>

          {/* Meta */}
          <div
            className="flex flex-col gap-2 mt-6 pt-5"
            style={{ borderTop: "1px solid rgba(139, 92, 246, 0.12)" }}
          >
            {task.deadline && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(167, 139, 250, 0.6)" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  Due{" "}
                  {new Date(task.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {task.estimatedMinutes && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(167, 139, 250, 0.6)" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>~{task.estimatedMinutes} min</span>
              </div>
            )}
            {task.notes && (
              <p className="text-sm italic line-clamp-2" style={{ color: "rgba(139, 92, 246, 0.45)" }}>
                {task.notes}
              </p>
            )}
          </div>

          {/* Swipe overlays */}
          {dragX > 40 && (
            <div
              className="absolute top-8 left-8 rounded-xl px-3 py-1"
              style={{
                border: "2px solid #34d399",
                transform: "rotate(-12deg)",
                opacity: Math.min(dragX / 120, 1),
              }}
            >
              <span className="font-bold text-sm tracking-wide" style={{ color: "#34d399" }}>PREV</span>
            </div>
          )}
          {dragX < -40 && (
            <div
              className="absolute top-8 right-8 rounded-xl px-3 py-1"
              style={{
                border: "2px solid #fb7185",
                transform: "rotate(12deg)",
                opacity: Math.min(-dragX / 120, 1),
              }}
            >
              <span className="font-bold text-sm tracking-wide" style={{ color: "#fb7185" }}>NEXT</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("right")}
          disabled={index === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "rgba(167, 139, 250, 0.6)",
          }}
          aria-label="Previous task"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs" style={{ color: "rgba(139, 92, 246, 0.3)" }}>swipe or tap arrows</span>
        <button
          onClick={() => navigate("left")}
          disabled={index === topTasks.length - 1}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "rgba(167, 139, 250, 0.6)",
          }}
          aria-label="Next task"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
