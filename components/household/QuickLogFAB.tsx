"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CHORE_CATEGORIES, getChoreDefaults } from "@/lib/household-chores"

type Member = { id: string; name: string; slug: string; color: string }

// Inline voice recognition types (matching VoiceButton)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface ISpeechRecognition extends EventTarget {
  lang: string; interimResults: boolean; continuous: boolean
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}

function getSR(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

type VoiceFABState = "idle" | "listening" | "parsing" | "confirm" | "saving" | "done" | "error"

export default function QuickLogFAB() {
  const router = useRouter()
  const [state, setState] = useState<VoiceFABState>("idle")
  const [members, setMembers] = useState<Member[]>([])
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState<{
    memberSlug: string; choreType: string; durationMinutes: number | null
    description: string | null; completedAt: string | null
  } | null>(null)
  const [error, setError] = useState("")

  const fetchMembers = useCallback(async () => {
    if (members.length > 0) return members
    const res = await fetch("/api/household/members")
    const data = await res.json()
    setMembers(data)
    return data as Member[]
  }, [members])

  function startListening() {
    const SR = getSR()
    if (!SR) {
      // No speech recognition — navigate to log page as fallback
      router.push("/household/log")
      return
    }

    setState("listening")
    setTranscript("")
    setParsed(null)
    setError("")

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true

    let finalTranscript = ""
    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    const startedAt = Date.now()
    const MIN_LISTEN = 10000
    const SILENCE = 3000

    recognition.onresult = (event) => {
      if (silenceTimer) clearTimeout(silenceTimer)
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalTranscript += r[0].transcript
        else interim += r[0].transcript
      }
      setTranscript((finalTranscript + " " + interim).trim())

      const elapsed = Date.now() - startedAt
      const delay = elapsed < MIN_LISTEN ? Math.max(SILENCE, MIN_LISTEN - elapsed) : SILENCE

      silenceTimer = setTimeout(() => {
        const text = (finalTranscript + " " + interim).trim()
        recognition.stop()
        if (text) handleParse(text)
        else setState("idle")
      }, delay)
    }

    recognition.onerror = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      setState("idle")
    }

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
    }

    recognition.start()
  }

  async function handleParse(text: string) {
    setState("parsing")
    try {
      const mems = await fetchMembers()
      const res = await fetch("/api/household/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, members: mems }),
      })
      const data = await res.json()
      if (data.action === "chore_logged" && data.chore) {
        setParsed(data.chore)
        setState("confirm")
      } else {
        setError(data.message ?? "Couldn't understand that.")
        setState("error")
      }
    } catch {
      setError("Something went wrong.")
      setState("error")
    }
  }

  async function handleConfirm() {
    if (!parsed) return
    setState("saving")
    try {
      const mems = await fetchMembers()
      const member = mems.find((m: Member) => m.slug === parsed.memberSlug)
      if (!member) throw new Error("Member not found")
      const defaults = getChoreDefaults(parsed.choreType)
      const res = await fetch("/api/household/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreType: parsed.choreType,
          memberId: member.id,
          durationMinutes: parsed.durationMinutes ?? defaults.defaultMinutes,
          description: parsed.description,
          completedAt: parsed.completedAt,
          source: "voice",
        }),
      })
      if (res.ok) {
        setState("done")
        setTimeout(() => { setState("idle"); router.refresh() }, 1200)
      }
    } catch {
      setError("Failed to save.")
      setState("error")
    }
  }

  function reset() {
    setState("idle")
    setTranscript("")
    setParsed(null)
    setError("")
  }

  const choreInfo = CHORE_CATEGORIES.find((c) => c.id === parsed?.choreType)
  const parsedMemberInfo = members.find((m) => m.slug === parsed?.memberSlug)

  // ── Overlay states ──
  if (state !== "idle") {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={state === "listening" ? undefined : reset}
        >
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />

          {/* Bottom sheet */}
          <div
            className="relative w-full max-w-lg rounded-t-3xl px-6 pt-6 pb-8 animate-slide-up"
            style={{ background: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full" style={{ background: "#d4d4d8" }} />
            </div>

            {/* ── Listening ── */}
            {state === "listening" && (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 w-24 h-24 rounded-full animate-ping opacity-20" style={{ background: "#f97316" }} />
                  <div className="absolute inset-0 w-24 h-24 rounded-full animate-pulse opacity-10" style={{ background: "#f97316", animationDelay: "0.5s" }} />
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}
                    onClick={() => setState("idle")}
                  >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-lg font-bold mb-1" style={{ color: "#1f2937" }}>Listening...</p>
                <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                  {transcript || "Say something like \"I did laundry for 30 minutes\""}
                </p>
                {transcript && (
                  <div className="w-full px-4 py-3 rounded-xl text-sm text-left" style={{ background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" }}>
                    "{transcript}"
                  </div>
                )}
              </div>
            )}

            {/* ── Parsing ── */}
            {state === "parsing" && (
              <div className="flex flex-col items-center text-center py-4">
                <span className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Understanding "{transcript}"...</p>
              </div>
            )}

            {/* ── Confirm ── */}
            {state === "confirm" && parsed && (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Got it! Confirm to log:</p>
                <div className="flex items-center gap-4 py-3 px-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                    style={{ background: parsedMemberInfo?.color ?? "#6b7280" }}
                  >
                    {parsedMemberInfo?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg" style={{ color: "#1f2937" }}>
                      {choreInfo?.emoji} {choreInfo?.label ?? parsed.choreType}
                    </p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      {parsedMemberInfo?.name ?? parsed.memberSlug} &bull; {parsed.durationMinutes ?? choreInfo?.defaultMinutes ?? 20}m
                      {parsed.completedAt && ` &bull; ${new Date(parsed.completedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Log It
                  </button>
                </div>
              </div>
            )}

            {/* ── Saving ── */}
            {state === "saving" && (
              <div className="flex flex-col items-center text-center py-4">
                <span className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Saving...</p>
              </div>
            )}

            {/* ── Done ── */}
            {state === "done" && (
              <div className="flex flex-col items-center text-center py-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: "#ecfdf5", border: "2px solid #10b981" }}>
                  <svg className="w-8 h-8" style={{ color: "#10b981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold" style={{ color: "#1f2937" }}>Logged!</p>
              </div>
            )}

            {/* ── Error ── */}
            {state === "error" && (
              <div className="flex flex-col items-center text-center py-4">
                <span className="text-3xl mb-3">🤔</span>
                <p className="text-sm mb-4" style={{ color: "#dc2626" }}>{error}</p>
                <div className="flex gap-2 w-full">
                  <button onClick={reset} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
                    Close
                  </button>
                  <button onClick={startListening} className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold">
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Idle: Large mic FAB ──
  return (
    <button
      onClick={startListening}
      className="fixed bottom-20 right-4 z-40 w-16 h-16 rounded-full flex items-center justify-center animate-scale-in"
      style={{
        background: "linear-gradient(135deg, #ea580c, #f97316)",
        boxShadow: "0 4px 20px rgba(249, 115, 22, 0.45), 0 0 40px rgba(249, 115, 22, 0.15)",
      }}
      aria-label="Voice log a chore"
    >
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    </button>
  )
}
