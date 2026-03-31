"use client"

import { useState } from "react"

type ClothingItem = {
  id: string
  category: string
  color: string | null
  colorHex: string | null
  pattern: string | null
  season: string | null
  vibes: string[]
  favorite: boolean
  wearCount: number
  name: string | null
}

type GapAnalysis = {
  balance: Record<string, string>
  gaps: string[]
  strengths: string[]
  diversityScore: number
  versatilityScore: number
  summary: string
}

export default function ClosetStats({ items }: { items: ClothingItem[] }) {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null)
  const [loadingGap, setLoadingGap] = useState(false)

  // Compute stats client-side
  const total = items.length
  const categoryCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1
    return acc
  }, {})

  const colorCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.color ?? "unknown"] = (acc[i.color ?? "unknown"] ?? 0) + 1
    return acc
  }, {})
  const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const vibesCounts = items.reduce<Record<string, number>>((acc, i) => {
    for (const v of i.vibes ?? []) acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  const topVibes = Object.entries(vibesCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const totalWears = items.reduce((s, i) => s + i.wearCount, 0)
  const avgWears = total > 0 ? (totalWears / total).toFixed(1) : "0"
  const neverWorn = items.filter((i) => i.wearCount === 0).length
  const favorites = items.filter((i) => i.favorite).length

  const maxCat = Math.max(...Object.values(categoryCounts), 1)

  async function runGapAnalysis() {
    setLoadingGap(true)
    try {
      const res = await fetch("/api/closet/gap-analysis", { method: "POST" })
      if (res.ok) setGapAnalysis(await res.json())
    } catch { /* ignore */ }
    setLoadingGap(false)
  }

  return (
    <div>
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Items", value: total, color: "#f97316" },
          { label: "Favorites", value: favorites, color: "#ef4444" },
          { label: "Avg Wears", value: avgWears, color: "#22c55e" },
          { label: "Never Worn", value: neverWorn, color: "#f59e0b" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#431407" }}>
          Category Balance
        </h3>
        {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-3 mb-2">
            <span className="text-xs w-20 capitalize" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
              {cat}
            </span>
            <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(249, 115, 22, 0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxCat) * 100}%`,
                  background: "linear-gradient(90deg, #ea580c, #f97316)",
                }}
              />
            </div>
            <span className="text-xs font-medium w-6 text-right" style={{ color: "#431407" }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Top colors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#431407" }}>Top Colors</h3>
          {topColors.map(([color, count]) => (
            <div key={color} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs flex-1 capitalize truncate" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
                {color}
              </span>
              <span className="text-xs font-medium" style={{ color: "#431407" }}>{count}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#431407" }}>Top Vibes</h3>
          {topVibes.map(([vibe, count]) => (
            <div key={vibe} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs flex-1 capitalize" style={{ color: "rgba(168, 85, 247, 0.7)" }}>
                {vibe}
              </span>
              <span className="text-xs font-medium" style={{ color: "#431407" }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Gap Analysis */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "#431407" }}>AI Gap Analysis</h3>
          <button
            onClick={runGapAnalysis}
            disabled={loadingGap}
            className="btn-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            {loadingGap ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            )}
            Analyze
          </button>
        </div>

        {gapAnalysis ? (
          <div className="animate-slide-up">
            <div className="flex gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: "#a855f7" }}>{gapAnalysis.diversityScore}/10</div>
                <div className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>Diversity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: "#22c55e" }}>{gapAnalysis.versatilityScore}/10</div>
                <div className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>Versatility</div>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: "#431407" }}>{gapAnalysis.summary}</p>
            {gapAnalysis.gaps.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>Missing pieces:</p>
                {gapAnalysis.gaps.map((g, i) => (
                  <p key={i} className="text-xs" style={{ color: "rgba(249, 115, 22, 0.6)" }}>• {g}</p>
                ))}
              </div>
            )}
            {gapAnalysis.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>Strengths:</p>
                {gapAnalysis.strengths.map((s, i) => (
                  <p key={i} className="text-xs" style={{ color: "rgba(249, 115, 22, 0.6)" }}>✓ {s}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
            Tap &quot;Analyze&quot; to get AI-powered insights on your wardrobe gaps
          </p>
        )}
      </div>
    </div>
  )
}
