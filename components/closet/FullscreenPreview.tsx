"use client"

import { useState, useEffect, useCallback } from "react"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type ImageItem = {
  id: string
  imageData: string
  label?: string | null
}

interface Props {
  images: ImageItem[]
  initialIndex?: number
  itemName?: string
  onClose: () => void
}

export default function FullscreenPreview({ images, initialIndex = 0, itemName, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const goNext = useCallback(() => {
    if (activeIndex < images.length - 1) setActiveIndex((i) => i + 1)
  }, [activeIndex, images.length])

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveIndex((i) => i - 1)
  }, [activeIndex])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [goNext, goPrev, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = e.changedTouches[0].clientX - touchStart
    if (diff > 60) goPrev()
    else if (diff < -60) goNext()
    setTouchStart(null)
  }

  const currentImage = images[activeIndex]
  if (!currentImage) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col animate-fade-in"
      style={{ background: "#000" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="min-w-0">
          {itemName && (
            <p className="text-sm font-medium text-white truncate">{itemName}</p>
          )}
          {images.length > 1 && (
            <p className="text-xs text-white/50">
              {activeIndex + 1} of {images.length}
              {currentImage.label ? ` · ${currentImage.label}` : ""}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full shrink-0"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setZoomed(!zoomed)}
      >
        <img
          src={currentImage.imageData}
          alt={itemName ?? "Clothing preview"}
          className="transition-transform duration-300 ease-out"
          style={{
            maxWidth: zoomed ? "150%" : "100%",
            maxHeight: zoomed ? "150%" : "100%",
            objectFit: "contain",
            filter: getProductDisplayFilter(),
            cursor: zoomed ? "zoom-out" : "zoom-in",
            transform: zoomed ? "scale(1.5)" : "scale(1)",
          }}
        />

        {/* Navigation arrows (desktop) */}
        {images.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {activeIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 shrink-0" style={{ background: "rgba(0,0,0,0.5)" }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="w-2 h-2 rounded-full transition-all duration-200"
              style={{
                background: i === activeIndex ? "#f97316" : "rgba(255,255,255,0.3)",
                transform: i === activeIndex ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full opacity-50 pointer-events-none" style={{ background: "rgba(0,0,0,0.6)" }}>
        <p className="text-xs text-white">{zoomed ? "Tap to zoom out" : "Tap to zoom in"} · Swipe for next</p>
      </div>
    </div>
  )
}
