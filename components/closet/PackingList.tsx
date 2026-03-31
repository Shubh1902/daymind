"use client"

import { useState } from "react"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  name: string | null
}

type DailyOutfit = {
  day: number
  occasion: string
  items: ClothingItem[]
  note: string
}

type PackingPlan = {
  packingListItems: ClothingItem[]
  totalItems: number
  dailyOutfits: DailyOutfit[]
  mixMatchTips: string[]
  capsuleRatio: string
}

const OCCASIONS = ["casual", "office", "dinner", "sightseeing", "nightlife", "beach", "gym", "brunch"]
const CLIMATES = [
  { value: "warm", label: "Warm ☀️" },
  { value: "cold", label: "Cold ❄️" },
  { value: "mixed", label: "Mixed 🌤️" },
]

export default function PackingList() {
  const [days, setDays] = useState(5)
  const [climate, setClimate] = useState("mixed")
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(["casual", "dinner"])
  const [plan, setPlan] = useState<PackingPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "daily">("list")

  function toggleOccasion(occ: string) {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    )
  }

  async function generatePlan() {
    if (selectedOccasions.length === 0) {
      setError("Select at least one occasion")
      return
    }
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const res = await fetch("/api/closet/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, occasions: selectedOccasions, climate }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed")
      }
      setPlan(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Trip config */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        {/* Days */}
        <div className="mb-4">
          <label className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>
            Trip Duration
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-bold w-16 text-right" style={{ color: "#431407" }}>
              {days} days
            </span>
          </div>
        </div>

        {/* Climate */}
        <div className="mb-4">
          <label className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>
            Climate
          </label>
          <div className="flex gap-2">
            {CLIMATES.map((c) => {
              const isActive = climate === c.value
              return (
                <button
                  key={c.value}
                  onClick={() => setClimate(c.value)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: isActive ? "rgba(249, 115, 22, 0.12)" : "transparent",
                    color: isActive ? "#ea580c" : "rgba(249, 115, 22, 0.5)",
                    border: isActive ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid var(--border)",
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Occasions */}
        <div className="mb-4">
          <label className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>
            Occasions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((occ) => {
              const isActive = selectedOccasions.includes(occ)
              return (
                <button
                  key={occ}
                  onClick={() => toggleOccasion(occ)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    background: isActive ? "rgba(168, 85, 247, 0.12)" : "transparent",
                    color: isActive ? "#a855f7" : "rgba(249, 115, 22, 0.5)",
                    border: isActive ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid var(--border)",
                  }}
                >
                  {occ}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Packing your bags...
            </>
          ) : (
            <>🧳 Generate Packing List</>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: "rgba(244, 63, 94, 0.08)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {plan && (
        <div className="animate-slide-up">
          {/* Summary */}
          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(168, 85, 247, 0.04)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "#431407" }}>
                Pack {plan.totalItems ?? plan.packingListItems?.length} items
              </h3>
              <span className="text-xs" style={{ color: "rgba(168, 85, 247, 0.7)" }}>
                {plan.capsuleRatio}
              </span>
            </div>
            {plan.mixMatchTips?.map((tip, i) => (
              <p key={i} className="text-xs mb-1" style={{ color: "rgba(249, 115, 22, 0.6)" }}>💡 {tip}</p>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {(["list", "daily"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200"
                style={{
                  background: viewMode === v ? "rgba(249, 115, 22, 0.1)" : "transparent",
                  color: viewMode === v ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
                }}
              >
                {v === "list" ? "Packing List" : "Day by Day"}
              </button>
            ))}
          </div>

          {viewMode === "list" && plan.packingListItems && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {plan.packingListItems.map((item) => (
                <div key={item.id} className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <img src={item.imageData} alt={item.name ?? item.category} className="w-full aspect-square object-cover" />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium truncate" style={{ color: "#431407" }}>{item.name ?? item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "daily" && plan.dailyOutfits && (
            <div className="flex flex-col gap-3">
              {plan.dailyOutfits.map((day) => (
                <div key={day.day} className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: "#431407" }}>Day {day.day}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(168, 85, 247, 0.08)", color: "#a855f7" }}>
                      {day.occasion}
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-1.5">
                    {(day.items ?? []).map((item) => (
                      <div key={item.id} className="shrink-0 w-14 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <img src={item.imageData} alt={item.name ?? ""} className="w-full aspect-square object-cover" />
                      </div>
                    ))}
                  </div>
                  {day.note && (
                    <p className="text-xs italic" style={{ color: "rgba(249, 115, 22, 0.5)" }}>{day.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
