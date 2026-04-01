"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  wearCount: number
}

interface Props {
  item: ClothingItem
  onClose: () => void
}

const CATEGORIES = ["tops", "bottoms", "dresses", "shoes", "accessories"]
const PATTERNS = ["solid", "striped", "plaid", "floral", "polka-dot", "graphic", "abstract", "animal-print"]
const SEASONS = ["spring", "summer", "fall", "winter", "all"]
const ALL_VIBES = ["casual", "office", "party", "date", "nightlife", "brunch", "gym", "modest", "sexy", "streetwear", "vacation"]

export default function EditItemSheet({ item, onClose }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(item.name ?? "")
  const [category, setCategory] = useState(item.category)
  const [subcategory, setSubcategory] = useState(item.subcategory ?? "")
  const [color, setColor] = useState(item.color ?? "")
  const [colorHex, setColorHex] = useState(item.colorHex ?? "#000000")
  const [pattern, setPattern] = useState(item.pattern ?? "solid")
  const [season, setSeason] = useState(item.season ?? "all")
  const [vibes, setVibes] = useState<string[]>(item.vibes ?? [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  function toggleVibe(v: string) {
    setVibes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/closet/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          category,
          subcategory: subcategory || null,
          color: color || null,
          colorHex,
          pattern,
          season,
          vibes,
        }),
      })
      router.refresh()
      onClose()
    } catch {
      // keep open on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: "#ffffff" }}>
          <div className="w-10 h-1 rounded-full" style={{ background: "#d4d4d8" }} />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}>
              <img
                src={item.imageData}
                alt={item.name ?? item.category}
                className="w-full h-full object-contain"
                style={{ filter: getProductDisplayFilter() }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#1f2937" }}>Edit Item</h2>
              <p className="text-xs" style={{ color: "#9ca3af" }}>Update details for this piece</p>
            </div>
          </div>

          {/* Name */}
          <label className="block mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Navy Linen Blazer"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
            />
          </label>

          {/* Category */}
          <label className="block mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm capitalize"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Subcategory */}
          <label className="block mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Subcategory</span>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. blazer, jeans, sneakers"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
            />
          </label>

          {/* Color row */}
          <div className="flex gap-3 mb-4">
            <label className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Color</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. navy blue"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
              />
            </label>
            <label className="w-20">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Hex</span>
              <div className="mt-1.5">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full h-[42px] rounded-xl cursor-pointer"
                  style={{ border: "1px solid #e5e7eb" }}
                />
              </div>
            </label>
          </div>

          {/* Pattern */}
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#6b7280" }}>Pattern</span>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    background: pattern === p ? "#fff7ed" : "#f9fafb",
                    color: pattern === p ? "#9a3412" : "#6b7280",
                    border: pattern === p ? "1.5px solid #f97316" : "1px solid #e5e7eb",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#6b7280" }}>Season</span>
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    background: season === s ? "#faf5ff" : "#f9fafb",
                    color: season === s ? "#7c3aed" : "#6b7280",
                    border: season === s ? "1.5px solid #8b5cf6" : "1px solid #e5e7eb",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Vibes */}
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#6b7280" }}>Vibes</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_VIBES.map((v) => {
                const active = vibes.includes(v)
                return (
                  <button
                    key={v}
                    onClick={() => toggleVibe(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                    style={{
                      background: active ? "#f0fdf4" : "#f9fafb",
                      color: active ? "#15803d" : "#6b7280",
                      border: active ? "1.5px solid #22c55e" : "1px solid #e5e7eb",
                    }}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
