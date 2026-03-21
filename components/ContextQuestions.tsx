"use client"

import { useState } from "react"
import { saveUserContext } from "@/app/actions/ai"

export default function ContextQuestions({
  questions,
  userId,
}: {
  questions: string[]
  userId: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || questions.length === 0) return null

  const question = questions[currentIndex]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return

    setSaving(true)
    try {
      await saveUserContext(userId, `question_${Date.now()}`, `Q: ${question} A: ${answer.trim()}`)
      setAnswer("")
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        setDismissed(true)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-4 mb-6 animate-scale-in"
      style={{
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.07), rgba(168, 85, 247, 0.04))",
        border: "1px solid rgba(139, 92, 246, 0.18)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: "rgba(139, 92, 246, 0.15)" }}
          >
            <svg className="w-3 h-3" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
            Quick question {questions.length > 1 ? `${currentIndex + 1}/${questions.length}` : ""}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs transition-colors px-2 py-0.5 rounded-md"
          style={{ color: "rgba(139, 92, 246, 0.4)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(167, 139, 250, 0.7)"; e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(139, 92, 246, 0.4)"; e.currentTarget.style.background = "transparent" }}
        >
          skip
        </button>
      </div>

      <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(240, 238, 255, 0.85)" }}>
        {question}
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer…"
          className="flex-1 text-sm rounded-xl px-3 py-2 outline-none transition-all duration-200"
          style={{
            background: "rgba(30, 30, 54, 0.8)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            color: "rgba(240, 238, 255, 0.9)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)"
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.15)"
            e.currentTarget.style.boxShadow = "none"
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={saving || !answer.trim()}
          className="text-sm font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.3)",
          }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            "Save"
          )}
        </button>
      </form>
    </div>
  )
}
