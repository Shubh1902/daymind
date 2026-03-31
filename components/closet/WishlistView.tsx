"use client"

import { useState, useEffect } from "react"

type WishlistItem = {
  id: string
  name: string
  category: string | null
  color: string | null
  description: string | null
  reason: string | null
  purchased: boolean
  priority: string
  createdAt: string
}

const PRIORITIES: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", label: "High" },
  medium: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", label: "Medium" },
  low: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", label: "Low" },
}

const CATEGORIES = ["tops", "bottoms", "dresses", "shoes", "accessories"]

export default function WishlistView() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [color, setColor] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [saving, setSaving] = useState(false)
  const [gapLoading, setGapLoading] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    try {
      const res = await fetch("/api/closet/wishlist")
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function addItem() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch("/api/closet/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: category || null, color: color || null, description: description || null, priority }),
      })
      setName(""); setCategory(""); setColor(""); setDescription(""); setPriority("medium"); setShowAdd(false)
      await fetchItems()
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function togglePurchased(id: string, purchased: boolean) {
    await fetch(`/api/closet/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: !purchased }),
    })
    await fetchItems()
  }

  async function deleteItem(id: string) {
    await fetch(`/api/closet/wishlist/${id}`, { method: "DELETE" })
    await fetchItems()
  }

  async function addFromGapAnalysis() {
    setGapLoading(true)
    try {
      const res = await fetch("/api/closet/gap-analysis", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        const suggestions: string[] = data.suggestions ?? []
        for (const sug of suggestions.slice(0, 5)) {
          await fetch("/api/closet/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: sug, reason: "gap analysis", priority: "medium" }),
          })
        }
        await fetchItems()
      }
    } catch { /* ignore */ }
    setGapLoading(false)
  }

  const unpurchased = items.filter((i) => !i.purchased)
  const purchased = items.filter((i) => i.purchased)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="flex-1 btn-primary text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Item
        </button>
        <button
          onClick={addFromGapAnalysis}
          disabled={gapLoading}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "rgba(168, 85, 247, 0.08)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.2)" }}
        >
          {gapLoading ? (
            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>✨</span>
          )}
          AI Gap Analysis
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl p-4 animate-slide-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What do you need? e.g. White sneakers"
            className="w-full px-3 py-2.5 rounded-xl text-sm mb-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#431407" }}
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm capitalize"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#431407" }}
            >
              <option value="">Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Color"
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#431407" }}
            />
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-xl text-sm mb-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#431407" }}
          />
          <div className="flex gap-1.5 mb-3">
            {Object.entries(PRIORITIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setPriority(key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: priority === key ? val.bg : "transparent",
                  color: priority === key ? val.color : "rgba(249, 115, 22, 0.4)",
                  border: priority === key ? `1px solid ${val.color}33` : "1px solid var(--border)",
                }}
              >
                {val.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: "var(--surface)", color: "rgba(249, 115, 22, 0.5)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button onClick={addItem} disabled={saving || !name.trim()} className="flex-1 btn-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Adding..." : "Add to Wishlist"}
            </button>
          </div>
        </div>
      )}

      {/* Wishlist items */}
      {unpurchased.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🛍️</p>
          <p className="text-sm font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>Wishlist is empty</p>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.4)" }}>Add items manually or let AI find wardrobe gaps</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unpurchased.map((item) => {
            const pri = PRIORITIES[item.priority] ?? PRIORITIES.medium
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <button
                  onClick={() => togglePurchased(item.id, item.purchased)}
                  className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                  style={{ borderColor: "rgba(249, 115, 22, 0.3)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#431407" }}>{item.name}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {item.category && (
                      <span className="text-xs capitalize" style={{ color: "rgba(249, 115, 22, 0.5)" }}>{item.category}</span>
                    )}
                    {item.color && (
                      <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.4)" }}>· {item.color}</span>
                    )}
                    {item.reason && item.reason !== "manual" && (
                      <span className="text-xs px-1.5 rounded-full" style={{ background: "rgba(168, 85, 247, 0.08)", color: "#a855f7" }}>
                        {item.reason}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: pri.bg, color: pri.color }}>
                  {pri.label}
                </span>
                <button onClick={() => deleteItem(item.id)} className="shrink-0" style={{ color: "rgba(249, 115, 22, 0.3)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Purchased items */}
      {purchased.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2" style={{ color: "rgba(34, 197, 94, 0.7)" }}>
            ✓ Purchased ({purchased.length})
          </h3>
          <div className="space-y-1.5">
            {purchased.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: "rgba(34, 197, 94, 0.04)" }}
              >
                <button
                  onClick={() => togglePurchased(item.id, item.purchased)}
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <p className="text-sm line-through flex-1" style={{ color: "rgba(249, 115, 22, 0.4)" }}>{item.name}</p>
                <button onClick={() => deleteItem(item.id)} style={{ color: "rgba(249, 115, 22, 0.2)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
