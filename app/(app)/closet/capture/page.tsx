"use client"

import { useRouter } from "next/navigation"
import CameraCapture from "@/components/closet/CameraCapture"
import Link from "next/link"

export default function CapturePage() {
  const router = useRouter()

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Add Clothes</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            Snap photos &mdash; AI will categorize them
          </p>
        </div>
        <Link
          href="/closet"
          className="text-sm font-medium px-3 py-2 rounded-xl transition-all duration-200"
          style={{
            background: "var(--surface-2)",
            color: "rgba(249, 115, 22, 0.6)",
            border: "1px solid var(--border)",
          }}
        >
          Back to Closet
        </Link>
      </div>

      {/* Camera */}
      <div className="animate-slide-up delay-100">
        <CameraCapture
          onAllSaved={() => {
            router.push("/closet")
            router.refresh()
          }}
        />
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
            Capture multiple items quickly — they&apos;ll all be analyzed in parallel
          </li>
        </ul>
      </div>
    </div>
  )
}
