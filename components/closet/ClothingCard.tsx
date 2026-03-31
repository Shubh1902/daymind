"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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

const categoryEmoji: Record<string, string> = {
  tops: "👚",
  bottoms: "👖",
  dresses: "👗",
  shoes: "👟",
  accessories: "👜",
}

interface Props {
  item: ClothingItem
  compact?: boolean
  onWhatGoesWith?: (item: ClothingItem) => void
}

export default function ClothingCard({ item, compact, onWhatGoesWith }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/closet/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !item.favorite }),
    })
    router.refresh()
    setLoading(false)
  }

  async function deleteItem(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Remove this item from your closet?")) return
    setLoading(true)
    await fetch(`/api/closet/items/${item.id}`, { method: "DELETE" })
    router.refresh()
    setLoading(false)
  }

  async function markWorn(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/closet/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wearCount: item.wearCount + 1,
        lastWornAt: new Date().toISOString(),
      }),
    })
    router.refresh()
    setLoading(false)
  }

  if (compact) {
    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--border)", opacity: loading ? 0.5 : 1 }}
      >
        <img
          src={item.imageData}
          alt={item.name ?? item.category}
          className="w-full aspect-square object-cover"
        />
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium truncate" style={{ color: "#431407" }}>
            {item.name ?? item.subcategory ?? item.category}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card-hover rounded-xl overflow-hidden relative group"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={item.imageData}
          alt={item.name ?? `${item.category} item`}
          className="w-full h-full object-cover"
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2"
          style={{ background: "rgba(67, 20, 7, 0.5)", backdropFilter: "blur(4px)" }}
        >
          <button
            onClick={markWorn}
            disabled={loading}
            className="p-2.5 rounded-full transition-transform hover:scale-110"
            style={{ background: "rgba(249, 115, 22, 0.9)", color: "white" }}
            title="Mark as worn today"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          {onWhatGoesWith && (
            <button
              onClick={(e) => { e.stopPropagation(); onWhatGoesWith(item) }}
              disabled={loading}
              className="p-2.5 rounded-full transition-transform hover:scale-110"
              style={{ background: "rgba(168, 85, 247, 0.9)", color: "white" }}
              title="What goes with this?"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </button>
          )}
          <button
            onClick={deleteItem}
            disabled={loading}
            className="p-2.5 rounded-full transition-transform hover:scale-110"
            style={{ background: "rgba(244, 63, 94, 0.9)", color: "white" }}
            title="Remove from closet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          disabled={loading}
          className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200"
          style={{
            background: item.favorite ? "rgba(249, 115, 22, 0.9)" : "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill={item.favorite ? "white" : "none"}
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Category + color badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              color: "white",
            }}
          >
            {categoryEmoji[item.category] ?? "🧵"} {item.category}
          </div>
          {item.colorHex && (
            <div
              className="w-5 h-5 rounded-full border-2 border-white/50"
              style={{ background: item.colorHex }}
              title={item.color ?? ""}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate" style={{ color: "#431407" }}>
          {item.name ?? `${item.subcategory ?? item.category}`}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.color && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(249, 115, 22, 0.08)", color: "rgba(234, 88, 12, 0.7)" }}
            >
              {item.color}
            </span>
          )}
          {item.pattern && item.pattern !== "solid" && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(168, 85, 247, 0.08)", color: "rgba(168, 85, 247, 0.7)" }}
            >
              {item.pattern}
            </span>
          )}
          {item.vibes?.slice(0, 2).map((v) => (
            <span
              key={v}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(34, 197, 94, 0.08)", color: "rgba(34, 197, 94, 0.7)" }}
            >
              {v}
            </span>
          ))}
          {item.wearCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(56, 189, 248, 0.08)", color: "rgba(56, 189, 248, 0.8)" }}
            >
              Worn {item.wearCount}x
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
