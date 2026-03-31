"use client"

import { useState, useEffect } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type HistoryData = {
  mostWornItems: { id: string; count: number; lastWorn: string; name: string; category: string }[]
  repeatedOutfits: { count: number; lastWorn: string; name: string; itemIds: string[] }[]
  neglected: { id: string; name: string; category: string; daysSinceWorn: number | null; neverWorn: boolean; imageData: string }[]
  totalOutfits: number
  totalWears: number
  recentEntries: { date: string; outfitName: string; itemCount: number }[]
}

export default function OutfitHistory() {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchHistory() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/closet/history")
      if (!res.ok) throw new Error("Failed to load outfit history")
      setData(await res.json())
    } catch {
      setError("Could not load outfit history. Please try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-sm mb-3" style={{ color: "#fb7185" }}>{error}</p>
        <button
          onClick={fetchHistory}
          className="text-sm px-4 py-2 rounded-xl font-medium"
          style={{ background: "rgba(249, 115, 22, 0.08)", color: "#ea580c" }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const allSectionsEmpty =
    data.mostWornItems.length === 0 &&
    data.repeatedOutfits.length === 0 &&
    data.neglected.length === 0 &&
    data.recentEntries.length === 0

  if (allSectionsEmpty) {
    return (
      <div className="space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: "rgba(249, 115, 22, 0.04)", border: "1px solid rgba(249, 115, 22, 0.12)" }}>
            <p className="text-2xl font-bold" style={{ color: "#431407" }}>{data.totalWears}</p>
            <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Outfits logged (90d)</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(168, 85, 247, 0.04)", border: "1px solid rgba(168, 85, 247, 0.12)" }}>
            <p className="text-2xl font-bold" style={{ color: "#431407" }}>{data.totalOutfits}</p>
            <p className="text-xs" style={{ color: "rgba(168, 85, 247, 0.5)" }}>Unique combinations</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>No history yet</p>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.4)" }}>Start logging outfits to see your wear patterns</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "rgba(249, 115, 22, 0.04)", border: "1px solid rgba(249, 115, 22, 0.12)" }}>
          <p className="text-2xl font-bold" style={{ color: "#431407" }}>{data.totalWears}</p>
          <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Outfits logged (90d)</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(168, 85, 247, 0.04)", border: "1px solid rgba(168, 85, 247, 0.12)" }}>
          <p className="text-2xl font-bold" style={{ color: "#431407" }}>{data.totalOutfits}</p>
          <p className="text-xs" style={{ color: "rgba(168, 85, 247, 0.5)" }}>Unique combinations</p>
        </div>
      </div>

      {/* Most worn items */}
      {data.mostWornItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#431407" }}>
            <span>🔥</span> Most Worn Items
          </h3>
          <div className="space-y-2">
            {data.mostWornItems.map((item) => {
              const daysAgo = Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / 86400000)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#431407" }}>{item.name}</p>
                    <p className="text-xs capitalize" style={{ color: "rgba(249, 115, 22, 0.5)" }}>{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#ea580c" }}>{item.count}x</p>
                    <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>{daysAgo}d ago</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Repeated outfit combos */}
      {data.repeatedOutfits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#431407" }}>
            <span>🔄</span> Repeated Outfits
          </h3>
          <div className="space-y-2">
            {data.repeatedOutfits.map((outfit, i) => {
              const daysAgo = Math.floor((Date.now() - new Date(outfit.lastWorn).getTime()) / 86400000)
              return (
                <div
                  key={i}
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: "#431407" }}>{outfit.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
                      Worn {outfit.count}x
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                    Last worn {daysAgo} days ago · {outfit.itemIds.length} pieces
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Neglected items */}
      {data.neglected.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#431407" }}>
            <span>💤</span> Neglected Items
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {data.neglected.map((item) => (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(244, 63, 94, 0.2)" }}
              >
                <div className="aspect-square" style={{ background: "#FAFAFA" }}>
                  <img
                    src={item.imageData}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    style={{ filter: getProductDisplayFilter() }}
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate" style={{ color: "#431407" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "#fb7185" }}>
                    {item.neverWorn ? "Never worn" : `${item.daysSinceWorn}d since last wear`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent wear log */}
      {data.recentEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#431407" }}>
            <span>📋</span> Recent Wear Log
          </h3>
          <div className="space-y-1.5">
            {data.recentEntries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
                <p className="text-xs font-medium" style={{ color: "#431407" }}>{entry.outfitName}</p>
                <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                  {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {entry.itemCount} pcs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
