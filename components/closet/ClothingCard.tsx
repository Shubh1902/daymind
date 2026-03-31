"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { getProductDisplayFilter } from "@/lib/imageEnhance"
import ItemDetailSheet from "./ItemDetailSheet"

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
  const [showDetail, setShowDetail] = useState(false)

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

  if (compact) {
    return (
      <div
        className="rounded-lg overflow-hidden cursor-pointer"
        style={{ border: "1px solid var(--border)", opacity: loading ? 0.5 : 1, background: "#FAFAFA" }}
        onClick={() => setShowDetail(true)}
      >
        <div className="aspect-square overflow-hidden flex items-center justify-center" style={{ background: "#FAFAFA" }}>
          <img
            src={item.imageData}
            alt={item.name ?? item.category}
            className="w-full h-full object-contain"
            style={{ filter: getProductDisplayFilter() }}
          />
        </div>
        <div className="px-2 py-1.5" style={{ background: "white" }}>
          <p className="text-xs font-medium truncate" style={{ color: "#431407" }}>
            {item.name ?? item.subcategory ?? item.category}
          </p>
        </div>

        {/* Portal: detail sheet renders at document root, not inside this card */}
        {showDetail && createPortal(
          <ItemDetailSheet
            item={item}
            onClose={() => { setShowDetail(false); router.refresh() }}
            onWhatGoesWith={onWhatGoesWith}
          />,
          document.body
        )}
      </div>
    )
  }

  return (
    <>
      <div
        className="card-hover rounded-xl overflow-hidden relative group cursor-pointer"
        style={{
          background: "#FAFAFA",
          border: "1px solid var(--border)",
          opacity: loading ? 0.5 : 1,
        }}
        onClick={() => setShowDetail(true)}
      >
        {/* Image */}
        <div
          className="aspect-square relative overflow-hidden flex items-center justify-center"
          style={{ background: "#FAFAFA" }}
        >
          <img
            src={item.imageData}
            alt={item.name ?? `${item.category} item`}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ filter: getProductDisplayFilter() }}
          />

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200"
            style={{
              background: item.favorite ? "rgba(249, 115, 22, 0.9)" : "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
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

          {/* Worn count badge */}
          {item.wearCount > 0 && (
            <div
              className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                color: "white",
              }}
            >
              {item.wearCount}× worn
            </div>
          )}
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
          </div>
        </div>
      </div>

      {/* Portal: detail sheet renders at document root, not inside this card */}
      {showDetail && createPortal(
        <ItemDetailSheet
          item={item}
          onClose={() => { setShowDetail(false); router.refresh() }}
          onWhatGoesWith={onWhatGoesWith}
        />,
        document.body
      )}
    </>
  )
}
