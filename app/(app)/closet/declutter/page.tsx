"use client"

import DeclutterList from "@/components/closet/DeclutterList"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

export default function DeclutterPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Declutter</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Items you haven&apos;t worn lately
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <DeclutterList />
      </div>
    </div>
  )
}
