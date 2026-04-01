"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CHORE_CATEGORIES, getChoreDefaults } from "@/lib/household-chores"
import VoiceButton from "@/components/VoiceButton"

type Member = { id: string; name: string; slug: string; color: string }

const DURATION_CHIPS = [10, 15, 20, 30, 45, 60, 90]
const WHEN_OPTIONS = [
  { id: "now", label: "Just now" },
  { id: "earlier", label: "Earlier" },
  { id: "yesterday", label: "Yesterday" },
]

export default function HouseholdLogForm() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [mode, setMode] = useState<"tap" | "voice">("voice")

  // Quick Tap state
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedChore, setSelectedChore] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState(false)
  const [when, setWhen] = useState("now")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Voice state
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [voiceParsing, setVoiceParsing] = useState(false)
  const [voiceParsed, setVoiceParsed] = useState<{
    memberSlug: string; choreType: string; durationMinutes: number | null; description: string | null; completedAt: string | null
  } | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/household/members").then((r) => r.json()).then(setMembers).catch(() => {})
  }, [])

  // Auto-set duration when chore changes
  useEffect(() => {
    if (selectedChore && !customDuration) {
      setDuration(getChoreDefaults(selectedChore).defaultMinutes)
    }
  }, [selectedChore, customDuration])

  function getCompletedAt(): string | undefined {
    if (when === "yesterday") {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      d.setHours(12, 0, 0, 0)
      return d.toISOString()
    }
    if (when === "earlier") {
      const d = new Date()
      d.setHours(d.getHours() - 3)
      return d.toISOString()
    }
    return undefined
  }

  async function handleSubmit() {
    if (!selectedMember || !selectedChore || !duration) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/household/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreType: selectedChore,
          memberId: selectedMember,
          durationMinutes: duration,
          description: notes.trim() || undefined,
          completedAt: getCompletedAt(),
          source: "form",
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/household"), 800)
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  async function handleVoiceParse(text: string) {
    setVoiceText(text)
    setVoiceParsing(true)
    setVoiceError(null)
    setVoiceParsed(null)
    try {
      const res = await fetch("/api/household/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, members }),
      })
      const data = await res.json()
      if (data.action === "chore_logged" && data.chore) {
        setVoiceParsed(data.chore)
      } else {
        setVoiceError(data.message ?? "Couldn't understand that. Try again.")
      }
    } catch {
      setVoiceError("Something went wrong. Please try again.")
    }
    setVoiceParsing(false)
  }

  async function handleVoiceConfirm() {
    if (!voiceParsed) return
    const member = members.find((m) => m.slug === voiceParsed.memberSlug)
    if (!member) return
    setSubmitting(true)
    try {
      const defaults = getChoreDefaults(voiceParsed.choreType)
      const res = await fetch("/api/household/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreType: voiceParsed.choreType,
          memberId: member.id,
          durationMinutes: voiceParsed.durationMinutes ?? defaults.defaultMinutes,
          description: voiceParsed.description,
          completedAt: voiceParsed.completedAt,
          source: "voice",
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/household"), 800)
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#ecfdf5", border: "2px solid #10b981" }}>
          <svg className="w-8 h-8" style={{ color: "#10b981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-bold" style={{ color: "#1f2937" }}>Logged!</p>
        <p className="text-sm" style={{ color: "#6b7280" }}>Redirecting to dashboard...</p>
      </div>
    )
  }

  const choreEmoji = CHORE_CATEGORIES.find((c) => c.id === voiceParsed?.choreType)?.emoji ?? "\u2728"
  const parsedMember = members.find((m) => m.slug === voiceParsed?.memberSlug)

  return (
    <div className="space-y-5">
      {/* Mode Toggle — Voice first */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: "#f3f4f6" }}>
        <button
          onClick={() => setMode("voice")}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{
            background: mode === "voice" ? "#ffffff" : "transparent",
            color: mode === "voice" ? "#1f2937" : "#9ca3af",
            boxShadow: mode === "voice" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>🎙️</span> Voice / Text
        </button>
        <button
          onClick={() => setMode("tap")}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{
            background: mode === "tap" ? "#ffffff" : "transparent",
            color: mode === "tap" ? "#1f2937" : "#9ca3af",
            boxShadow: mode === "tap" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>👆</span> Quick Tap
        </button>
      </div>

      {mode === "tap" ? (
        <>
          {/* Step 1: Who? */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Who did it?</p>
            <div className="grid grid-cols-2 gap-3">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className="py-4 rounded-xl text-center font-semibold transition-all duration-200"
                  style={{
                    background: selectedMember === m.id ? m.color : "#f9fafb",
                    color: selectedMember === m.id ? "#ffffff" : "#6b7280",
                    border: selectedMember === m.id ? `2px solid ${m.color}` : "2px solid #e5e7eb",
                    boxShadow: selectedMember === m.id ? `0 4px 12px ${m.color}40` : "none",
                  }}
                >
                  <span className="text-2xl block mb-1">{m.slug === "shubhanshu" ? "🧑" : "👩"}</span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: What? */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>What was done?</p>
            <div className="grid grid-cols-3 gap-2">
              {CHORE_CATEGORIES.map((chore) => (
                <button
                  key={chore.id}
                  onClick={() => { setSelectedChore(chore.id); setCustomDuration(false) }}
                  className="py-3 rounded-xl text-center transition-all duration-200"
                  style={{
                    background: selectedChore === chore.id ? "#fff7ed" : "#f9fafb",
                    border: selectedChore === chore.id ? "2px solid #f97316" : "1px solid #e5e7eb",
                    boxShadow: selectedChore === chore.id ? "0 2px 8px rgba(249,115,22,0.15)" : "none",
                  }}
                >
                  <span className="text-xl block">{chore.emoji}</span>
                  <span className="text-xs font-medium block mt-0.5" style={{ color: selectedChore === chore.id ? "#9a3412" : "#6b7280" }}>
                    {chore.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: How long? */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>How long?</p>
            <div className="flex gap-2 flex-wrap">
              {DURATION_CHIPS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); setCustomDuration(false) }}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    background: duration === d && !customDuration ? "#fff7ed" : "#f9fafb",
                    color: duration === d && !customDuration ? "#9a3412" : "#6b7280",
                    border: duration === d && !customDuration ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                  }}
                >
                  {d}m
                </button>
              ))}
              <button
                onClick={() => { setCustomDuration(true); setDuration(null) }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: customDuration ? "#fff7ed" : "#f9fafb",
                  color: customDuration ? "#9a3412" : "#6b7280",
                  border: customDuration ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                }}
              >
                Custom
              </button>
            </div>
            {customDuration && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={480}
                  placeholder="Minutes"
                  value={duration ?? ""}
                  onChange={(e) => setDuration(Number(e.target.value) || null)}
                  className="input-dark w-28 text-sm px-3 py-2 rounded-lg"
                />
                <span className="text-xs" style={{ color: "#9ca3af" }}>minutes</span>
              </div>
            )}
          </div>

          {/* Step 4: When? */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>When?</p>
            <div className="flex gap-2">
              {WHEN_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWhen(w.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: when === w.id ? "#fff7ed" : "#f9fafb",
                    color: when === w.id ? "#9a3412" : "#6b7280",
                    border: when === w.id ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Notes (optional)</p>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Made pasta, deep cleaned kitchen..."
              className="input-dark w-full text-sm px-4 py-3 rounded-xl"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedMember || !selectedChore || !duration || submitting}
            className="w-full btn-primary text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Log Chore
              </>
            )}
          </button>
        </>
      ) : (
        /* Voice / Text mode — voice-first hero */
        <div className="space-y-5">
          {/* Hero voice area */}
          {!voiceParsing && !voiceParsed && !voiceError && (
            <div className="flex flex-col items-center py-8 rounded-2xl" style={{ background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)", border: "1px solid #fed7aa" }}>
              <div className="relative mb-5">
                {voiceListening && (
                  <>
                    <div className="absolute -inset-3 rounded-full animate-ping opacity-15" style={{ background: "#f97316" }} />
                    <div className="absolute -inset-6 rounded-full animate-pulse opacity-5" style={{ background: "#f97316" }} />
                  </>
                )}
                <VoiceButton size="hero" onTranscript={(text) => { setVoiceListening(false); handleVoiceParse(text) }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#1f2937" }}>
                {voiceListening ? "Listening..." : "Tap the mic to speak"}
              </p>
              <p className="text-xs mt-1 text-center px-6" style={{ color: "#9ca3af" }}>
                {voiceListening ? "Say who did what and for how long" : "\"I did laundry for 45 minutes\""}
              </p>
            </div>
          )}

          {/* Text input */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Or type it</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && voiceText.trim()) handleVoiceParse(voiceText) }}
                placeholder="I did laundry for 45 minutes..."
                className="input-dark flex-1 text-sm px-4 py-3 rounded-xl"
              />
              {voiceText.trim() && (
                <button
                  onClick={() => handleVoiceParse(voiceText)}
                  className="px-4 rounded-xl text-sm font-semibold shrink-0"
                  style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
                >
                  Go
                </button>
              )}
            </div>
          </div>

          {voiceParsing && (
            <div className="flex items-center justify-center gap-3 py-8">
              <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium" style={{ color: "#6b7280" }}>Understanding...</span>
            </div>
          )}

          {voiceError && (
            <div className="text-center py-6">
              <span className="text-2xl block mb-2">🤔</span>
              <p className="text-sm" style={{ color: "#dc2626" }}>{voiceError}</p>
              <button
                onClick={() => { setVoiceError(null); setVoiceText("") }}
                className="text-sm font-medium mt-3 px-4 py-2 rounded-lg"
                style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
              >
                Try Again
              </button>
            </div>
          )}

          {voiceParsed && (
            <div className="animate-slide-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Parsed Result</p>
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: parsedMember?.color ?? "#6b7280" }}>
                    {parsedMember?.name?.[0] ?? "?"}
                  </div>
                  <span className="font-semibold" style={{ color: "#1f2937" }}>{parsedMember?.name ?? voiceParsed.memberSlug}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{choreEmoji}</span>
                  <span className="font-medium" style={{ color: "#1f2937" }}>
                    {CHORE_CATEGORIES.find((c) => c.id === voiceParsed.choreType)?.label ?? voiceParsed.choreType}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏱️</span>
                  <span className="font-medium" style={{ color: "#1f2937" }}>
                    {voiceParsed.durationMinutes ?? getChoreDefaults(voiceParsed.choreType).defaultMinutes} minutes
                  </span>
                  {!voiceParsed.durationMinutes && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>auto-estimated</span>
                  )}
                </div>
                {voiceParsed.description && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📝</span>
                    <span className="text-sm" style={{ color: "#6b7280" }}>{voiceParsed.description}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xl">🕐</span>
                  <span className="text-sm" style={{ color: "#6b7280" }}>
                    {voiceParsed.completedAt ? new Date(voiceParsed.completedAt).toLocaleString() : "Just now"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setVoiceParsed(null); setVoiceText("") }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
                >
                  Redo
                </button>
                <button
                  onClick={handleVoiceConfirm}
                  disabled={submitting}
                  className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm & Log
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
