"use client"

import { useRef, useState, useCallback } from "react"
import { refineClothingImageAI } from "@/lib/imageEnhance"
import { getProductDisplayFilter } from "@/lib/imageEnhance"

type UploadedPhoto = {
  id: string
  dataUri: string
  categorizing: boolean
  category?: string
  subcategory?: string
  color?: string
  colorHex?: string
  pattern?: string
  season?: string
  name?: string
  vibes?: string[]
  error?: string
  usedAI?: boolean
  refining?: boolean
}

interface GalleryUploadProps {
  onAllSaved: () => void
}

export default function GalleryUpload({ onAllSaved }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)

  function readFileAsDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    setProcessingCount((c) => c + imageFiles.length)

    // Process all images concurrently
    await Promise.all(
      imageFiles.map(async (file) => {
        const id = crypto.randomUUID()
        try {
          // Read file to data URI
          const rawDataUri = await readFileAsDataUri(file)

          // Add with raw preview immediately
          const photo: UploadedPhoto = { id, dataUri: rawDataUri, categorizing: true, refining: true }
          setPhotos((prev) => [...prev, photo])

          // AI-powered refinement (bg removal + wrinkle smoothing + studio lighting)
          const { refined: enhancedDataUri, usedAI } = await refineClothingImageAI(rawDataUri)

          // Update with enhanced version
          setPhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, dataUri: enhancedDataUri, refining: false, usedAI } : p))
          )

          // Auto-categorize
          await categorizePhoto(id, enhancedDataUri)
        } catch {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, categorizing: false, error: "Failed to process" }
                : p
            )
          )
        } finally {
          setProcessingCount((c) => c - 1)
        }
      })
    )
  }, [])

  async function categorizePhoto(id: string, dataUri: string) {
    try {
      const res = await fetch("/api/closet/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUri }),
      })

      if (!res.ok) throw new Error("Categorization failed")

      const data = await res.json()
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                categorizing: false,
                category: data.category,
                subcategory: data.subcategory,
                color: data.color,
                colorHex: data.colorHex,
                pattern: data.pattern,
                season: data.season,
                name: data.name,
                vibes: data.vibes,
              }
            : p
        )
      )
    } catch {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, categorizing: false, error: "Could not categorize" }
            : p
        )
      )
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePhotoCategory(id: string, category: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, category } : p))
    )
  }

  async function saveAllPhotos() {
    const readyPhotos = photos.filter((p) => !p.categorizing && !p.error && p.category)
    if (readyPhotos.length === 0) return

    setSaving(true)
    try {
      await Promise.all(
        readyPhotos.map((p) =>
          fetch("/api/closet/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: p.dataUri,
              category: p.category,
              subcategory: p.subcategory,
              color: p.color,
              colorHex: p.colorHex,
              pattern: p.pattern,
              season: p.season,
              name: p.name,
              vibes: p.vibes,
            }),
          })
        )
      )
      setPhotos([])
      onAllSaved()
    } catch {
      // Keep photos on error
    } finally {
      setSaving(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      // Reset so the same files can be re-selected
      e.target.value = ""
    }
  }

  const readyCount = photos.filter((p) => !p.categorizing && !p.error && p.category).length
  const errorCount = photos.filter((p) => p.error).length
  const categorizingCount = photos.filter((p) => p.categorizing).length

  return (
    <div className="flex flex-col gap-4">
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative rounded-2xl cursor-pointer transition-all duration-200"
        style={{
          background: dragActive
            ? "rgba(249, 115, 22, 0.08)"
            : "rgba(249, 115, 22, 0.02)",
          border: dragActive
            ? "2px dashed rgba(249, 115, 22, 0.5)"
            : "2px dashed rgba(249, 115, 22, 0.15)",
          padding: "2.5rem 1.5rem",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          {/* Upload icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200"
            style={{
              background: dragActive
                ? "rgba(249, 115, 22, 0.15)"
                : "rgba(249, 115, 22, 0.06)",
              border: "1px solid rgba(249, 115, 22, 0.15)",
            }}
          >
            <svg
              className="w-8 h-8 transition-transform duration-200"
              style={{
                color: dragActive ? "#ea580c" : "rgba(249, 115, 22, 0.5)",
                transform: dragActive ? "translateY(-2px)" : "none",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold mb-1" style={{ color: "#431407" }}>
            {dragActive ? "Drop your photos here" : "Upload from gallery"}
          </p>
          <p className="text-xs mb-4" style={{ color: "rgba(249, 115, 22, 0.45)" }}>
            Select multiple photos at once — AI will enhance &amp; categorize all of them
          </p>

          {/* Browse button */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              color: "white",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            Browse Photos
          </div>

          {/* Supported formats */}
          <p className="text-xs mt-3" style={{ color: "rgba(249, 115, 22, 0.3)" }}>
            JPG, PNG, HEIC, WebP supported
          </p>
        </div>

        {/* Processing indicator overlay */}
        {processingCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: "rgba(249, 115, 22, 0.1)" }}>
            <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium" style={{ color: "#ea580c" }}>
              Processing {processingCount}...
            </span>
          </div>
        )}
      </div>

      {/* Photo results */}
      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Header with status + save button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "rgba(234, 88, 12, 0.8)" }}>
                Uploaded ({photos.length})
              </h3>
              <div className="flex gap-2 mt-0.5">
                {categorizingCount > 0 && (
                  <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                    {categorizingCount} analyzing...
                  </span>
                )}
                {readyCount > 0 && (
                  <span className="text-xs" style={{ color: "rgba(34, 197, 94, 0.7)" }}>
                    {readyCount} ready
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-xs" style={{ color: "#fb7185" }}>
                    {errorCount} failed
                  </span>
                )}
              </div>
            </div>
            {readyCount > 0 && (
              <button
                onClick={saveAllPhotos}
                disabled={saving}
                className="btn-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Save {readyCount} to Closet
              </button>
            )}
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl overflow-hidden relative"
                style={{
                  border: photo.error
                    ? "2px solid rgba(244, 63, 94, 0.4)"
                    : photo.categorizing
                    ? "2px solid rgba(249, 115, 22, 0.3)"
                    : "2px solid rgba(34, 197, 94, 0.4)",
                }}
              >
                <div className="aspect-square overflow-hidden flex items-center justify-center" style={{ background: "#FAFAFA" }}>
                  <img
                    src={photo.dataUri}
                    alt={photo.name ?? "Uploaded clothing"}
                    className="w-full h-full object-contain"
                    style={{ filter: getProductDisplayFilter() }}
                  />
                </div>

                {/* AI badge */}
                {photo.usedAI && !photo.categorizing && !photo.refining && (
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium z-10"
                    style={{ background: "rgba(168, 85, 247, 0.9)", color: "white" }}
                  >
                    ✨ AI
                  </div>
                )}

                {/* Status overlay */}
                <div
                  className="absolute inset-0 flex items-end"
                  style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))" }}
                >
                  <div className="p-2 w-full">
                    {photo.refining && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-purple-200">AI refining...</span>
                      </div>
                    )}
                    {photo.categorizing && !photo.refining && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-white/80">Analyzing...</span>
                      </div>
                    )}
                    {photo.error && (
                      <span className="text-xs text-red-300">{photo.error}</span>
                    )}
                    {!photo.categorizing && !photo.error && (
                      <div>
                        <p className="text-xs font-medium text-white truncate">
                          {photo.name}
                        </p>
                        <select
                          value={photo.category ?? ""}
                          onChange={(e) => updatePhotoCategory(photo.id, e.target.value)}
                          className="mt-1 w-full text-xs rounded px-1 py-0.5"
                          style={{
                            background: "rgba(255,255,255,0.15)",
                            color: "white",
                            border: "none",
                          }}
                        >
                          <option value="tops">Tops</option>
                          <option value="bottoms">Bottoms</option>
                          <option value="dresses">Dresses</option>
                          <option value="shoes">Shoes</option>
                          <option value="accessories">Accessories</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add more button */}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200"
              style={{
                border: "2px dashed rgba(249, 115, 22, 0.2)",
                background: "rgba(249, 115, 22, 0.02)",
              }}
            >
              <svg className="w-6 h-6" style={{ color: "rgba(249, 115, 22, 0.3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs" style={{ color: "rgba(249, 115, 22, 0.35)" }}>Add more</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
