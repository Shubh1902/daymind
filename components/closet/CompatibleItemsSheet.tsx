"use client"

import { useState, useEffect } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  subcategory: string | null
  color: string | null
  colorHex: string | null
  name: string | null
  vibes: string[]
}

type CompatibleResult = {
  id: string
  score: number
  reason: string
  item: ClothingItem
}

interface Props {
  targetItem: ClothingItem
  onClose: () => void
}

export default function CompatibleItemsSheet({ targetItem, onClose }: Props) {
  const [results, setResults] = useState<CompatibleResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompatible() {
      try {
        const res = await fetch("/api/closet/compatible", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: targetItem.id }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? "Failed")
        }
        const data = await res.json()
        setResults(data.compatible)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchCompatible()
  }, [targetItem.id])

  function scoreColor(score: number) {
    if (score >= 8) return "#22c55e"
    if (score >= 6) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center animate-overlay-in"
      style={{ background: "rgba(67, 20, 7, 0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full md:max-w-lg mx-auto flex flex-col"
        style={{
          background: "var(--surface-1)",
          border: "1px solid rgba(249, 115, 22, 0.15)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(249, 115, 22, 0.1)" }}>
          <img
            src={targetItem.imageData}
            alt={targetItem.name ?? targetItem.category}
            className="w-12 h-12 rounded-lg object-contain"
            style={{ background: "#FAFAFA", border: "2px solid rgba(168, 85, 247, 0.3)", filter: getProductDisplayFilter() }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#431407" }}>
              What goes with this?
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
              {targetItem.name ?? targetItem.category}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="flex flex-col items-center py-12">
              <div className="w-8 h-8 border-3 border-orange-300 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                Finding compatible pieces...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                No compatible items found. Add more clothes!
              </p>
            </div>
          )}

          {results.map((result, i) => (
            <div
              key={result.id}
              className="flex items-center gap-3 py-3 animate-slide-up"
              style={{
                borderBottom: i < results.length - 1 ? "1px solid rgba(249, 115, 22, 0.08)" : "none",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <img
                src={result.item.imageData}
                alt={result.item.name ?? result.item.category}
                className="w-16 h-16 rounded-lg object-contain shrink-0"
                style={{ background: "#FAFAFA", border: "1px solid var(--border)", filter: getProductDisplayFilter() }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#431407" }}>
                  {result.item.name ?? result.item.subcategory ?? result.item.category}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                  {result.reason}
                </p>
              </div>
              <div className="text-center shrink-0">
                <div
                  className="text-sm font-bold"
                  style={{ color: scoreColor(result.score) }}
                >
                  {result.score}
                </div>
                <div className="text-xs" style={{ color: "rgba(249, 115, 22, 0.3)" }}>/10</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
