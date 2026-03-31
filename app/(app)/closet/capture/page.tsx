"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import CameraCapture from "@/components/closet/CameraCapture"
import GalleryUpload from "@/components/closet/GalleryUpload"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

type Mode = "camera" | "gallery"

export default function CapturePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("camera")

  function handleSaved() {
    router.push("/closet")
    router.refresh()
  }

  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Add Clothes</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Snap photos or upload from gallery &mdash; AI will categorize them
        </p>
      </div>

      <ClosetSubNav />

      {/* Camera / Gallery toggle */}
      <div
        className="flex gap-1 rounded-xl p-1 mb-4 animate-slide-up delay-75"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setMode("camera")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            background: mode === "camera" ? "rgba(249, 115, 22, 0.1)" : "transparent",
            color: mode === "camera" ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          Camera
        </button>
        <button
          onClick={() => setMode("gallery")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            background: mode === "gallery" ? "rgba(249, 115, 22, 0.1)" : "transparent",
            color: mode === "gallery" ? "#ea580c" : "rgba(249, 115, 22, 0.4)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          Gallery
        </button>
      </div>

      <div className="animate-slide-up delay-100">
        {mode === "camera" ? (
          <CameraCapture onAllSaved={handleSaved} />
        ) : (
          <GalleryUpload onAllSaved={handleSaved} />
        )}
      </div>

      {/* Tips */}
      <div
        className="mt-6 rounded-xl px-4 py-3 animate-slide-up delay-200"
        style={{
          background: "rgba(249, 115, 22, 0.04)",
          border: "1px solid rgba(249, 115, 22, 0.1)",
        }}
      >
        <h3 className="text-xs font-semibold mb-2" style={{ color: "rgba(234, 88, 12, 0.7)" }}>
          Tips for best results
        </h3>
        <ul className="text-xs space-y-1.5" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          <li className="flex items-start gap-2">
            <span style={{ color: "#f97316" }}>•</span>
            Lay the item flat or hang it against a plain background
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#f97316" }}>•</span>
            Make sure the whole garment is visible in the frame
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#f97316" }}>•</span>
            Good lighting helps AI detect colors accurately
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#f97316" }}>•</span>
            {mode === "camera"
              ? "Capture multiple items quickly \u2014 they\u2019ll all be analyzed in parallel"
              : "Select multiple photos at once \u2014 they\u2019ll all be enhanced & analyzed in parallel"}
          </li>
        </ul>
      </div>
    </div>
  )
}
