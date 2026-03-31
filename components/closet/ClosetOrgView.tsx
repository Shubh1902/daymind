"use client"

import { useState, useRef } from "react"
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
  colorHex?: string | null
  pattern?: string | null
  season?: string | null
  name: string | null
  vibes?: string[]
  favorite: boolean
  wearCount?: number
  lastWornAt?: string | null
  createdAt?: string
}

interface Props {
  items: ClothingItem[]
}

const SECTIONS: {
  key: string
  label: string
  icon: string
  accent: string
  accentBg: string
  accentBorder: string
}[] = [
  { key: "tops", label: "Tops & Shirts", icon: "👚", accent: "#be185d", accentBg: "#fdf2f8", accentBorder: "#fbcfe8" },
  { key: "dresses", label: "Dresses", icon: "👗", accent: "#7c3aed", accentBg: "#faf5ff", accentBorder: "#e9d5ff" },
  { key: "bottoms", label: "Bottoms", icon: "👖", accent: "#0369a1", accentBg: "#f0f9ff", accentBorder: "#bae6fd" },
  { key: "shoes", label: "Shoes", icon: "👟", accent: "#b45309", accentBg: "#fffbeb", accentBorder: "#fde68a" },
  { key: "accessories", label: "Accessories", icon: "👜", accent: "#059669", accentBg: "#ecfdf5", accentBorder: "#a7f3d0" },
]

function CategoryRail({
  section,
  items,
  onItemClick,
}: {
  section: (typeof SECTIONS)[number]
  items: ClothingItem[]
  onItemClick: (item: ClothingItem) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" })
  }

  return (
    <div className="relative group/rail">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: section.accentBg, border: `1px solid ${section.accentBorder}` }}
        >
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ color: "#1f2937" }}>{section.label}</h3>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
            {items.filter((i) => i.favorite).length > 0 && (
              <span style={{ color: "#f97316" }}> · {items.filter((i) => i.favorite).length} ♥</span>
            )}
          </p>
        </div>
        {/* Scroll rail line */}
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${section.accentBorder}, transparent)` }} />
      </div>

      {/* Scroll arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transform: "translate(-4px, 8px)" }}
        >
          <svg className="w-4 h-4" style={{ color: "#374151" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {canScrollRight && items.length > 3 && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transform: "translate(4px, 8px)" }}
        >
          <svg className="w-4 h-4" style={{ color: "#374151" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Items rail */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="shrink-0 group/item text-left transition-all duration-200"
            style={{ width: "120px", scrollSnapAlign: "start" }}
          >
            {/* Image card */}
            <div
              className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 transition-all duration-200"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <img
                src={item.imageData}
                alt={item.name ?? item.category}
                className="w-full h-full object-contain transition-transform duration-300 group-hover/item:scale-105"
                style={{ filter: getProductDisplayFilter() }}
              />

              {/* Favorite badge */}
              {item.favorite && (
                <div
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(249, 115, 22, 0.9)", boxShadow: "0 1px 4px rgba(249, 115, 22, 0.4)" }}
                >
                  <svg className="w-3 h-3" fill="white" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
              )}

              {/* Subtle category color accent at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, ${section.accent}40, transparent)` }}
              />
            </div>

            {/* Name */}
            <p className="text-xs font-medium truncate px-0.5" style={{ color: "#374151" }}>
              {item.name ?? item.subcategory ?? item.category}
            </p>
            {item.color && (
              <p className="text-xs truncate px-0.5 mt-0.5 flex items-center gap-1" style={{ color: "#9ca3af" }}>
                {item.colorHex && (
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ background: item.colorHex, border: "1px solid rgba(0,0,0,0.1)" }}
                  />
                )}
                {item.color}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClosetOrgView({ items }: Props) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)

  const grouped = new Map<string, ClothingItem[]>()
  for (const item of items) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  const totalItems = items.length
  const totalFavorites = items.filter((i) => i.favorite).length
  const categoryCount = grouped.size

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
        >
          <span className="text-3xl">👗</span>
        </div>
        <p className="text-base font-bold" style={{ color: "#1f2937" }}>Your wardrobe is empty</p>
        <p className="text-sm mt-1.5 max-w-[240px] mx-auto" style={{ color: "#9ca3af" }}>
          Add some clothing items to see them organized here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wardrobe overview stats */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>{totalItems}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#9ca3af" }}>Total Pieces</p>
          </div>
          <div className="w-px h-10" style={{ background: "#e5e7eb" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>{categoryCount}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#9ca3af" }}>Categories</p>
          </div>
          <div className="w-px h-10" style={{ background: "#e5e7eb" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#f97316" }}>{totalFavorites}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#9ca3af" }}>Favorites</p>
          </div>
        </div>

        {/* Category distribution bar */}
        <div className="mt-4 flex rounded-full overflow-hidden h-2.5" style={{ background: "#f3f4f6" }}>
          {SECTIONS.map((section) => {
            const count = grouped.get(section.key)?.length ?? 0
            if (count === 0) return null
            const pct = (count / totalItems) * 100
            return (
              <div
                key={section.key}
                style={{ width: `${pct}%`, background: section.accent, opacity: 0.7 }}
                title={`${section.label}: ${count}`}
              />
            )
          })}
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 justify-center">
          {SECTIONS.map((section) => {
            const count = grouped.get(section.key)?.length ?? 0
            if (count === 0) return null
            return (
              <div key={section.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: section.accent, opacity: 0.7 }} />
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  {section.label} ({count})
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category sections */}
      {SECTIONS.map((section) => {
        const categoryItems = grouped.get(section.key) ?? []
        if (categoryItems.length === 0) return null

        return (
          <CategoryRail
            key={section.key}
            section={section}
            items={categoryItems}
            onItemClick={(item) => setSelectedItem(item)}
          />
        )
      })}

      {/* Item detail sheet */}
      {selectedItem && createPortal(
        <ItemDetailSheet
          item={selectedItem as any}
          onClose={() => { setSelectedItem(null); router.refresh() }}
        />,
        document.body
      )}
    </div>
  )
}
