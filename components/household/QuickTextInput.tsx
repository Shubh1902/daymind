"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CHORE_CATEGORIES, getChoreDefaults } from "@/lib/household-chores"

type Member = { id: string; name: string; slug: string; color: string }

interface Props {
  members: Member[]
}

export default function QuickTextInput({ members }: Props) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!text.trim() || parsing) return
    setParsing(true)
    setError("")
    try {
      // Parse via voice API
      const parseRes = await fetch("/api/household/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text.trim(), members }),
      })
      const parsed = await parseRes.json()

      // Collect chores to save
      const chores = parsed.action === "multiple_chores" && Array.isArray(parsed.chores)
        ? parsed.chores
        : parsed.action === "chore_logged" && parsed.chore
        ? [parsed.chore]
        : null

      if (!chores || chores.length === 0) {
        setError(parsed.message ?? "Couldn't understand. Try: \"I did dishes for 20 min\"")
        setParsing(false)
        return
      }

      // Save all chores
      for (const chore of chores) {
        const member = members.find((m) => m.slug === chore.memberSlug)
        if (!member) continue
        const defaults = getChoreDefaults(chore.choreType)
        await fetch("/api/household/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            choreType: chore.choreType,
            memberId: member.id,
            durationMinutes: chore.durationMinutes ?? defaults.defaultMinutes,
            description: chore.description,
            completedAt: chore.completedAt,
            source: "voice",
          }),
        })
      }

      setSuccess(true)
      setText("")
      setTimeout(() => { setSuccess(false); router.refresh() }, 1500)
    } catch {
      setError("Something went wrong.")
    }
    setParsing(false)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setError(""); setSuccess(false) }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          placeholder="I did dishes for 20 min..."
          className="input-dark flex-1 text-sm px-4 py-3 rounded-xl"
          disabled={parsing}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || parsing}
          className="px-4 rounded-xl text-sm font-semibold shrink-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", minWidth: "52px" }}
        >
          {parsing ? (
            <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          ) : success ? (
            <svg className="w-4 h-4" style={{ color: "#10b981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            "Log"
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs mt-1.5 px-1" style={{ color: "#dc2626" }}>{error}</p>
      )}
      {success && (
        <p className="text-xs mt-1.5 px-1" style={{ color: "#10b981" }}>Logged!</p>
      )}
    </div>
  )
}
