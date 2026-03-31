"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type CalendarEntry = {
  id: string
  date: string
  notes: string | null
  outfit: {
    id: string
    name: string | null
    items: { clothingItem: { id: string; imageData: string; name: string | null; category: string } }[]
  } | null
}

export default function OutfitCalendar() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true)
      try {
        const res = await fetch(`/api/closet/calendar?month=${monthStr}`)
        if (res.ok) setEntries(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchEntries()
  }, [monthStr])

  const entryMap = new Map<number, CalendarEntry>()
  for (const entry of entries) {
    const day = new Date(entry.date).getDate()
    entryMap.set(day, entry)
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/closet/calendar/${id}`, { method: "DELETE" })
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setSelectedDay(null)
  }

  const selectedEntry = selectedDay ? entryMap.get(selectedDay) : null
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold" style={{ color: "#431407" }}>
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-lg" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const entry = entryMap.get(day)
            const isToday = isCurrentMonth && day === today.getDate()
            const isSelected = selectedDay === day
            const hasOutfit = !!entry?.outfit

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative"
                style={{
                  background: isSelected
                    ? "rgba(249, 115, 22, 0.15)"
                    : hasOutfit
                    ? "rgba(168, 85, 247, 0.06)"
                    : "transparent",
                  border: isToday
                    ? "2px solid #f97316"
                    : isSelected
                    ? "1px solid rgba(249, 115, 22, 0.3)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: isToday ? "#ea580c" : "#431407" }}
                >
                  {day}
                </span>
                {hasOutfit && (
                  <div className="flex -space-x-1">
                    {entry!.outfit!.items.slice(0, 3).map((oi) => (
                      <div
                        key={oi.clothingItem.id}
                        className="w-3 h-3 rounded-full border border-white"
                        style={{
                          backgroundImage: `url(${oi.clothingItem.imageData})`,
                          backgroundSize: "cover",
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected day detail */}
      {selectedDay && (
        <div
          className="mt-4 rounded-xl p-4 animate-slide-up"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "#431407" }}>
              {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedEntry && (
              <button
                onClick={() => deleteEntry(selectedEntry.id)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: "#fb7185", background: "rgba(244, 63, 94, 0.08)" }}
              >
                Remove
              </button>
            )}
          </div>

          {selectedEntry?.outfit ? (
            <div>
              <p className="text-xs mb-2" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                {selectedEntry.outfit.name ?? "Outfit"}
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {selectedEntry.outfit.items.map((oi) => (
                  <div key={oi.clothingItem.id} className="shrink-0 w-16 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <img src={oi.clothingItem.imageData} alt={oi.clothingItem.name ?? ""} className="w-full aspect-square object-cover" />
                  </div>
                ))}
              </div>
              {selectedEntry.notes && (
                <p className="text-xs mt-2 italic" style={{ color: "rgba(249, 115, 22, 0.4)" }}>
                  {selectedEntry.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "rgba(249, 115, 22, 0.35)" }}>
              No outfit logged for this day
            </p>
          )}
        </div>
      )}
    </div>
  )
}
