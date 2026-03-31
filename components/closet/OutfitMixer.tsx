"use client"

import { useState, useRef } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"
import FlatLayPreview from "./FlatLayPreview"
import TryOnPreview from "./TryOnPreview"

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

type Feedback = {
  colorHarmony: number
  styleMatch: number
  overallScore: number
  occasions: string[]
  feedback: string
  suggestedSwaps: string[]
}

const SLOTS = [
  { category: "tops", label: "Top", emoji: "👚" },
  { category: "bottoms", label: "Bottom", emoji: "👖" },
  { category: "dresses", label: "Dress", emoji: "👗" },
  { category: "shoes", label: "Shoes", emoji: "👟" },
  { category: "accessories", label: "Accessory", emoji: "👜" },
]

export default function OutfitMixer({ items }: { items: ClothingItem[] }) {
  const [selected, setSelected] = useState<Record<string, ClothingItem | null>>({})
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "flatlay">("grid")
  const [sharing, setSharing] = useState(false)
  const [showTryOn, setShowTryOn] = useState(false)
  const flatLayRef = useRef<HTMLDivElement>(null)

  const selectedItems = Object.values(selected).filter(Boolean) as ClothingItem[]
  const selectedIds = selectedItems.map((i) => i.id)

  function toggleItem(category: string, item: ClothingItem) {
    setSelected((prev) => {
      if (prev[category]?.id === item.id) {
        const next = { ...prev }
        delete next[category]
        return next
      }
      return { ...prev, [category]: item }
    })
    setFeedback(null)
    setSaved(false)
  }

  async function getFeedback() {
    if (selectedIds.length < 2) return
    setLoadingFeedback(true)
    try {
      const res = await fetch("/api/closet/mix/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds }),
      })
      if (res.ok) {
        setFeedback(await res.json())
      }
    } catch { /* ignore */ }
    setLoadingFeedback(false)
  }

  async function saveOutfit() {
    if (selectedIds.length < 2) return
    setSaving(true)
    try {
      await fetch("/api/closet/mix/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: selectedIds,
          name: feedback?.feedback ? `Mix: ${selectedItems.map((i) => i.name ?? i.category).join(" + ")}` : "My Mix",
          occasion: feedback?.occasions?.[0] ?? null,
          feedback: feedback?.feedback ?? null,
        }),
      })
      setSaved(true)
    } catch { /* ignore */ }
    setSaving(false)
  }

  function scoreColor(score: number) {
    if (score >= 8) return "#22c55e"
    if (score >= 6) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <div>
      {/* Outfit preview board */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>
            Your Outfit
          </h3>
          {selectedItems.length >= 2 && (
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  background: viewMode === "grid" ? "rgba(249, 115, 22, 0.1)" : "transparent",
                  color: viewMode === "grid" ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("flatlay")}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  background: viewMode === "flatlay" ? "rgba(249, 115, 22, 0.1)" : "transparent",
                  color: viewMode === "flatlay" ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
                }}
              >
                Flat Lay
              </button>
            </div>
          )}
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
              Tap items below to build your outfit
            </p>
          </div>
        ) : viewMode === "flatlay" ? (
          <div ref={flatLayRef}>
            <FlatLayPreview items={selectedItems} size={400} />
          </div>
        ) : (
          <div className="flex gap-3 justify-center flex-wrap">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="relative w-24 rounded-xl overflow-hidden animate-scale-in"
                style={{ border: "2px solid rgba(249, 115, 22, 0.3)" }}
              >
                <img
                  src={item.imageData}
                  alt={item.name ?? item.category}
                  className="w-full aspect-square object-contain"
                  style={{ background: "#FAFAFA", filter: getProductDisplayFilter() }}
                />
                <button
                  onClick={() => toggleItem(item.category, item)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <p className="text-xs text-white truncate text-center">
                    {item.name ?? item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {selectedItems.length >= 2 && (
          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={getFeedback}
              disabled={loadingFeedback}
              className="btn-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {loadingFeedback ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
              Rate This Look
            </button>
            <button
              onClick={saveOutfit}
              disabled={saving || saved}
              className="text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
              style={{
                background: saved ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.08)",
                color: saved ? "#22c55e" : "#ea580c",
                border: saved ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(249, 115, 22, 0.2)",
              }}
            >
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save Outfit"}
            </button>
            <button
              onClick={async () => {
                setSharing(true)
                try {
                  // Render flat-lay to canvas for sharing
                  const tempCanvas = document.createElement("canvas")
                  tempCanvas.width = 800
                  tempCanvas.height = 800
                  const ctx = tempCanvas.getContext("2d")!
                  ctx.fillStyle = "#FAFAFA"
                  ctx.fillRect(0, 0, 800, 800)

                  // Draw items
                  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {
                    tops: { x: 200, y: 40, w: 400, h: 320 },
                    dresses: { x: 160, y: 40, w: 480, h: 560 },
                    bottoms: { x: 200, y: 336, w: 400, h: 304 },
                    shoes: { x: 240, y: 624, w: 320, h: 160 },
                    accessories: { x: 16, y: 40, w: 176, h: 176 },
                  }
                  const hasDress = selectedItems.some(i => i.category === "dresses")
                  for (const item of selectedItems) {
                    if (hasDress && (item.category === "tops" || item.category === "bottoms")) continue
                    const pos = positions[item.category] ?? positions.accessories
                    const img = new Image()
                    img.src = item.imageData
                    await new Promise(r => { img.onload = r })
                    const scale = Math.min(pos.w / img.width, pos.h / img.height)
                    const iw = img.width * scale, ih = img.height * scale
                    ctx.drawImage(img, pos.x + (pos.w - iw) / 2, pos.y + (pos.h - ih) / 2, iw, ih)
                  }

                  // Add branding
                  ctx.fillStyle = "rgba(249, 115, 22, 0.15)"
                  ctx.font = "18px system-ui"
                  ctx.textAlign = "right"
                  ctx.fillText("DayMind Closet", 790, 790)

                  tempCanvas.toBlob(async (blob) => {
                    if (!blob) return
                    const file = new File([blob], "outfit.png", { type: "image/png" })
                    if (navigator.share && navigator.canShare?.({ files: [file] })) {
                      await navigator.share({
                        title: "My Outfit",
                        text: "Check out my outfit!",
                        files: [file],
                      })
                    } else {
                      // Fallback: download
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "outfit.png"
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }, "image/png")
                } catch { /* ignore */ }
                setSharing(false)
              }}
              disabled={sharing}
              className="text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200"
              style={{
                background: "rgba(56, 189, 248, 0.08)",
                color: "rgba(56, 189, 248, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {sharing ? (
                <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              )}
              Share
            </button>
            <button
              onClick={() => setShowTryOn(true)}
              className="text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200"
              style={{
                background: "rgba(168, 85, 247, 0.08)",
                color: "#7c3aed",
                border: "1px solid rgba(168, 85, 247, 0.2)",
              }}
            >
              👗 Try On
            </button>
          </div>
        )}
      </div>

      {/* AI Feedback Card */}
      {feedback && (
        <div
          className="rounded-2xl p-4 mb-5 animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.04), rgba(249, 115, 22, 0.04))",
            border: "1px solid rgba(168, 85, 247, 0.15)",
          }}
        >
          <div className="flex items-center gap-4 mb-3">
            {[
              { label: "Color", score: feedback.colorHarmony },
              { label: "Style", score: feedback.styleMatch },
              { label: "Overall", score: feedback.overallScore },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: scoreColor(s.score) }}
                >
                  {s.score}/10
                </div>
                <div className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm mb-2" style={{ color: "#431407" }}>
            {feedback.feedback}
          </p>

          {feedback.occasions.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {feedback.occasions.map((o) => (
                <span
                  key={o}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}
                >
                  {o}
                </span>
              ))}
            </div>
          )}

          {feedback.suggestedSwaps.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(168, 85, 247, 0.1)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "rgba(168, 85, 247, 0.7)" }}>
                Swap ideas:
              </p>
              {feedback.suggestedSwaps.map((s, i) => (
                <p key={i} className="text-xs" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
                  • {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category slots */}
      {SLOTS.map((slot) => {
        const categoryItems = items.filter((i) => i.category === slot.category)
        if (categoryItems.length === 0) return null

        const isExpanded = expandedSlot === slot.category
        const isSelected = !!selected[slot.category]

        return (
          <div key={slot.category} className="mb-4">
            <button
              onClick={() => setExpandedSlot(isExpanded ? null : slot.category)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200"
              style={{
                background: isSelected
                  ? "rgba(249, 115, 22, 0.08)"
                  : "var(--surface-2)",
                border: isSelected
                  ? "1px solid rgba(249, 115, 22, 0.25)"
                  : "1px solid var(--border)",
              }}
            >
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#431407" }}>
                <span>{slot.emoji}</span>
                {slot.label}
                <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                  ({categoryItems.length})
                </span>
                {isSelected && (
                  <span
                    className="text-xs px-1.5 rounded-full"
                    style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
                  >
                    ✓ {selected[slot.category]?.name ?? "Selected"}
                  </span>
                )}
              </span>
              <svg
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  color: "rgba(249, 115, 22, 0.4)",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2 animate-slide-up">
                {categoryItems.map((item) => {
                  const isItemSelected = selected[slot.category]?.id === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(slot.category, item)}
                      className="rounded-lg overflow-hidden transition-all duration-200"
                      style={{
                        border: isItemSelected
                          ? "2px solid #f97316"
                          : "1px solid var(--border)",
                        boxShadow: isItemSelected
                          ? "0 0 12px rgba(249, 115, 22, 0.3)"
                          : "none",
                      }}
                    >
                      <img
                        src={item.imageData}
                        alt={item.name ?? item.category}
                        className="w-full aspect-square object-contain"
                        style={{ background: "#FAFAFA", filter: getProductDisplayFilter() }}
                      />
                      <div className="px-1 py-1">
                        <p className="text-xs truncate" style={{ color: "#431407" }}>
                          {item.name ?? item.subcategory ?? item.category}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Try-On Modal */}
      {showTryOn && selectedItems.length > 0 && (
        <TryOnPreview
          items={selectedItems}
          onClose={() => setShowTryOn(false)}
        />
      )}
    </div>
  )
}
