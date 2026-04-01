"use client"

import { getChoreEmoji, getChoreLabel } from "@/lib/household-chores"

type MemberStat = {
  name: string; color: string; slug: string
  totalMinutes: number; choreCount: number; topChore: string
}

interface Props { members: MemberStat[] }

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function MemberStatCards({ members }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {members.map((m) => (
        <div
          key={m.slug}
          className="rounded-xl p-4 animate-slide-up"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Member header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
            <span className="text-sm font-bold" style={{ color: "#1f2937" }}>{m.name}</span>
          </div>

          {/* Total time */}
          <p className="text-2xl font-bold" style={{ color: m.color }}>
            {m.totalMinutes > 0 ? formatTime(m.totalMinutes) : "—"}
          </p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>total time</p>

          {/* Chore count + top chore */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "#9ca3af" }}>Chores</span>
              <span className="text-sm font-bold" style={{ color: "#1f2937" }}>{m.choreCount}</span>
            </div>
            {m.topChore && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: "#9ca3af" }}>Top</span>
                <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  {getChoreEmoji(m.topChore)} {getChoreLabel(m.topChore)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
