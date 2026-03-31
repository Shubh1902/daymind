"use client"

import { useState } from "react"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(249, 115, 22, 0.2)" }} />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: "#FAFAFA" }}>
              <img
                src={item.imageData}
                alt={item.name ?? item.category}
                className="w-full h-full object-contain"
                style={{ filter: getProductDisplayFilter() }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#431407" }}>Edit Item</h2>
              <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>Update details for this piece</p>
            </div>
          </div>

          {/* Name */}
          <label className="block mb-4">
            <span className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Navy Linen Blazer"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "#431407",
              }}
            />
          </label>

          {/* Category */}
          <label className="block mb-4">
            <span className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm capitalize"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "#431407",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Subcategory */}
          <label className="block mb-4">
            <span className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Subcategory</span>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. blazer, jeans, sneakers"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "#431407",
              }}
            />
          </label>

          {/* Color row */}
          <div className="flex gap-3 mb-4">
            <label className="flex-1">
              <span className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Color</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. navy blue"
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "#431407",
                }}
              />
            </label>
            <label className="w-20">
              <span className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Hex</span>
              <div className="mt-1 relative">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full h-[42px] rounded-xl cursor-pointer border-0"
                />
              </div>
            </label>
          </div>

          {/* Pattern */}
          <div className="mb-4">
            <span className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Pattern</span>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    background: pattern === p ? "rgba(249, 115, 22, 0.12)" : "var(--surface-2)",
                    color: pattern === p ? "#ea580c" : "rgba(249, 115, 22, 0.5)",
                    border: pattern === p ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid var(--border)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div className="mb-4">
            <span className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Season</span>
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    background: season === s ? "rgba(168, 85, 247, 0.12)" : "var(--surface-2)",
                    color: season === s ? "#a855f7" : "rgba(249, 115, 22, 0.5)",
                    border: season === s ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid var(--border)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Vibes */}
          <div className="mb-6">
            <span className="text-xs font-semibold block mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>Vibes</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_VIBES.map((v) => {
                const active = vibes.includes(v)
                return (
                  <button
                    key={v}
                    onClick={() => toggleVibe(v)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                    style={{
                      background: active ? "rgba(34, 197, 94, 0.12)" : "var(--surface-2)",
                      color: active ? "#22c55e" : "rgba(249, 115, 22, 0.5)",
                      border: active ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid var(--border)",
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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: "var(--surface-2)",
                color: "rgba(249, 115, 22, 0.6)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
