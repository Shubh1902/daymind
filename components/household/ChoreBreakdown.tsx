"use client"

import { getChoreLabel } from "@/lib/household-chores"

type CategoryData = {
  choreType: string; emoji: string
  member1Minutes: number; member2Minutes: number
}

interface Props {
  categories: CategoryData[]
  member1: { name: string; color: string }
  member2: { name: string; color: string }
}

export default function ChoreBreakdown({ categories, member1, member2 }: Props) {
  if (categories.length === 0) return null

  const maxMinutes = Math.max(...categories.map((c) => Math.max(c.member1Minutes, c.member2Minutes)), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: "#1f2937" }}>By Category</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: member1.color }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>{member1.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: member2.color }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>{member2.name}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const total = cat.member1Minutes + cat.member2Minutes
          return (
            <div key={cat.choreType}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#374151" }}>
                  {cat.emoji} {getChoreLabel(cat.choreType)}
                </span>
                <span className="text-xs" style={{ color: "#9ca3af" }}>{total}m</span>
              </div>
              <div className="flex gap-1">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${(cat.member1Minutes / maxMinutes) * 100}%`,
                    minWidth: cat.member1Minutes > 0 ? "4px" : "0",
                    background: `linear-gradient(90deg, ${member1.color}, ${member1.color}cc)`,
                  }}
                />
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${(cat.member2Minutes / maxMinutes) * 100}%`,
                    minWidth: cat.member2Minutes > 0 ? "4px" : "0",
                    background: `linear-gradient(90deg, ${member2.color}, ${member2.color}cc)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
