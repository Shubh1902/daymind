"use client"

type MemberStat = { name: string; color: string; slug: string; streak: number }

interface Props { members: MemberStat[] }

export default function StreakCards({ members }: Props) {
  return (
    <div className="flex gap-3">
      {members.map((m) => (
        <div
          key={m.slug}
          className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all"
          style={{
            background: m.streak >= 3 ? `${m.color}10` : "#f9fafb",
            border: m.streak >= 3 ? `1px solid ${m.color}30` : "1px solid #e5e7eb",
          }}
        >
          <span className="text-lg">{m.streak >= 3 ? "🔥" : m.streak > 0 ? "✨" : "💤"}</span>
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: m.streak > 0 ? m.color : "#d1d5db" }}>
              {m.streak}
            </p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              {m.streak === 1 ? "day" : "days"} streak
            </p>
          </div>
          <span className="text-xs font-medium ml-auto" style={{ color: "#9ca3af" }}>{m.name}</span>
        </div>
      ))}
    </div>
  )
}
