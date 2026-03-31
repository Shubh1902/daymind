"use client"

import { useRef, useState, useEffect } from "react"
import { refineClothingImageAI } from "@/lib/imageEnhance"

type EnhanceStatus = "enhancing" | "ai-refining" | "done"

type DuplicateItem = {
  id: string
  name: string | null
  imageData: string
  similarityScore: number
}

type CapturedPhoto = {
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
  duplicates?: DuplicateItem[]
  enhanceStatus?: EnhanceStatus
  usedAI?: boolean
}

interface CameraCaptureProps {
  onAllSaved: () => void
}

/**
 * Immediately kills every track on a MediaStream and detaches the video element.
 * Safe to call with null/undefined — it's a no-op.
 */
function killStream(stream: MediaStream | null | undefined, videoEl?: HTMLVideoElement | null) {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
  if (videoEl) {
    videoEl.srcObject = null
  }
}

export default function CameraCapture({ onAllSaved }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraPaused, setCameraPaused] = useState(false)
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  // Bump this to force the main effect to re-run (e.g. resume after pause)
  const [cameraGeneration, setCameraGeneration] = useState(0)

  // ─── Single effect owns the entire camera lifecycle ───
  // The `active` flag closes over each effect invocation so that even
  // if getUserMedia resolves *after* cleanup has run, the stream is
  // killed immediately and never assigned to the ref.
  useEffect(() => {
    let active = true

    async function openCamera() {
      // Kill whatever was running before (e.g. previous facingMode)
      killStream(streamRef.current, videoRef.current)
      streamRef.current = null
      setCameraReady(false)

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        })

        // ── POST-AWAIT GATE ──
        // If cleanup ran while we were awaiting, kill the fresh stream
        // immediately so the camera light goes off.
        if (!active) {
          killStream(mediaStream)
          return
        }

        streamRef.current = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.onloadedmetadata = () => {
            if (active) setCameraReady(true)
          }
        }
      } catch {
        if (active) setCameraReady(false)
      }
    }

    setCameraPaused(false)
    openCamera()

    // ── CLEANUP (runs on unmount, facingMode change, or Strict-Mode remount) ──
    return () => {
      active = false
      killStream(streamRef.current, videoRef.current)
      streamRef.current = null
      setCameraReady(false)
    }
  }, [facingMode, cameraGeneration]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Pause / resume on visibility change; hard-kill on beforeunload ───
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // User switched tabs or minimised — kill camera immediately
        killStream(streamRef.current, videoRef.current)
        streamRef.current = null
        setCameraReady(false)
        setCameraPaused(true)
      }
      // We intentionally do NOT auto-restart on visibility return.
      // The user must tap "Resume Camera" to re-engage.
      // This avoids surprise camera activation when returning to the tab.
    }

    function handleBeforeUnload() {
      killStream(streamRef.current, videoRef.current)
      streamRef.current = null
    }

    // Next.js client-side navigation fires popstate before unmount
    function handlePopState() {
      killStream(streamRef.current, videoRef.current)
      streamRef.current = null
      setCameraReady(false)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      // Belt-and-suspenders: kill on this effect's own cleanup too
      killStream(streamRef.current, videoRef.current)
      streamRef.current = null
    }
  }, [])

  async function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const rawDataUri = canvas.toDataURL("image/jpeg", 0.85)
    const id = crypto.randomUUID()

    // Show raw photo immediately with "enhancing" state
    const photo: CapturedPhoto = { id, dataUri: rawDataUri, categorizing: true, enhanceStatus: "ai-refining" }
    setPhotos((prev) => [photo, ...prev])

    // AI-powered refinement (bg removal + wrinkle smoothing + studio lighting)
    // Falls back to canvas-only enhancement if AI is unavailable
    const { refined: enhancedDataUri, usedAI } = await refineClothingImageAI(rawDataUri)

    // Update with enhanced version
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, dataUri: enhancedDataUri, enhanceStatus: "done", usedAI } : p))
    )

    // Auto-categorize with the enhanced image
    categorizePhoto(id, enhancedDataUri)
  }

  async function categorizePhoto(id: string, dataUri: string) {
    try {
      const res = await fetch("/api/closet/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUri }),
      })

      if (!res.ok) throw new Error("Categorization failed")

      const data = await res.json()
      // Check for duplicates
      let duplicates: DuplicateItem[] = []
      try {
        const dupRes = await fetch("/api/closet/duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: data.category,
            subcategory: data.subcategory,
            color: data.color,
            colorHex: data.colorHex,
            pattern: data.pattern,
          }),
        })
        if (dupRes.ok) {
          const dupData = await dupRes.json()
          duplicates = dupData.duplicates ?? []
        }
      } catch { /* ignore */ }

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
                duplicates,
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

  function flipCamera() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  function resumeCamera() {
    // Bump generation to re-run the main effect and reopen camera
    setCameraGeneration((g) => g + 1)
  }

  const readyCount = photos.filter((p) => !p.categorizing && !p.error && p.category).length

  return (
    <div className="flex flex-col gap-4">
      {/* Camera viewfinder */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "#000", border: "1px solid rgba(249, 115, 22, 0.2)" }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[4/3] object-cover"
          style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: "rgba(249, 115, 22, 0.15)" }}
              >
                {cameraPaused ? (
                  <svg className="w-6 h-6" style={{ color: "#f97316" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" style={{ color: "#f97316" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </div>
              <p className="text-sm" style={{ color: "rgba(249, 115, 22, 0.6)" }}>
                {cameraPaused ? "Camera paused for privacy" : "Starting camera..."}
              </p>
              {cameraPaused && (
                <button
                  onClick={resumeCamera}
                  className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #ea580c, #f97316)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
                  }}
                >
                  Resume Camera
                </button>
              )}
            </div>
          </div>
        )}

        {/* Camera controls overlay */}
        {cameraReady && (
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-6">
            {/* Flip camera */}
            <button
              onClick={flipCamera}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(8px)",
                color: "white",
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>

            {/* Shutter button */}
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                boxShadow: "0 0 24px rgba(249, 115, 22, 0.5), inset 0 0 0 3px rgba(255, 255, 255, 0.3)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full"
                style={{ border: "2px solid rgba(255, 255, 255, 0.6)" }}
              />
            </button>

            {/* Photo count */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: photos.length > 0 ? "rgba(249, 115, 22, 0.8)" : "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(8px)",
                color: "white",
              }}
            >
              {photos.length}
            </div>
          </div>
        )}
      </div>

      {/* Captured photos strip */}
      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold"
              style={{ color: "rgba(234, 88, 12, 0.8)" }}
            >
              Captured ({photos.length})
            </h3>
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

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="shrink-0 w-32 rounded-xl overflow-hidden relative"
                style={{
                  border: photo.error
                    ? "2px solid rgba(244, 63, 94, 0.4)"
                    : photo.categorizing
                    ? "2px solid rgba(249, 115, 22, 0.3)"
                    : "2px solid rgba(34, 197, 94, 0.4)",
                }}
              >
                <img
                  src={photo.dataUri}
                  alt={photo.name ?? "Captured clothing"}
                  className="w-full aspect-square object-cover"
                />

                {/* Status overlay */}
                <div
                  className="absolute inset-0 flex items-end"
                  style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.7))" }}
                >
                  <div className="p-2 w-full">
                    {photo.enhanceStatus === "ai-refining" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-purple-200">AI refining...</span>
                      </div>
                    )}
                    {photo.categorizing && photo.enhanceStatus === "done" && (
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

                {/* AI enhanced badge */}
                {photo.usedAI && !photo.categorizing && (
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "rgba(168, 85, 247, 0.9)", color: "white" }}
                  >
                    ✨ AI
                  </div>
                )}

                {/* Duplicate warning */}
                {photo.duplicates && photo.duplicates.length > 0 && (
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "rgba(245, 158, 11, 0.9)", color: "white", top: photo.usedAI ? "28px" : "4px" }}
                    title={`Similar to: ${photo.duplicates.map((d) => d.name).join(", ")}`}
                  >
                    ⚠️ Similar
                  </div>
                )}

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
          </div>
        </div>
      )}
    </div>
  )
}
