"use client"

import { useState } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type Look = {
  title: string
  description: string
  itemIds: string[]
  items: { id: string; name: string; category: string; imageData: string }[]
  missingPieces: string[]
  trendScore: number
  tags: string[]
}

export default function InspirationFeed() {
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch("/api/closet/inspiration", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setLooks(data.looks ?? [])
        setLoaded(true)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  function scoreBg(score: number) {
    if (score >= 8) return "rgba(34, 197, 94, 0.1)"
    if (score >= 5) return "rgba(245, 158, 11, 0.1)"
    return "rgba(244, 63, 94, 0.1)"
  }

  function scoreColor(score: number) {
    if (score >= 8) return "#22c55e"
    if (score >= 5) return "#f59e0b"
    return "#fb7185"
  }

  if (!loaded) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#431407" }}>Discover Your Style</h3>
        <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          AI analyzes your wardrobe and matches it to current fashion trends
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary text-white text-sm font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🔮</span>
          )}
          Generate Inspiration
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>{looks.length} trending looks</p>
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
          style={{ background: "rgba(249, 115, 22, 0.08)", color: "#ea580c" }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {looks.map((look, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden animate-slide-up"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", animationDelay: `${i * 80}ms` }}
        >
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: "#431407" }}>{look.title}</h3>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: scoreBg(look.trendScore), color: scoreColor(look.trendScore) }}
              >
                {look.trendScore}/10 match
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
              {look.description}
            </p>
          </div>

          {/* Items */}
          {look.items?.length > 0 && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
              {look.items.map((item) => (
                <div key={item.id} className="shrink-0 w-20 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="aspect-square" style={{ background: "#FAFAFA" }}>
                    <img
                      src={item.imageData}
                      alt={item.name ?? item.category}
                      className="w-full h-full object-contain"
                      style={{ filter: getProductDisplayFilter() }}
                    />
                  </div>
                  <p className="text-xs truncate px-1 py-0.5" style={{ color: "#431407" }}>{item.name ?? item.category}</p>
                </div>
              ))}
            </div>
          )}

          {/* Missing pieces */}
          {look.missingPieces?.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs font-semibold mb-1" style={{ color: "rgba(168, 85, 247, 0.7)" }}>🛍️ Missing pieces:</p>
              <div className="flex flex-wrap gap-1">
                {look.missingPieces.map((piece, j) => (
                  <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168, 85, 247, 0.08)", color: "#a855f7" }}>
                    {piece}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {look.tags?.map((tag, j) => (
              <span key={j} className="text-xs" style={{ color: "rgba(56, 189, 248, 0.6)" }}>{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
