"use client"

import { useState, useEffect, useRef } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

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

const BACKDROP_OPTIONS = [
  { id: "studio", label: "Studio", color: "#f5f5f5" },
  { id: "warm", label: "Warm", color: "#fef3c7" },
  { id: "cool", label: "Cool", color: "#e0f2fe" },
  { id: "blush", label: "Blush", color: "#fce7f3" },
  { id: "sage", label: "Sage", color: "#ecfdf5" },
  { id: "dark", label: "Dark", color: "#1f2937" },
]

export default function TryOnPreview({ items, onClose }: Props) {
  const [activeItem, setActiveItem] = useState(0)
  const [backdrop, setBackdrop] = useState("studio")
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  // AI generation state — kept for future Replicate integration
  const [aiMode, setAiMode] = useState(false)
  const [tryOnImage, setTryOnImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const currentItem = items[activeItem]
  const selectedBackdrop = BACKDROP_OPTIONS.find((b) => b.id === backdrop)!
  const isDark = backdrop === "dark"

  /* ---- Future AI Try-On (Replicate) ---- */
  async function generateAiTryOn() {
    const item = items[activeItem]
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
      if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`)
      setTryOnImage(data.tryOnImage)
    } catch (err: any) {
      setError(err?.message ?? "Could not generate try-on.")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden animate-scale-in max-h-[92vh] overflow-y-auto"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1f2937" }}>
              {aiMode ? "AI Try-On" : "Style Preview"}
            </h2>
            <p className="text-xs" style={{ color: "#6b7280" }}>
              {aiMode ? "AI generates a model wearing your clothes" : "Visualize your garment in a lookbook style"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#6b7280", background: "#f3f4f6" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Item selector (multi-item) */}
        {items.length > 1 && (
          <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => { setActiveItem(i); setTryOnImage(null); setZoom(1) }}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  border: activeItem === i ? "2px solid #f97316" : "2px solid #e5e7eb",
                  background: "#fafafa",
                  opacity: activeItem === i ? 1 : 0.6,
                }}
              >
                <img src={item.imageData} alt={item.name ?? item.category} className="w-full h-full object-contain" style={{ filter: getProductDisplayFilter() }} />
              </button>
            ))}
          </div>
        )}

        {/* ═══ AI Mode (Replicate — future) ═══ */}
        {aiMode ? (
          <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}>
            {tryOnImage ? (
              <img src={tryOnImage} alt="Virtual try-on" className="w-full aspect-[3/4] object-contain" />
            ) : loading ? (
              <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <span className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                  <span className="absolute inset-0 w-10 h-10 border-3 border-orange-300 border-b-transparent rounded-full animate-spin inline-block" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#1f2937" }}>Generating try-on...</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>This may take 30-60 seconds</p>
              </div>
            ) : error ? (
              <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 px-6">
                <span className="text-3xl">😅</span>
                <p className="text-sm text-center" style={{ color: "#dc2626" }}>{error}</p>
                <button onClick={generateAiTryOn} className="text-sm px-4 py-2 rounded-xl font-medium mt-2" style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
                  Retry
                </button>
              </div>
            ) : (
              <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3 px-6">
                <span className="text-4xl">🤖</span>
                <p className="text-sm text-center" style={{ color: "#6b7280" }}>
                  AI will dress a model with <strong style={{ color: "#1f2937" }}>{currentItem?.name ?? currentItem?.category}</strong>
                </p>
                <button onClick={generateAiTryOn} className="btn-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2">
                  <span>✨</span> Generate
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ═══ Lookbook Mode (default — editorial flat lay) ═══ */
          <>
            {/* Editorial canvas */}
            <div
              ref={canvasRef}
              className="mx-5 mb-3 rounded-xl overflow-hidden relative transition-all duration-300"
              style={{
                background: selectedBackdrop.color,
                border: "1px solid #e5e7eb",
                padding: "24px",
              }}
            >
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
                backgroundSize: "14px 14px",
              }} />

              {/* Garment image — centered flat lay */}
              <div
                className="relative rounded-lg overflow-hidden mx-auto transition-transform duration-300 ease-out"
                style={{
                  maxWidth: "280px",
                  aspectRatio: "3/4",
                  transform: `scale(${zoom})`,
                  background: "#ffffff",
                  boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)"
                    : "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src={currentItem?.imageData}
                  alt={currentItem?.name ?? "garment"}
                  className="w-full h-full object-contain"
                  style={{ filter: getProductDisplayFilter() }}
                  draggable={false}
                />
              </div>

              {/* Item name + zoom controls */}
              <div className="flex items-center justify-between mt-3 relative z-10">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg truncate max-w-[60%]"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)",
                    color: isDark ? "#ffffff" : "#1f2937",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  {currentItem?.name ?? currentItem?.category}
                </span>
                <div
                  className="flex items-center gap-1 rounded-lg px-1"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                    className="w-7 h-7 flex items-center justify-center text-sm font-bold rounded"
                    style={{ color: isDark ? "#ffffff" : "#374151" }}
                  >−</button>
                  <span className="text-xs w-8 text-center font-medium" style={{ color: isDark ? "#d1d5db" : "#6b7280" }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                    className="w-7 h-7 flex items-center justify-center text-sm font-bold rounded"
                    style={{ color: isDark ? "#ffffff" : "#374151" }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Backdrop selector */}
            <div className="px-5 mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>Backdrop</p>
              <div className="flex gap-2">
                {BACKDROP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setBackdrop(opt.id)}
                    className="flex flex-col items-center gap-1 transition-all duration-200"
                    style={{ opacity: backdrop === opt.id ? 1 : 0.5 }}
                  >
                    <div
                      className="w-8 h-8 rounded-full transition-all duration-200"
                      style={{
                        background: opt.color,
                        border: backdrop === opt.id ? "2.5px solid #f97316" : "2px solid #d1d5db",
                        boxShadow: backdrop === opt.id ? "0 0 0 2px white, 0 0 0 4px #f97316" : "none",
                      }}
                    />
                    <span className="text-xs" style={{ color: backdrop === opt.id ? "#f97316" : "#9ca3af", fontWeight: backdrop === opt.id ? 600 : 400 }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom actions */}
        <div className="px-5 pb-5">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAiMode(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
              style={{
                background: !aiMode ? "#fff7ed" : "#f9fafb",
                color: !aiMode ? "#9a3412" : "#9ca3af",
                border: !aiMode ? "1.5px solid #fdba74" : "1px solid #e5e7eb",
              }}
            >
              <span>🖼️</span> Lookbook
            </button>
            <button
              onClick={() => setAiMode(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
              style={{
                background: aiMode ? "#faf5ff" : "#f9fafb",
                color: aiMode ? "#7c3aed" : "#9ca3af",
                border: aiMode ? "1.5px solid #c4b5fd" : "1px solid #e5e7eb",
              }}
            >
              <span>🤖</span> AI Try-On
            </button>
          </div>

          {/* AI result actions */}
          {aiMode && tryOnImage && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={generateAiTryOn}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl"
                style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = tryOnImage
                  a.download = `tryon-${currentItem?.name ?? "outfit"}.png`
                  a.click()
                }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Save
              </button>
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
