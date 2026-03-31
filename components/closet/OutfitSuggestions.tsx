"use client"

import { useState } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  subcategory: string | null
  color: string | null
  name: string | null
}

type OutfitSuggestion = {
  name: string
  itemIds: string[]
  items: ClothingItem[]
  occasion: string
  stylingTip: string
  colorStory: string
}

const OCCASIONS = [
  { value: "", label: "Any occasion", emoji: "✨" },
  { value: "casual", label: "Casual", emoji: "☀️" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "date", label: "Date night", emoji: "🌹" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "weekend", label: "Weekend", emoji: "🌿" },
]

export default function OutfitSuggestions() {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [occasion, setOccasion] = useState("")
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set())

  async function generateSuggestions() {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setSavedOutfits(new Set())

    try {
      const res = await fetch("/api/closet/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: occasion || undefined, count: 3 }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to get suggestions")
      }

      const data = await res.json()
      setSuggestions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function toggleSave(index: number) {
    setSavedOutfits((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div>
      {/* Occasion selector + generate button */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {OCCASIONS.map((occ) => {
            const isActive = occasion === occ.value
            return (
              <button
                key={occ.value}
                onClick={() => setOccasion(occ.value)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.08))"
                    : "var(--surface-2)",
                  color: isActive ? "#a855f7" : "rgba(249, 115, 22, 0.5)",
                  border: isActive
                    ? "1px solid rgba(168, 85, 247, 0.25)"
                    : "1px solid var(--border)",
                }}
              >
                <span>{occ.emoji}</span>
                {occ.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Styling your outfits...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Suggest Outfits
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm"
          style={{
            background: "rgba(244, 63, 94, 0.08)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            color: "#fb7185",
          }}
        >
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-4">
          {suggestions.map((outfit, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden animate-slide-up"
              style={{
                background: "var(--surface-2)",
                border: savedOutfits.has(i)
                  ? "2px solid rgba(249, 115, 22, 0.4)"
                  : "1px solid var(--border)",
                animationDelay: `${i * 100}ms`,
              }}
            >
              {/* Outfit header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#431407" }}>
                    {outfit.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                    {outfit.occasion}
                  </p>
                </div>
                <button
                  onClick={() => toggleSave(i)}
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    background: savedOutfits.has(i) ? "rgba(249, 115, 22, 0.12)" : "transparent",
                    color: savedOutfits.has(i) ? "#f97316" : "rgba(249, 115, 22, 0.3)",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill={savedOutfits.has(i) ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </button>
              </div>

              {/* Items strip */}
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {outfit.items.map((item) => (
                  <div
                    key={item.id}
                    className="shrink-0 w-24 rounded-lg overflow-hidden"
                    style={{ border: "1px solid rgba(249, 115, 22, 0.15)" }}
                  >
                    <img
                      src={item.imageData}
                      alt={item.name ?? item.category}
                      className="w-full aspect-square object-contain"
                      style={{ background: "#FAFAFA", filter: getProductDisplayFilter() }}
                    />
                    <div className="px-2 py-1">
                      <p className="text-xs truncate" style={{ color: "#431407" }}>
                        {item.name ?? item.subcategory ?? item.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Styling tips */}
              <div className="px-4 py-3" style={{ background: "rgba(249, 115, 22, 0.03)" }}>
                <p className="text-xs" style={{ color: "rgba(234, 88, 12, 0.7)" }}>
                  <span className="font-semibold">Styling tip:</span> {outfit.stylingTip}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(168, 85, 247, 0.6)" }}>
                  <span className="font-semibold">Colors:</span> {outfit.colorStory}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.15)" }}
          >
            <span className="text-2xl">👗</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>
            Ready to style
          </p>
          <p className="text-sm mt-1 text-center max-w-[250px]" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
            Pick an occasion and tap &quot;Suggest Outfits&quot; to get AI-powered combinations from your closet
          </p>
        </div>
      )}
    </div>
  )
}
