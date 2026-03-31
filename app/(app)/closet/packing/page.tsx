"use client"

import PackingList from "@/components/closet/PackingList"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

export default function PackingPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Packing Helper</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Capsule wardrobe for your trip
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <PackingList />
      </div>
    </div>
  )
}
