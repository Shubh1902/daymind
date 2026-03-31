"use client"

import { useState } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  subcategory: string | null
  color: string | null
  name: string | null
  favorite: boolean
}

interface Props {
  items: ClothingItem[]
}

const SECTIONS = [
  { key: "tops", label: "Hanging Rail — Tops & Shirts", icon: "👚", type: "hanger" },
  { key: "dresses", label: "Hanging Rail — Dresses", icon: "👗", type: "hanger" },
  { key: "bottoms", label: "Shelf — Bottoms", icon: "👖", type: "shelf" },
  { key: "shoes", label: "Shoe Rack", icon: "👟", type: "rack" },
  { key: "accessories", label: "Drawer — Accessories", icon: "👜", type: "drawer" },
]

export default function ClosetOrgView({ items }: Props) {
  const [openDrawer, setOpenDrawer] = useState<string | null>(null)
  const grouped = new Map<string, ClothingItem[]>()
  for (const item of items) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  return (
    <div className="space-y-4">
      {/* Closet frame */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #f5e6d3 0%, #ede0d4 100%)",
          border: "3px solid #c9b99a",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Closet top */}
        <div className="px-4 pt-3 pb-1 text-center">
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#8b7355" }}>My Wardrobe</p>
        </div>

        {SECTIONS.map((section) => {
          const categoryItems = grouped.get(section.key) ?? []
          if (categoryItems.length === 0) return null

          const isOpen = openDrawer === section.key
          const isDrawerType = section.type === "drawer"

          return (
            <div key={section.key} className="px-3 pb-2">
              {/* Section label */}
              <button
                onClick={() => isDrawerType && setOpenDrawer(isOpen ? null : section.key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 mb-1"
                style={{ cursor: isDrawerType ? "pointer" : "default" }}
              >
                <span className="text-sm">{section.icon}</span>
                <span className="text-xs font-medium" style={{ color: "#8b7355" }}>{section.label}</span>
                <span className="text-xs px-1.5 rounded-full" style={{ background: "rgba(139, 115, 85, 0.1)", color: "#8b7355" }}>
                  {categoryItems.length}
                </span>
                {isDrawerType && (
                  <svg
                    className="w-3 h-3 ml-auto transition-transform duration-200"
                    style={{ color: "#8b7355", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Hanging rail for tops/dresses */}
              {section.type === "hanger" && (
                <div className="relative">
                  {/* Rail */}
                  <div className="h-1 rounded-full mx-2 mb-1" style={{ background: "linear-gradient(90deg, #a0845c, #c4a97d, #a0845c)" }} />
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide px-1 pb-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="shrink-0 flex flex-col items-center" style={{ width: "72px" }}>
                        {/* Hanger hook */}
                        <div className="w-4 h-3 border-t-2 border-l-2 border-r-2 rounded-t-full" style={{ borderColor: "#a0845c" }} />
                        {/* Item */}
                        <div
                          className="w-16 h-20 rounded-b-lg overflow-hidden"
                          style={{ background: "#FAFAFA", border: "1px solid rgba(139, 115, 85, 0.2)", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}
                        >
                          <img
                            src={item.imageData}
                            alt={item.name ?? item.category}
                            className="w-full h-full object-contain"
                            style={{ filter: getProductDisplayFilter() }}
                          />
                        </div>
                        <p className="text-xs truncate w-full text-center mt-0.5" style={{ color: "#8b7355", fontSize: "9px" }}>
                          {item.name ?? item.subcategory ?? item.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shelf for bottoms */}
              {section.type === "shelf" && (
                <div>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 pb-1">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                        style={{ background: "#FAFAFA", border: "1px solid rgba(139, 115, 85, 0.2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                      >
                        <img
                          src={item.imageData}
                          alt={item.name ?? item.category}
                          className="w-full h-full object-contain"
                          style={{ filter: getProductDisplayFilter() }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Shelf line */}
                  <div className="h-1 rounded-full" style={{ background: "linear-gradient(90deg, #c9b99a, #d4c4a8, #c9b99a)" }} />
                </div>
              )}

              {/* Shoe rack */}
              {section.type === "rack" && (
                <div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-14 h-12 rounded-md overflow-hidden"
                        style={{ background: "#FAFAFA", border: "1px solid rgba(139, 115, 85, 0.2)" }}
                      >
                        <img
                          src={item.imageData}
                          alt={item.name ?? item.category}
                          className="w-full h-full object-contain"
                          style={{ filter: getProductDisplayFilter() }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Rack slats */}
                  <div className="flex gap-1 mt-0.5">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex-1 h-0.5 rounded-full" style={{ background: "rgba(139, 115, 85, 0.3)" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Drawer for accessories */}
              {section.type === "drawer" && (
                <div
                  className="rounded-lg overflow-hidden transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(139, 115, 85, 0.25)",
                    maxHeight: isOpen ? "200px" : "32px",
                  }}
                >
                  {/* Drawer handle */}
                  <div className="flex justify-center py-1.5">
                    <div className="w-8 h-1 rounded-full" style={{ background: "#a0845c" }} />
                  </div>
                  {isOpen && (
                    <div className="flex gap-1.5 flex-wrap px-2 pb-2 animate-slide-up">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-12 rounded-md overflow-hidden"
                          style={{ background: "#FAFAFA", border: "1px solid rgba(139, 115, 85, 0.15)" }}
                        >
                          <img
                            src={item.imageData}
                            alt={item.name ?? item.category}
                            className="w-full h-full object-contain"
                            style={{ filter: getProductDisplayFilter() }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Closet bottom */}
        <div className="h-2" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {SECTIONS.map((s) => {
          const count = grouped.get(s.key)?.length ?? 0
          if (count === 0) return null
          return (
            <span key={s.key} className="text-xs" style={{ color: "rgba(139, 115, 85, 0.7)" }}>
              {s.icon} {count} {s.label.split(" — ")[1] ?? s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
