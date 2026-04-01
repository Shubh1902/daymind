"use client"

import { useState, useEffect } from "react"

type ClothingItem = {
  id: string
  imageData: string
  category: string
  name: string | null
}

interface Props {
  items: ClothingItem[]
  onClose: () => void
}

export default function TryOnPreview({ items, onClose }: Props) {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState(0)

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

  async function generateTryOn(garmentIndex?: number) {
    const idx = garmentIndex ?? activeItem
    const item = items[idx]
    if (!item) return

    setLoading(true)
    setError(null)
    setTryOnImage(null)

    try {
      const isBase64 = item.imageData?.startsWith("data:")
      const res = await fetch("/api/closet/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isBase64 ? { garmentImage: item.imageData } : { garmentItemId: item.id }),
          category: item.category,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      setTryOnImage(data.tryOnImage)
    } catch (err: any) {
      setError(err?.message ?? "Could not generate try-on. Please try again later.")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#431407" }}>Virtual Try-On</h2>
            <p className="text-xs" style={{ color: "#9a3412" }}>AI generates a model wearing your clothes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: "#9a3412" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Item selector */}
        {items.length > 1 && (
          <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => { setActiveItem(i); setTryOnImage(null) }}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  border: activeItem === i ? "2px solid #f97316" : "2px solid var(--border)",
                  background: "#FAFAFA",
                  opacity: activeItem === i ? 1 : 0.6,
                }}
              >
                <img src={item.imageData} alt={item.name ?? item.category} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}

        {/* Try-on result area */}
        <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ background: "#FAFAFA", border: "1px solid var(--border)" }}>
          {tryOnImage ? (
            <img
              src={tryOnImage}
              alt="Virtual try-on"
              className="w-full aspect-[3/4] object-contain"
            />
          ) : loading ? (
            <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <span className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                <span className="absolute inset-0 w-10 h-10 border-3 border-orange-300 border-b-transparent rounded-full animate-spin inline-block" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "#431407" }}>Generating try-on...</p>
                <p className="text-xs mt-1" style={{ color: "#9a3412" }}>AI is dressing a model with your garment</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 px-4">
              <span className="text-3xl">😅</span>
              <p className="text-sm text-center" style={{ color: "#dc2626" }}>{error}</p>
              <button
                onClick={() => generateTryOn()}
                className="text-sm px-4 py-2 rounded-xl font-medium mt-2"
                style={{ background: "rgba(249, 115, 22, 0.1)", color: "#ea580c" }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.08)" }}>
                <span className="text-4xl">👗</span>
              </div>
              <p className="text-sm" style={{ color: "#9a3412" }}>
                See how <strong style={{ color: "#431407" }}>{items[activeItem]?.name ?? items[activeItem]?.category}</strong> looks on a model
              </p>
              <button
                onClick={() => generateTryOn()}
                className="btn-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                <span>✨</span>
                Generate Try-On
              </button>
            </div>
          )}
        </div>

        {/* Action buttons when we have a result */}
        {tryOnImage && (
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={() => generateTryOn()}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl"
              style={{ background: "rgba(249, 115, 22, 0.08)", color: "#ea580c", border: "1px solid rgba(249, 115, 22, 0.2)" }}
            >
              Regenerate
            </button>
            <button
              onClick={async () => {
                // Download the try-on image
                const a = document.createElement("a")
                a.href = tryOnImage
                a.download = `tryon-${items[activeItem]?.name ?? "outfit"}.png`
                a.click()
              }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              style={{ background: "rgba(56, 189, 248, 0.08)", color: "#0284c7", border: "1px solid rgba(56, 189, 248, 0.2)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Save
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(tryOnImage)
                  const blob = await res.blob()
                  const file = new File([blob], "tryon.png", { type: "image/png" })
                  if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ title: "My Try-On", files: [file] })
                  }
                } catch { /* ignore */ }
              }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              style={{ background: "rgba(34, 197, 94, 0.08)", color: "#047857", border: "1px solid rgba(34, 197, 94, 0.2)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
