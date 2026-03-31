"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import ClosetGrid from "./ClosetGrid"

const CompatibleItemsSheet = dynamic(() => import("./CompatibleItemsSheet"), { ssr: false })

type ClothingItem = {
  id: string
  imageData: string
  category: string
  subcategory: string | null
  color: string | null
  colorHex: string | null
  pattern: string | null
  season: string | null
  name: string | null
  vibes: string[]
  favorite: boolean
  wearCount: number
  createdAt: string
}

type OotdResult = {
  name: string
  itemIds: string[]
  items: ClothingItem[]
  occasion: string
  stylingTip: string
  confidence: number
}

const QUICK_OCCASIONS = ["casual", "office", "date", "party"]

interface Props {
  initialItems: ClothingItem[]
}

export default function ClosetGridWithFeatures({ initialItems }: Props) {
  const [compatTarget, setCompatTarget] = useState<ClothingItem | null>(null)
  const [ootd, setOotd] = useState<OotdResult | null>(null)
  const [ootdLoading, setOotdLoading] = useState(false)
  const [showOotd, setShowOotd] = useState(false)

  async function getOotd(occasion?: string) {
    setOotdLoading(true)
    setShowOotd(true)
    setOotd(null)
    try {
      const res = await fetch("/api/closet/ootd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion }),
      })
      if (res.ok) {
        setOotd(await res.json())
      }
    } catch { /* ignore */ }
    setOotdLoading(false)
  }

  return (
    <>
      {/* OOTD Quick Button */}
      {initialItems.length >= 2 && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.06), rgba(168, 85, 247, 0.04))",
            border: "1px solid rgba(249, 115, 22, 0.15)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#431407" }}>
              <span className="text-lg">👗</span>
              Outfit of the Day
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => getOotd()}
              disabled={ootdLoading}
              className="shrink-0 btn-primary text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
            >
              ✨ Surprise me
            </button>
            {QUICK_OCCASIONS.map((occ) => (
              <button
                key={occ}
                onClick={() => getOotd(occ)}
                disabled={ootdLoading}
                className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg capitalize transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "var(--surface-2)",
                  color: "rgba(249, 115, 22, 0.6)",
                  border: "1px solid var(--border)",
                }}
              >
                {occ}
              </button>
            ))}
          </div>

          {/* OOTD Result */}
          {showOotd && (
            <div className="mt-3">
              {ootdLoading ? (
                <div className="flex items-center gap-2 py-3">
                  <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Styling your outfit...</span>
                </div>
              ) : ootd ? (
                <div className="animate-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: "#431407" }}>{ootd.name}</p>
                    <button
                      onClick={() => setShowOotd(false)}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ color: "rgba(249, 115, 22, 0.4)" }}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-2">
                    {(ootd.items ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-20 rounded-lg overflow-hidden"
                        style={{ border: "2px solid rgba(249, 115, 22, 0.25)" }}
                      >
                        <img src={item.imageData} alt={item.name ?? item.category} className="w-full aspect-square object-cover" />
                        <div className="px-1 py-0.5">
                          <p className="text-xs truncate" style={{ color: "#431407" }}>{item.name ?? item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {ootd.stylingTip && (
                    <p className="text-xs italic" style={{ color: "rgba(168, 85, 247, 0.6)" }}>
                      💡 {ootd.stylingTip}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Main Grid — pass onWhatGoesWith through */}
      <ClosetGrid initialItems={initialItems} />

      {/* Compatible Items Sheet */}
      {compatTarget && (
        <CompatibleItemsSheet
          targetItem={compatTarget}
          onClose={() => setCompatTarget(null)}
        />
      )}
    </>
  )
}
