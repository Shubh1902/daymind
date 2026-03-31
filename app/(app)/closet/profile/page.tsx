"use client"

import StyleProfileView from "@/components/closet/StyleProfileView"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

export default function ProfilePage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Style Profile</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Discover your fashion DNA
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <StyleProfileView />
      </div>
    </div>
  )
}
