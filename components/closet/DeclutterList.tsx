"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type DeclutterItem = {
  id: string
  imageData: string
  category: string
  name: string | null
  color: string | null
  wearCount: number
  reason: string
}

export default function DeclutterList() {
  const router = useRouter()
  const [items, setItems] = useState<DeclutterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  async function fetchDeclutter() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/closet/declutter")
      if (res.ok) setItems(await res.json())
      else throw new Error()
    } catch {
      setError("Could not load declutter suggestions. Please try again.")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDeclutter()
  }, [])

  async function removeItem(id: string) {
    if (!confirm("Donate this item? This will permanently remove it from your closet.")) return
    setRemovingIds((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/closet/items/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      router.refresh()
    } catch {
      // Keep item in list if delete failed
    }
    setRemovingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function keepItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-3" style={{ color: "#fb7185" }}>{error}</p>
        <button
          onClick={fetchDeclutter}
          className="text-sm px-4 py-2 rounded-xl font-medium"
          style={{ background: "rgba(249, 115, 22, 0.08)", color: "#ea580c" }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 animate-scale-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.15)" }}
        >
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-lg font-semibold" style={{ color: "rgba(34, 197, 94, 0.8)" }}>
          Your closet is well-loved!
        </p>
        <p className="text-sm mt-1" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
          No items flagged for decluttering
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
        {items.length} items you might want to reconsider
      </p>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl animate-slide-up"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              opacity: removingIds.has(item.id) ? 0.3 : 1,
              animationDelay: `${i * 40}ms`,
            }}
          >
            <img
              src={item.imageData}
              alt={item.name ?? item.category}
              className="w-16 h-16 rounded-lg object-contain shrink-0"
              style={{ background: "#FAFAFA", filter: getProductDisplayFilter() }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#431407" }}>
                {item.name ?? item.category}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>
                {item.reason}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => keepItem(item.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200"
                style={{ background: "rgba(34, 197, 94, 0.08)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.2)" }}
              >
                Keep
              </button>
              <button
                onClick={() => removeItem(item.id)}
                disabled={removingIds.has(item.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200"
                style={{ background: "rgba(244, 63, 94, 0.08)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.2)" }}
              >
                Donate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
