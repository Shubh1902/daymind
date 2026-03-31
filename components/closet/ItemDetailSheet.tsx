"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { getProductDisplayFilter } from "@/lib/imageEnhance"
import { enhanceClothingImage } from "@/lib/imageEnhance"
import EditItemSheet from "./EditItemSheet"
import FullscreenPreview from "./FullscreenPreview"
import TryOnPreview from "./TryOnPreview"

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
  lastWornAt?: string | null
  createdAt: string
}

type ExtraImage = {
  id: string
  imageData: string
  label: string | null
  sortOrder: number
}

interface Props {
  item: ClothingItem
  onClose: () => void
  onWhatGoesWith?: (item: ClothingItem) => void
}

export default function ItemDetailSheet({ item, onClose, onWhatGoesWith }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [extraImages, setExtraImages] = useState<ExtraImage[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showTryOn, setShowTryOn] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showEdit && !showFullscreen && !showTryOn) onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose, showEdit, showFullscreen, showTryOn])

  const allImages = [
    { id: "main", imageData: item.imageData, label: "Main" },
    ...extraImages,
  ]

  useEffect(() => {
    fetchExtraImages()
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchExtraImages() {
    try {
      const res = await fetch(`/api/closet/items/${item.id}/images`)
      if (res.ok) setExtraImages(await res.json())
    } catch { /* ignore */ }
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const rawUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const enhanced = await enhanceClothingImage(rawUri)
      await fetch(`/api/closet/items/${item.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: enhanced, label: null }),
      })
      await fetchExtraImages()
    } catch { /* ignore */ }
    setUploading(false)
    if (e.target) e.target.value = ""
  }

  async function deleteExtraImage(imageId: string) {
    await fetch(`/api/closet/items/${item.id}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    })
    setActiveIndex(0)
    await fetchExtraImages()
  }

  async function markWorn() {
    setActionLoading(true)
    try {
      await fetch(`/api/closet/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wearCount: item.wearCount + 1,
          lastWornAt: new Date().toISOString(),
        }),
      })
      router.refresh()
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function deleteItem() {
    if (!confirm("Remove this item from your closet?")) return
    setActionLoading(true)
    await fetch(`/api/closet/items/${item.id}`, { method: "DELETE" })
    router.refresh()
    onClose()
  }

  const daysAgo = item.lastWornAt
    ? Math.floor((Date.now() - new Date(item.lastWornAt).getTime()) / 86400000)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "#d4d4d8" }} />
        </div>

        {/* Main image viewer */}
        <div
          className="aspect-square relative mx-4 rounded-xl overflow-hidden mb-3 cursor-pointer"
          style={{ background: "#FAFAFA" }}
          onClick={() => setShowFullscreen(true)}
        >
          <img
            src={allImages[activeIndex]?.imageData}
            alt={item.name ?? item.category}
            className="w-full h-full object-contain"
            style={{ filter: getProductDisplayFilter() }}
          />

          {/* Fullscreen hint */}
          <div
            className="absolute bottom-2 right-2 p-1.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </div>

          {/* Delete extra image button */}
          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteExtraImage(extraImages[activeIndex - 1].id) }}
              className="absolute top-2 right-2 p-2 rounded-full"
              style={{ background: "rgba(244, 63, 94, 0.9)", color: "white" }}
              aria-label="Delete this photo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}

          {/* Image counter */}
          {allImages.length > 1 && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
            >
              {activeIndex + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {(allImages.length > 1 || extraImages.length < 5) && (
          <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  border: activeIndex === i ? "2px solid #f97316" : "2px solid var(--border)",
                  background: "#FAFAFA",
                  opacity: activeIndex === i ? 1 : 0.7,
                }}
              >
                <img
                  src={img.imageData}
                  alt={img.label ?? ""}
                  className="w-full h-full object-contain"
                  style={{ filter: getProductDisplayFilter() }}
                />
              </button>
            ))}

            {extraImages.length < 5 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ border: "2px dashed rgba(249, 115, 22, 0.2)", background: "rgba(249, 115, 22, 0.02)" }}
                aria-label="Add another photo"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" style={{ color: "rgba(249, 115, 22, 0.3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
          </div>
        )}

        {/* Item details */}
        <div className="px-5 pb-6">
          {/* Name + edit button */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold truncate pr-2" style={{ color: "#431407" }}>
              {item.name ?? item.subcategory ?? item.category}
            </h2>
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 rounded-lg shrink-0"
              style={{ background: "rgba(249, 115, 22, 0.08)", color: "#ea580c" }}
              aria-label="Edit item details"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              {item.category}
            </span>
            {item.subcategory && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                {item.subcategory}
              </span>
            )}
            {item.color && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" }}>
                {item.colorHex && <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: item.colorHex, border: "1px solid rgba(0,0,0,0.1)" }} />}
                {item.color}
              </span>
            )}
            {item.pattern && item.pattern !== "solid" && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                {item.pattern}
              </span>
            )}
            {item.season && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                {item.season}
              </span>
            )}
          </div>

          {/* Vibes */}
          {item.vibes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.vibes.map((v) => (
                <span key={v} className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  {v}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div
            className="flex items-center justify-around mb-5 px-4 py-3.5 rounded-xl"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
          >
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#9a3412" }}>{item.wearCount}</p>
              <p className="text-xs font-medium" style={{ color: "#c2410c" }}>Worn</p>
            </div>
            <div className="w-px h-8" style={{ background: "#fed7aa" }} />
            {daysAgo !== null && (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#9a3412" }}>{daysAgo}d</p>
                  <p className="text-xs font-medium" style={{ color: "#c2410c" }}>Last worn</p>
                </div>
                <div className="w-px h-8" style={{ background: "#fed7aa" }} />
              </>
            )}
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#9a3412" }}>{allImages.length}</p>
              <p className="text-xs font-medium" style={{ color: "#c2410c" }}>Photos</p>
            </div>
          </div>

          {/* Action buttons — clean grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {/* Mark as worn */}
            <button
              onClick={markWorn}
              disabled={actionLoading}
              className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fdba74" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Worn Today
            </button>

            {/* What goes with */}
            {onWhatGoesWith && (
              <button
                onClick={() => { onWhatGoesWith(item); onClose() }}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "#faf5ff", color: "#6d28d9", border: "1px solid #c4b5fd" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Style Match
              </button>
            )}

            {/* Try On (for applicable categories) */}
            {(item.category === "tops" || item.category === "bottoms" || item.category === "dresses") && (
              <button
                onClick={() => setShowTryOn(true)}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "#faf5ff", color: "#6d28d9", border: "1px solid #c4b5fd" }}
              >
                <span className="text-sm">👗</span>
                Try On
              </button>
            )}

            {/* Delete */}
            <button
              onClick={deleteItem}
              disabled={actionLoading}
              className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Remove
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
          >
            Close
          </button>
        </div>

        {/* Sub-modals rendered via Portal to escape this sheet's stacking context */}
        {showEdit && createPortal(
          <EditItemSheet item={item} onClose={() => { setShowEdit(false); router.refresh() }} />,
          document.body
        )}

        {showFullscreen && createPortal(
          <FullscreenPreview
            images={allImages.map((img) => ({ id: img.id, imageData: img.imageData, label: img.label ?? undefined }))}
            initialIndex={activeIndex}
            itemName={item.name ?? item.subcategory ?? item.category}
            onClose={() => setShowFullscreen(false)}
          />,
          document.body
        )}

        {showTryOn && createPortal(
          <TryOnPreview
            items={[{ id: item.id, imageData: item.imageData, category: item.category, name: item.name }]}
            onClose={() => setShowTryOn(false)}
          />,
          document.body
        )}
      </div>
    </div>
  )
}
