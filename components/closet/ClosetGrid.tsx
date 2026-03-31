"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ClothingCard from "./ClothingCard"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  subcategory: string | null
  color: string | null
  pattern: string | null
  season: string | null
  name: string | null
  favorite: boolean
  wearCount: number
  createdAt: string
}

const CATEGORIES = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "tops", label: "Tops", emoji: "👚" },
  { value: "bottoms", label: "Bottoms", emoji: "👖" },
  { value: "dresses", label: "Dresses", emoji: "👗" },
  { value: "shoes", label: "Shoes", emoji: "👟" },
  { value: "accessories", label: "Accessories", emoji: "👜" },
]

interface ClosetGridProps {
  initialItems: ClothingItem[]
}

export default function ClosetGrid({ initialItems }: ClosetGridProps) {
  const router = useRouter()
  const [items, setItems] = useState<ClothingItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState("all")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Re-sync when initialItems changes (server refresh)
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const filtered = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false
    if (showFavoritesOnly && !item.favorite) return false
    return true
  })

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value
          const count = cat.value === "all" ? items.length : (categoryCounts[cat.value] ?? 0)
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(249, 115, 22, 0.08))"
                  : "var(--surface-2)",
                color: isActive ? "#ea580c" : "rgba(249, 115, 22, 0.5)",
                border: isActive
                  ? "1px solid rgba(249, 115, 22, 0.25)"
                  : "1px solid var(--border)",
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              <span
                className="text-xs px-1.5 rounded-full"
                style={{
                  background: isActive ? "rgba(249, 115, 22, 0.15)" : "rgba(249, 115, 22, 0.08)",
                  color: isActive ? "#f97316" : "rgba(249, 115, 22, 0.4)",
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Favorites toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          {filtered.length} items
        </p>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: showFavoritesOnly ? "rgba(249, 115, 22, 0.12)" : "transparent",
            color: showFavoritesOnly ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
            border: showFavoritesOnly
              ? "1px solid rgba(249, 115, 22, 0.2)"
              : "1px solid transparent",
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill={showFavoritesOnly ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          Favorites
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.15)" }}
          >
            <span className="text-2xl">👗</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>
            {showFavoritesOnly ? "No favorites yet" : "No items yet"}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
            {showFavoritesOnly
              ? "Heart your favorite pieces to see them here"
              : "Take photos of your clothes to start building your closet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <ClothingCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
