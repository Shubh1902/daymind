"use client"

import { useState, useMemo } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

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
}

interface Props {
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  dresses: ClothingItem[]
}

type ViewMode = "grid" | "focus"

export default function OutfitCombos({ tops, bottoms, dresses }: Props) {
  const [view, setView] = useState<ViewMode>("grid")
  const [selectedTop, setSelectedTop] = useState<string | null>(null)
  const [selectedBottom, setSelectedBottom] = useState<string | null>(null)
  const [focusSide, setFocusSide] = useState<"top" | "bottom">("bottom") // which side is locked in focus mode

  // Generate all combos
  const allCombos = useMemo(() => {
    const combos: { top: ClothingItem; bottom: ClothingItem }[] = []
    for (const top of tops) {
      for (const bottom of bottoms) {
        combos.push({ top, bottom })
      }
    }
    return combos
  }, [tops, bottoms])

  // Filtered combos based on selection
  const filteredCombos = useMemo(() => {
    if (!selectedTop && !selectedBottom) return allCombos
    return allCombos.filter((c) => {
      if (selectedTop && c.top.id !== selectedTop) return false
      if (selectedBottom && c.bottom.id !== selectedBottom) return false
      return true
    })
  }, [allCombos, selectedTop, selectedBottom])

  const activeTop = tops.find((t) => t.id === selectedTop)
  const activeBottom = bottoms.find((b) => b.id === selectedBottom)

  if (tops.length === 0 || bottoms.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-3xl block mb-3">👕👖</span>
        <p className="text-base font-bold" style={{ color: "#1f2937" }}>Need both tops and bottoms</p>
        <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
          Add at least 1 top and 1 bottom to see combos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* View mode toggle */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: "#f3f4f6" }}>
        <button
          onClick={() => { setView("grid"); setSelectedTop(null); setSelectedBottom(null) }}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: view === "grid" ? "#ffffff" : "transparent",
            color: view === "grid" ? "#1f2937" : "#9ca3af",
            boxShadow: view === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>🔀</span> All Combos
        </button>
        <button
          onClick={() => { setView("focus"); setSelectedTop(null); setSelectedBottom(null) }}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: view === "focus" ? "#ffffff" : "transparent",
            color: view === "focus" ? "#1f2937" : "#9ca3af",
            boxShadow: view === "focus" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>🎯</span> Pick & Match
        </button>
      </div>

      {/* ═══ Grid View: All combos ═══ */}
      {view === "grid" && (
        <>
          {/* Quick filter by top or bottom */}
          {(selectedTop || selectedBottom) && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeTop && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
                  👚 {activeTop.name ?? "Top"}
                  <button onClick={() => setSelectedTop(null)} className="ml-1 opacity-60 hover:opacity-100">&times;</button>
                </span>
              )}
              {activeBottom && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                  👖 {activeBottom.name ?? "Bottom"}
                  <button onClick={() => setSelectedBottom(null)} className="ml-1 opacity-60 hover:opacity-100">&times;</button>
                </span>
              )}
              <button
                onClick={() => { setSelectedTop(null); setSelectedBottom(null) }}
                className="text-xs px-2 py-1 rounded-full"
                style={{ color: "#9ca3af" }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Combo count */}
          <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>
            {filteredCombos.length} combo{filteredCombos.length !== 1 ? "s" : ""}
          </p>

          {/* Combo grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredCombos.map((combo) => (
              <div
                key={`${combo.top.id}-${combo.bottom.id}`}
                className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
              >
                {/* Two images stacked */}
                <div className="flex flex-col">
                  {/* Top */}
                  <button
                    onClick={() => setSelectedTop(selectedTop === combo.top.id ? null : combo.top.id)}
                    className="relative aspect-[4/3] overflow-hidden transition-all"
                    style={{
                      background: "#fafafa",
                      borderBottom: "1px solid #f3f4f6",
                      outline: selectedTop === combo.top.id ? "2px solid #f97316" : "none",
                      outlineOffset: "-2px",
                    }}
                  >
                    <img
                      src={combo.top.imageData}
                      alt={combo.top.name ?? "top"}
                      className="w-full h-full object-contain"
                      style={{ filter: getProductDisplayFilter() }}
                    />
                    {combo.top.favorite && (
                      <span className="absolute top-1 right-1 text-xs">❤️</span>
                    )}
                  </button>

                  {/* Bottom */}
                  <button
                    onClick={() => setSelectedBottom(selectedBottom === combo.bottom.id ? null : combo.bottom.id)}
                    className="relative aspect-[4/3] overflow-hidden transition-all"
                    style={{
                      background: "#fafafa",
                      outline: selectedBottom === combo.bottom.id ? "2px solid #0369a1" : "none",
                      outlineOffset: "-2px",
                    }}
                  >
                    <img
                      src={combo.bottom.imageData}
                      alt={combo.bottom.name ?? "bottom"}
                      className="w-full h-full object-contain"
                      style={{ filter: getProductDisplayFilter() }}
                    />
                    {combo.bottom.favorite && (
                      <span className="absolute top-1 right-1 text-xs">❤️</span>
                    )}
                  </button>
                </div>

                {/* Labels */}
                <div className="px-2.5 py-2">
                  <p className="text-xs font-medium truncate" style={{ color: "#1f2937" }}>
                    {combo.top.name ?? combo.top.subcategory ?? "Top"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                    + {combo.bottom.name ?? combo.bottom.subcategory ?? "Bottom"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ Focus View: Pick one, see matches ═══ */}
      {view === "focus" && (
        <>
          {/* Pick which side to lock */}
          <div className="flex gap-2">
            <button
              onClick={() => { setFocusSide("bottom"); setSelectedTop(null); setSelectedBottom(null) }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: focusSide === "bottom" ? "#fff7ed" : "#f9fafb",
                color: focusSide === "bottom" ? "#9a3412" : "#9ca3af",
                border: focusSide === "bottom" ? "1.5px solid #f97316" : "1px solid #e5e7eb",
              }}
            >
              👖 Pick a bottom
            </button>
            <button
              onClick={() => { setFocusSide("top"); setSelectedTop(null); setSelectedBottom(null) }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: focusSide === "top" ? "#f0f9ff" : "#f9fafb",
                color: focusSide === "top" ? "#0369a1" : "#9ca3af",
                border: focusSide === "top" ? "1.5px solid #0369a1" : "1px solid #e5e7eb",
              }}
            >
              👚 Pick a top
            </button>
          </div>

          {/* Selected item rail */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
              {focusSide === "bottom" ? "Select a bottom" : "Select a top"}
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {(focusSide === "bottom" ? bottoms : tops).map((item) => {
                const isSelected = focusSide === "bottom"
                  ? selectedBottom === item.id
                  : selectedTop === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (focusSide === "bottom") {
                        setSelectedBottom(isSelected ? null : item.id)
                      } else {
                        setSelectedTop(isSelected ? null : item.id)
                      }
                    }}
                    className="shrink-0 flex flex-col items-center transition-all duration-200"
                    style={{ width: "80px" }}
                  >
                    <div
                      className="w-[72px] h-[72px] rounded-xl overflow-hidden mb-1 transition-all"
                      style={{
                        background: "#fafafa",
                        border: isSelected
                          ? `2.5px solid ${focusSide === "bottom" ? "#f97316" : "#0369a1"}`
                          : "2px solid #e5e7eb",
                        boxShadow: isSelected ? `0 2px 8px ${focusSide === "bottom" ? "rgba(249,115,22,0.25)" : "rgba(3,105,161,0.25)"}` : "none",
                      }}
                    >
                      <img
                        src={item.imageData}
                        alt={item.name ?? item.category}
                        className="w-full h-full object-contain"
                        style={{ filter: getProductDisplayFilter() }}
                      />
                    </div>
                    <p className="text-xs truncate w-full text-center" style={{ color: isSelected ? "#1f2937" : "#9ca3af" }}>
                      {item.name ?? item.subcategory ?? item.category}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Matching items grid */}
          {((focusSide === "bottom" && selectedBottom) || (focusSide === "top" && selectedTop)) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
                {focusSide === "bottom" ? `All tops with ${activeBottom?.name ?? "this bottom"}` : `All bottoms with ${activeTop?.name ?? "this top"}`}
              </p>

              {/* Hero selected item */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#fafafa", border: "1px solid #f3f4f6" }}>
                  <img
                    src={(focusSide === "bottom" ? activeBottom : activeTop)?.imageData}
                    alt="selected"
                    className="w-full h-full object-contain"
                    style={{ filter: getProductDisplayFilter() }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1f2937" }}>
                    {(focusSide === "bottom" ? activeBottom : activeTop)?.name ?? "Selected"}
                  </p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Pairs with {focusSide === "bottom" ? tops.length : bottoms.length} {focusSide === "bottom" ? "tops" : "bottoms"}
                  </p>
                </div>
              </div>

              {/* Match grid — show the OTHER side */}
              <div className="grid grid-cols-2 gap-3">
                {(focusSide === "bottom" ? tops : bottoms).map((match) => {
                  const top = focusSide === "bottom" ? match : activeTop!
                  const bottom = focusSide === "bottom" ? activeBottom! : match
                  return (
                    <div
                      key={match.id}
                      className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
                      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                    >
                      <div className="flex">
                        {/* Top half */}
                        <div className="flex-1 aspect-square overflow-hidden" style={{ background: "#fafafa", borderRight: "1px solid #f3f4f6" }}>
                          <img
                            src={top.imageData}
                            alt={top.name ?? "top"}
                            className="w-full h-full object-contain"
                            style={{ filter: getProductDisplayFilter() }}
                          />
                        </div>
                        {/* Bottom half */}
                        <div className="flex-1 aspect-square overflow-hidden" style={{ background: "#fafafa" }}>
                          <img
                            src={bottom.imageData}
                            alt={bottom.name ?? "bottom"}
                            className="w-full h-full object-contain"
                            style={{ filter: getProductDisplayFilter() }}
                          />
                        </div>
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-medium truncate" style={{ color: "#1f2937" }}>
                          {match.name ?? match.subcategory ?? match.category}
                        </p>
                        {match.color && (
                          <p className="text-xs truncate flex items-center gap-1" style={{ color: "#9ca3af" }}>
                            {match.colorHex && <span className="w-2 h-2 rounded-full inline-block" style={{ background: match.colorHex }} />}
                            {match.color}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prompt to select */}
          {focusSide === "bottom" && !selectedBottom && (
            <div className="text-center py-8">
              <span className="text-2xl block mb-2">👆</span>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Select a bottom above to see all matching tops</p>
            </div>
          )}
          {focusSide === "top" && !selectedTop && (
            <div className="text-center py-8">
              <span className="text-2xl block mb-2">👆</span>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Select a top above to see all matching bottoms</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
