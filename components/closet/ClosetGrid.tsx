"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import ClothingCard from "./ClothingCard"
import ColorPaletteFilter from "./ColorPaletteFilter"

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

const CATEGORIES = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "tops", label: "Tops", emoji: "👚" },
  { value: "bottoms", label: "Bottoms", emoji: "👖" },
  { value: "dresses", label: "Dresses", emoji: "👗" },
  { value: "shoes", label: "Shoes", emoji: "👟" },
  { value: "accessories", label: "Accessories", emoji: "👜" },
]

const VIBES = [
  { value: "casual", emoji: "☀️" },
  { value: "office", emoji: "💼" },
  { value: "party", emoji: "🎉" },
  { value: "date", emoji: "🌹" },
  { value: "nightlife", emoji: "🌙" },
  { value: "brunch", emoji: "🥂" },
  { value: "gym", emoji: "💪" },
  { value: "modest", emoji: "🧕" },
  { value: "sexy", emoji: "🔥" },
  { value: "streetwear", emoji: "🛹" },
  { value: "vacation", emoji: "🏖️" },
]

interface ClosetGridProps {
  initialItems: ClothingItem[]
}

export default function ClosetGrid({ initialItems }: ClosetGridProps) {
  const [items, setItems] = useState<ClothingItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeVibes, setActiveVibes] = useState<string[]>([])
  const [activeColors, setActiveColors] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ClothingItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/closet/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) setSearchResults(await res.json())
      } catch { /* ignore */ }
      setSearching(false)
    }, 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchQuery])

  const toggleVibe = useCallback((vibe: string) => {
    setActiveVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }, [])

  const toggleColor = useCallback((hex: string) => {
    setActiveColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    )
  }, [])

  const filtered = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false
    if (showFavoritesOnly && !item.favorite) return false
    if (activeVibes.length > 0 && !activeVibes.some((v) => item.vibes?.includes(v))) return false
    if (activeColors.length > 0 && (!item.colorHex || !activeColors.includes(item.colorHex))) return false
    return true
  })

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  // Collect all colors for the palette
  const allColors = items.map((i) => i.colorHex).filter(Boolean) as string[]

  // Only show vibes that exist in the items
  const existingVibes = new Set(items.flatMap((i) => i.vibes ?? []))
  const availableVibes = VIBES.filter((v) => existingVibes.has(v.value))

  const hasActiveFilters = activeCategory !== "all" || activeVibes.length > 0 || activeColors.length > 0 || showFavoritesOnly

  // Use search results if searching, otherwise use filtered
  // Apply the same filters to search results
  const filteredSearchResults = searchResults?.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false
    if (showFavoritesOnly && !item.favorite) return false
    if (activeVibes.length > 0 && !activeVibes.some((v) => item.vibes?.includes(v))) return false
    if (activeColors.length > 0 && (!item.colorHex || !activeColors.includes(item.colorHex))) return false
    return true
  })
  const displayItems = filteredSearchResults ?? filtered

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--closet-text-3, rgba(249, 115, 22, 0.4))" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, color, vibe, pattern..."
          aria-label="Search your closet"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm"
          style={{
            background: "var(--closet-surface, var(--surface-2))",
            border: "1px solid var(--closet-border, var(--border))",
            color: "var(--closet-text, #431407)",
          }}
        />
        {searchQuery && (
          searching ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(249, 115, 22, 0.4)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
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
                  ? "var(--closet-surface-2, rgba(234, 88, 12, 0.12))"
                  : "var(--closet-surface, var(--surface-2))",
                color: isActive ? "var(--closet-accent, #ea580c)" : "var(--closet-text-3, rgba(249, 115, 22, 0.5))",
                border: isActive
                  ? "1px solid var(--closet-border-bright, rgba(249, 115, 22, 0.25))"
                  : "1px solid var(--closet-border, var(--border))",
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              <span
                className="text-xs px-1.5 rounded-full"
                style={{
                  background: isActive ? "var(--closet-surface-3, rgba(249, 115, 22, 0.15))" : "var(--closet-surface-2, rgba(249, 115, 22, 0.08))",
                  color: isActive ? "var(--closet-accent, #f97316)" : "var(--closet-text-3, rgba(249, 115, 22, 0.4))",
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Vibe tags */}
      {availableVibes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--closet-accent, rgba(234, 88, 12, 0.6))" }}>
            Vibe
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {availableVibes.map((vibe) => {
              const isActive = activeVibes.includes(vibe.value)
              return (
                <button
                  key={vibe.value}
                  onClick={() => toggleVibe(vibe.value)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: isActive
                      ? "var(--closet-surface-2, rgba(168, 85, 247, 0.15))"
                      : "var(--closet-surface, var(--surface-2))",
                    color: isActive ? "var(--closet-accent-bright, #a855f7)" : "var(--closet-text-3, rgba(249, 115, 22, 0.5))",
                    border: isActive
                      ? "1px solid var(--closet-border-bright, rgba(168, 85, 247, 0.3))"
                      : "1px solid var(--closet-border, var(--border))",
                  }}
                >
                  <span>{vibe.emoji}</span>
                  {vibe.value}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Color palette filter */}
      <ColorPaletteFilter
        colors={allColors}
        activeColors={activeColors}
        onToggle={toggleColor}
        onClear={() => setActiveColors([])}
      />

      {/* Favorites toggle + count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: "var(--closet-text-3, rgba(249, 115, 22, 0.5))" }}>
            {displayItems.length} items{searchResults ? ` matching "${searchQuery}"` : ""}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setActiveVibes([])
                setActiveColors([])
                setShowFavoritesOnly(false)
                setActiveCategory("all")
              }}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(244, 63, 94, 0.1)", color: "#fb7185" }}
            >
              Clear all filters
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: showFavoritesOnly ? "var(--closet-surface-2, rgba(249, 115, 22, 0.12))" : "transparent",
            color: showFavoritesOnly ? "var(--closet-accent, #ea580c)" : "var(--closet-text-3, rgba(249, 115, 22, 0.4))",
            border: showFavoritesOnly
              ? "1px solid var(--closet-border, rgba(249, 115, 22, 0.2))"
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
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.15)" }}
          >
            <span className="text-2xl">👗</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>
            {searchResults ? `No results for "${searchQuery}"` : hasActiveFilters ? "No matches" : "No items yet"}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
            {searchResults
              ? "Try a different search term or adjust your filters"
              : hasActiveFilters
                ? "Try adjusting your filters"
                : "Take photos of your clothes to start building your closet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <ClothingCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
