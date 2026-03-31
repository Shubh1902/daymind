"use client"

import { useState } from "react"

type StyleDna = {
  primary: string
  secondary: string
  breakdown: Record<string, number>
  colorPalette: { dominant: string[]; accent: string[] }
  patternProfile: string
  seasonCoverage: Record<string, number>
  strengths: string[]
  personality: string
  styleIcon: string
}

export default function StyleProfileView() {
  const [profile, setProfile] = useState<StyleDna | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/closet/profile/analyze", { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed")
      }
      const data = await res.json()
      setProfile(data.styleDna)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  if (!profile && !loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.15)" }}
        >
          <span className="text-3xl">💎</span>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "#431407" }}>
          Discover Your Style DNA
        </h2>
        <p className="text-sm text-center max-w-[280px] mb-6" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          AI will analyze your entire closet to reveal your fashion personality
        </p>
        {error && (
          <p className="text-sm mb-4" style={{ color: "#fb7185" }}>{error}</p>
        )}
        <button
          onClick={analyze}
          disabled={loading}
          className="btn-primary text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Analyze My Style
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm" style={{ color: "rgba(168, 85, 247, 0.7)" }}>Analyzing your style...</p>
      </div>
    )
  }

  if (!profile) return null

  const breakdownEntries = Object.entries(profile.breakdown ?? {}).sort((a, b) => b[1] - a[1])
  const maxBreakdown = breakdownEntries[0]?.[1] ?? 100

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-2xl p-5 mb-5 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(249, 115, 22, 0.06))",
          border: "1px solid rgba(168, 85, 247, 0.15)",
        }}
      >
        <div className="text-3xl mb-2">💎</div>
        <h2 className="text-xl font-bold capitalize" style={{ color: "#431407" }}>
          {profile.primary}
        </h2>
        <p className="text-sm" style={{ color: "rgba(168, 85, 247, 0.7)" }}>
          with <span className="capitalize font-medium">{profile.secondary}</span> influence
        </p>
        {profile.styleIcon && (
          <p className="text-xs mt-2" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            Style icon: <span className="font-medium">{profile.styleIcon}</span>
          </p>
        )}
      </div>

      {/* Personality */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "#431407" }}>Fashion Personality</h3>
        <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.7)" }}>{profile.personality}</p>
      </div>

      {/* Breakdown bars */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#431407" }}>Style Breakdown</h3>
        {breakdownEntries.map(([style, pct]) => (
          <div key={style} className="flex items-center gap-3 mb-2">
            <span className="text-xs w-24 capitalize" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
              {style}
            </span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(168, 85, 247, 0.08)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(pct / maxBreakdown) * 100}%`,
                  background: "linear-gradient(90deg, #a855f7, #c084fc)",
                }}
              />
            </div>
            <span className="text-xs font-medium w-10 text-right" style={{ color: "#431407" }}>
              {pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Color palette + strengths */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#431407" }}>Color Palette</h3>
          <p className="text-xs mb-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Dominant</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {(profile.colorPalette?.dominant ?? []).map((c) => (
              <span key={c} className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ background: "rgba(249, 115, 22, 0.08)", color: "rgba(234, 88, 12, 0.7)" }}>
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs mb-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Accent</p>
          <div className="flex flex-wrap gap-1">
            {(profile.colorPalette?.accent ?? []).map((c) => (
              <span key={c} className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{ background: "rgba(168, 85, 247, 0.08)", color: "rgba(168, 85, 247, 0.7)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#431407" }}>Strengths</h3>
          {(profile.strengths ?? []).map((s, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: "rgba(34, 197, 94, 0.7)" }}>✓ {s}</p>
          ))}
        </div>
      </div>

      {/* Re-analyze button */}
      <button
        onClick={analyze}
        disabled={loading}
        className="w-full text-center text-xs py-2 rounded-xl transition-all duration-200"
        style={{ color: "rgba(249, 115, 22, 0.5)", border: "1px solid var(--border)" }}
      >
        Re-analyze
      </button>
    </div>
  )
}
