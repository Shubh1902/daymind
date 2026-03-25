"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { speak, stopSpeaking, initVoices } from "@/lib/tts"
import VoiceOrb from "./VoiceOrb"

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

type Step = "intro" | "reviewing" | "summary" | "done"
type TaskOutcome = "done" | "defer" | "drop"

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high:   { label: "High",   bg: "rgba(244, 63, 94, 0.12)",  text: "#fb7185" },
  medium: { label: "Medium", bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24" },
  low:    { label: "Low",    bg: "rgba(20, 184, 166, 0.12)", text: "#34d399" },
}

function parseOutcome(transcript: string): TaskOutcome | null {
  const t = transcript.toLowerCase().trim()
  if (/\b(done|finished|completed|yes|yep|yeah|did it)\b/.test(t)) return "done"
  if (/\b(carry over|tomorrow|defer|not yet|later|push|postpone|nope|no)\b/.test(t)) return "defer"
  if (/\b(drop|remove|skip|delete|forget|cancel)\b/.test(t)) return "drop"
  return null
}

export default function EveningReview({
  tasks,
  onClose,
}: {
  tasks: Task[]
  onClose: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Map<string, TaskOutcome>>(new Map())
  const [processing, setProcessing] = useState(false)
  const [waitingForVoice, setWaitingForVoice] = useState(false)
  const isSpeakingRef = useRef(false)
  const openTasks = tasks.filter((t) => !t.completed)

  useEffect(() => {
    setMounted(true)
    initVoices()
    // wait for voices to load
    const handleVoices = () => window.speechSynthesis?.getVoices()
    window.speechSynthesis?.addEventListener("voiceschanged", handleVoices)
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", handleVoices)
      stopSpeaking()
    }
  }, [])

  // Drive the flow
  useEffect(() => {
    if (!mounted || isSpeakingRef.current) return

    if (step === "intro") {
      isSpeakingRef.current = true
      const count = openTasks.length
      const msg = count === 0
        ? "You have no open tasks. Looks like a clean day!"
        : `Let's review your day. You have ${count} open task${count > 1 ? "s" : ""}. I'll go through each one.`

      speak(msg).then(() => {
        isSpeakingRef.current = false
        if (count === 0) {
          setStep("done")
        } else {
          setStep("reviewing")
        }
      })
    }
  }, [step, mounted, openTasks.length])

  // Speak current task when reviewing
  useEffect(() => {
    if (step !== "reviewing" || isSpeakingRef.current || processing) return
    const task = openTasks[currentIndex]
    if (!task) {
      setStep("summary")
      return
    }

    isSpeakingRef.current = true
    setWaitingForVoice(false)
    speak(`How about "${task.text}"? Did you finish it?`).then(() => {
      isSpeakingRef.current = false
      setWaitingForVoice(true)
    })
  }, [step, currentIndex, openTasks, processing])

  // Speak summary
  useEffect(() => {
    if (step !== "summary" || isSpeakingRef.current) return
    isSpeakingRef.current = true

    const done = [...results.values()].filter((v) => v === "done").length
    const deferred = [...results.values()].filter((v) => v === "defer").length
    const dropped = [...results.values()].filter((v) => v === "drop").length

    const parts: string[] = []
    if (done > 0) parts.push(`completed ${done}`)
    if (deferred > 0) parts.push(`carrying over ${deferred}`)
    if (dropped > 0) parts.push(`dropped ${dropped}`)

    const msg = parts.length > 0
      ? `Nice work! You ${parts.join(", ")}. Rest up and come back strong tomorrow.`
      : "All reviewed. Have a good evening!"

    speak(msg).then(() => {
      isSpeakingRef.current = false
      setStep("done")
    })
  }, [step, results])

  const applyOutcome = useCallback(async (outcome: TaskOutcome) => {
    const task = openTasks[currentIndex]
    if (!task || processing) return

    setProcessing(true)
    setWaitingForVoice(false)

    try {
      if (outcome === "done") {
        await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        })
      } else if (outcome === "defer") {
        await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deferCount: task.deferCount + 1 }),
        })
      }
      // "drop" — we skip it without any DB change

      setResults((prev) => new Map(prev).set(task.id, outcome))

      const nextIndex = currentIndex + 1
      if (nextIndex >= openTasks.length) {
        setStep("summary")
      } else {
        setCurrentIndex(nextIndex)
      }
    } finally {
      setProcessing(false)
    }
  }, [currentIndex, openTasks, processing])

  function handleVoiceTranscript(transcript: string) {
    if (!waitingForVoice) return
    const outcome = parseOutcome(transcript)
    if (outcome) {
      applyOutcome(outcome)
    } else {
      // Didn't understand — repeat
      speak("Sorry, I didn't catch that. Say done, carry over, or drop.")
    }
  }

  function handleClose() {
    stopSpeaking()
    router.refresh()
    onClose()
  }

  if (!mounted) return null

  const currentTask = step === "reviewing" ? openTasks[currentIndex] : null
  const pConfig = currentTask ? priorityConfig[currentTask.priority] : null

  const doneCount = [...results.values()].filter((v) => v === "done").length
  const deferCount = [...results.values()].filter((v) => v === "defer").length
  const dropCount = [...results.values()].filter((v) => v === "drop").length

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-overlay-in"
      style={{
        background: "rgba(6, 13, 18, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.12)" }}
          aria-label="Close evening review"
        >
          <svg className="w-5 h-5" style={{ color: "rgba(52, 211, 153, 0.6)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress dots */}
        {step === "reviewing" && openTasks.length > 0 && (
          <div className="flex items-center gap-1.5">
            {openTasks.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 20 : 6,
                  height: 6,
                  background: i === currentIndex
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : i < currentIndex
                    ? "rgba(16, 185, 129, 0.35)"
                    : "rgba(16, 185, 129, 0.1)",
                  boxShadow: i === currentIndex ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none",
                }}
              />
            ))}
          </div>
        )}

        <span className="text-xs font-medium" style={{ color: "rgba(16, 185, 129, 0.4)", minWidth: 40, textAlign: "right" }}>
          {step === "reviewing" && openTasks.length > 0 ? `${currentIndex + 1}/${openTasks.length}` : ""}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Intro */}
        {step === "intro" && (
          <div className="text-center animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 mx-auto animate-float"
              style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}
            >
              <svg className="w-10 h-10" style={{ color: "#34d399" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <p className="text-2xl font-bold" style={{ color: "rgba(52, 211, 153, 0.7)" }}>Evening Review</p>
            <p className="text-sm mt-2" style={{ color: "rgba(16, 185, 129, 0.4)" }}>Getting ready...</p>
          </div>
        )}

        {/* Reviewing — current task card */}
        {step === "reviewing" && currentTask && (
          <div className="w-full max-w-sm animate-scale-in" key={currentTask.id}>
            <div
              className="rounded-3xl p-7"
              style={{
                background: "linear-gradient(155deg, var(--surface-3), var(--surface-2))",
                border: "1px solid rgba(16, 185, 129, 0.18)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.06)",
                opacity: processing ? 0.5 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {/* Priority */}
              <div className="flex items-center gap-2 mb-4">
                {pConfig && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: pConfig.bg, color: pConfig.text }}
                  >
                    {pConfig.label}
                  </span>
                )}
                {currentTask.category && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "rgba(16, 185, 129, 0.08)", color: "rgba(52, 211, 153, 0.7)" }}
                  >
                    {currentTask.category}
                  </span>
                )}
              </div>

              {/* Task text */}
              <h2
                className="text-xl font-bold leading-snug"
                style={{ color: "rgba(236, 253, 245, 0.95)" }}
              >
                {currentTask.text}
              </h2>

              {/* Hint */}
              {waitingForVoice && (
                <p className="text-xs mt-4 animate-fade-in" style={{ color: "rgba(16, 185, 129, 0.4)" }}>
                  Say &quot;done&quot;, &quot;carry over&quot;, or &quot;drop&quot;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {(step === "summary" || step === "done") && (
          <div className="text-center animate-fade-in w-full max-w-sm">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 mx-auto"
              style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}
            >
              <svg className="w-10 h-10" style={{ color: "#34d399" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold mb-4" style={{ color: "rgba(52, 211, 153, 0.7)" }}>Day Reviewed</p>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-6">
              {doneCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#34d399" }}>{doneCount}</p>
                  <p className="text-xs" style={{ color: "rgba(16, 185, 129, 0.5)" }}>Completed</p>
                </div>
              )}
              {deferCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#fbbf24" }}>{deferCount}</p>
                  <p className="text-xs" style={{ color: "rgba(16, 185, 129, 0.5)" }}>Carried over</p>
                </div>
              )}
              {dropCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "rgba(16, 185, 129, 0.4)" }}>{dropCount}</p>
                  <p className="text-xs" style={{ color: "rgba(16, 185, 129, 0.5)" }}>Dropped</p>
                </div>
              )}
            </div>

            {step === "done" && (
              <button
                onClick={handleClose}
                className="px-8 py-3.5 rounded-2xl text-base font-bold text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  boxShadow: "0 4px 24px rgba(16, 185, 129, 0.35)",
                }}
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom area — voice orb + manual buttons */}
      {step === "reviewing" && (
        <div
          className="flex flex-col items-center gap-4 px-6 pb-safe"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
        >
          {/* Voice orb */}
          {waitingForVoice && (
            <div className="animate-fade-in">
              <VoiceOrb onTranscript={handleVoiceTranscript} disabled={processing} />
            </div>
          )}

          {/* Manual fallback buttons */}
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => applyOutcome("done")}
              disabled={processing || !waitingForVoice}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
              }}
            >
              Done
            </button>
            <button
              onClick={() => applyOutcome("defer")}
              disabled={processing || !waitingForVoice}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{
                background: "transparent",
                color: "#fbbf24",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            >
              Carry Over
            </button>
            <button
              onClick={() => applyOutcome("drop")}
              disabled={processing || !waitingForVoice}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{
                background: "transparent",
                color: "rgba(16, 185, 129, 0.4)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
              }}
            >
              Drop
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(overlay, document.body)
}
