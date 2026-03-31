"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { speak, stopSpeaking, initVoices } from "@/lib/tts"
import VoiceOrb from "./VoiceOrb"

type Task = {
  id: string
  text: string
  estimatedMinutes: number | null
}

type TimerState = "running" | "paused" | "completed" | "prompting"

function parseTimerResponse(transcript: string): "done" | "more" | "skip" | null {
  const t = transcript.toLowerCase().trim()
  if (/\b(done|finished|completed|yes|yep)\b/.test(t)) return "done"
  if (/\b(more|continue|again|restart|extend)\b/.test(t)) return "more"
  if (/\b(skip|pass|next|stop|no)\b/.test(t)) return "skip"
  return null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const CIRCLE_RADIUS = 110
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export default function FocusTimer({
  task,
  onDone,
  onMoreTime,
  onSkip,
  onCancel,
}: {
  task: Task
  onDone: (actualMinutes: number) => void
  onMoreTime: () => void
  onSkip: () => void
  onCancel: () => void
}) {
  const duration = (task.estimatedMinutes ?? 25) * 60
  const [remaining, setRemaining] = useState(duration)
  const [timerState, setTimerState] = useState<TimerState>("running")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(Date.now())
  const pausedTotalRef = useRef(0)
  const pauseStartRef = useRef<number | null>(null)

  function getElapsedMinutes() {
    let paused = pausedTotalRef.current
    if (pauseStartRef.current) paused += Date.now() - pauseStartRef.current
    return Math.max(1, Math.round((Date.now() - startedAtRef.current - paused) / 60000))
  }

  useEffect(() => {
    initVoices()
    const handleVoices = () => window.speechSynthesis?.getVoices()
    window.speechSynthesis?.addEventListener("voiceschanged", handleVoices)
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", handleVoices)
      stopSpeaking()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Timer tick
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState])

  const handleTimerComplete = useCallback(() => {
    // Vibrate
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])

    setTimerState("prompting")
    speak(`Time's up on "${task.text}". How did it go? Say done, more time, or skip.`)
  }, [task.text])

  function handleVoiceTranscript(transcript: string) {
    if (timerState !== "prompting") return
    const action = parseTimerResponse(transcript)
    if (action === "done") {
      onDone(getElapsedMinutes())
    } else if (action === "more") {
      onMoreTime()
    } else if (action === "skip") {
      onSkip()
    } else {
      speak("Say done, more time, or skip.")
    }
  }

  function togglePause() {
    setTimerState((prev) => {
      if (prev === "running") {
        pauseStartRef.current = Date.now()
        return "paused"
      } else {
        if (pauseStartRef.current) {
          pausedTotalRef.current += Date.now() - pauseStartRef.current
          pauseStartRef.current = null
        }
        return "running"
      }
    })
  }

  const progress = remaining / duration
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress)

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center animate-overlay-in"
      style={{
        background: "rgba(255, 247, 237, 0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Cancel button */}
      <button
        onClick={() => { stopSpeaking(); onCancel() }}
        className="absolute top-0 left-5 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ top: "max(env(safe-area-inset-top), 16px)", background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.12)" }}
        aria-label="Cancel timer"
      >
        <svg className="w-5 h-5" style={{ color: "rgba(234, 88, 12, 0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center mb-8">
        <svg width="260" height="260" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="130"
            cy="130"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="rgba(249, 115, 22, 0.08)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="130"
            cy="130"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke={timerState === "prompting" ? "#fb923c" : timerState === "paused" ? "#fbbf24" : "url(#timerGradient)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="text-5xl font-bold tabular-nums"
            style={{ color: timerState === "prompting" ? "#f97316" : "#431407" }}
          >
            {formatTime(remaining)}
          </p>
          {timerState === "paused" && (
            <p className="text-xs mt-1 animate-fade-in" style={{ color: "#fbbf24" }}>Paused</p>
          )}
          {timerState === "prompting" && (
            <p className="text-xs mt-1 animate-fade-in" style={{ color: "#f97316" }}>Time&apos;s up!</p>
          )}
        </div>
      </div>

      {/* Task name */}
      <p className="text-lg font-semibold text-center px-8 mb-8" style={{ color: "#431407" }}>
        {task.text}
      </p>

      {/* Controls */}
      {(timerState === "running" || timerState === "paused") && (
        <div className="flex gap-4">
          <button
            onClick={togglePause}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: timerState === "paused"
                ? "linear-gradient(135deg, #ea580c, #f97316)"
                : "rgba(249, 115, 22, 0.1)",
              border: "1px solid rgba(249, 115, 22, 0.25)",
              boxShadow: timerState === "paused" ? "0 0 20px rgba(249, 115, 22, 0.35)" : "none",
            }}
            aria-label={timerState === "paused" ? "Resume" : "Pause"}
          >
            {timerState === "paused" ? (
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" style={{ color: "#ea580c" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Voice prompt after timer completes */}
      {timerState === "prompting" && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <VoiceOrb onTranscript={handleVoiceTranscript} />

          {/* Manual fallback buttons */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => onDone(getElapsedMinutes())}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                boxShadow: "0 4px 16px rgba(249, 115, 22, 0.3)",
              }}
            >
              Done
            </button>
            <button
              onClick={onMoreTime}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              More time
            </button>
            <button
              onClick={onSkip}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "rgba(249, 115, 22, 0.4)", border: "1px solid rgba(249, 115, 22, 0.15)" }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
