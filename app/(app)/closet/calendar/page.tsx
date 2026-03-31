"use client"

import OutfitCalendar from "@/components/closet/OutfitCalendar"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

export default function CalendarPage() {
  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Outfit Calendar</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Track what you wear &middot; Avoid repeats
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <OutfitCalendar />
      </div>
    </div>
  )
}
