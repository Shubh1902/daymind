"use client"

import { useCallback, useEffect, useState } from "react"
import { speak, stopSpeaking, initVoices } from "@/lib/tts"
import type { WeeklyStats } from "@/app/actions/ai"

const priorityColors: Record<string, string> = {
  high: "#fb7185",
  medium: "#fbbf24",
  low: "#34d399",
}

export default function WeeklyDigest({ stats }: { stats: WeeklyStats }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    initVoices()
    return () => stopSpeaking()
  }, [])

  const readAloud = useCallback(() => {
    if (playing) {
      stopSpeaking()
      setPlaying(false)
      return
    }
    setPlaying(true)
    const text = `Weekly digest. You completed ${stats.completedCount} tasks this week with a ${stats.completionRate}% completion rate. ${stats.totalFocusMinutes} minutes of total focus time. ${stats.insight}`
    speak(text).then(() => setPlaying(false))
  }, [playing, stats])

  const maxCatMinutes = Math.max(...stats.byCategory.map((c) => c.minutes), 1)

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up">
        <StatCard label="Completed" value={String(stats.completedCount)} sub={`of ${stats.createdCount} created`} />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} sub="this week" />
        <StatCard
          label="Focus Time"
          value={stats.totalFocusMinutes >= 60 ? `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m` : `${stats.totalFocusMinutes}m`}
          sub="total tracked"
        />
        <StatCard
          label="Estimate Accuracy"
          value={stats.avgAccuracy ? `${stats.avgAccuracy}%` : "—"}
          sub={stats.avgAccuracy ? "est vs actual" : "not enough data"}
        />
      </div>

      {/* AI Insight */}
      {stats.insight && (
        <div
          className="rounded-2xl p-4 animate-slide-up delay-100"
          style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.05))",
            border: "1px solid rgba(249, 115, 22, 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: "rgba(249, 115, 22, 0.2)" }}
            >
              <svg className="w-3 h-3" style={{ color: "#fb923c" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: "#fb923c" }}>
              AI Insight
            </p>
            <button
              onClick={readAloud}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: playing ? "rgba(244, 63, 94, 0.15)" : "rgba(249, 115, 22, 0.12)",
                border: playing ? "1px solid rgba(244, 63, 94, 0.3)" : "1px solid rgba(249, 115, 22, 0.2)",
                color: playing ? "#fb7185" : "#fb923c",
              }}
            >
              {playing ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  Read aloud
                </>
              )}
            </button>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#431407" }}>
            {stats.insight}
          </p>
        </div>
      )}

      {/* Category breakdown */}
      {stats.byCategory.length > 0 && (
        <div className="animate-slide-up delay-150">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            By Category
          </h3>
          <div className="flex flex-col gap-2.5">
            {stats.byCategory.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium" style={{ color: "#431407" }}>
                    {cat.category}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                    {cat.count} tasks &middot; {cat.minutes}m
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, (cat.minutes / maxCatMinutes) * 100)}%`,
                      background: "linear-gradient(90deg, #ea580c, #f97316)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority breakdown */}
      {stats.byPriority.length > 0 && (
        <div className="animate-slide-up delay-200">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            By Priority
          </h3>
          <div className="flex gap-3">
            {stats.byPriority.map((p) => (
              <div
                key={p.priority}
                className="flex-1 rounded-xl p-3 text-center"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <p className="text-xl font-bold" style={{ color: priorityColors[p.priority] ?? "#fb923c" }}>
                  {p.count}
                </p>
                <p className="text-xs capitalize" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                  {p.priority}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most deferred */}
      {stats.mostDeferred.length > 0 && (
        <div className="animate-slide-up delay-300">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            Most Deferred
          </h3>
          <div className="flex flex-col gap-2">
            {stats.mostDeferred.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
                  style={{
                    background: "rgba(244, 63, 94, 0.1)",
                    color: "#fb7185",
                  }}
                >
                  {t.deferCount}x
                </span>
                <span className="text-sm truncate" style={{ color: "#431407" }}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: "#ea580c" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
        {sub}
      </p>
    </div>
  )
}
