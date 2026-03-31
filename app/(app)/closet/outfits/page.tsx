"use client"

import OutfitSuggestions from "@/components/closet/OutfitSuggestions"
import Link from "next/link"

export default function OutfitsPage() {
  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Outfit Ideas</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            AI-powered outfit combinations from your closet
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

      {/* Suggestions */}
      <div className="animate-slide-up delay-100">
        <OutfitSuggestions />
      </div>
    </div>
  )
}
