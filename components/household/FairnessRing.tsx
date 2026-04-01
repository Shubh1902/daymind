"use client"

type MemberStat = { name: string; color: string; totalEffortPoints: number }

interface Props {
  members: MemberStat[]
  fairness: { member1Pct: number; member2Pct: number; isBalanced: boolean }
}

export default function FairnessRing({ members, fairness }: Props) {
  const m1 = members[0]
  const m2 = members[1]
  const total = (m1?.totalEffortPoints ?? 0) + (m2?.totalEffortPoints ?? 0)
  const isEmpty = total === 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const m1Arc = isEmpty ? circumference * 0.5 : circumference * (fairness.member1Pct / 100)
  const m2Arc = circumference - m1Arc

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          {/* Member 1 arc */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={isEmpty ? "#e5e7eb" : (m1?.color ?? "#f97316")}
            strokeWidth="20"
            strokeDasharray={`${m1Arc} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          {/* Member 2 arc */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={isEmpty ? "#e5e7eb" : (m2?.color ?? "#8b5cf6")}
            strokeWidth="20"
            strokeDasharray={`${m2Arc} ${circumference}`}
            strokeDashoffset={-m1Arc}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isEmpty ? (
            <p className="text-sm font-medium" style={{ color: "#9ca3af" }}>No data yet</p>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold" style={{ color: m1?.color }}>{fairness.member1Pct}%</span>
                <span className="text-sm" style={{ color: "#d1d5db" }}>/</span>
                <span className="text-xl font-bold" style={{ color: m2?.color }}>{fairness.member2Pct}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: m1?.color }}>{m1?.name}</span>
                <span className="text-xs" style={{ color: "#d1d5db" }}>&bull;</span>
                <span className="text-xs" style={{ color: m2?.color }}>{m2?.name}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance indicator */}
      {!isEmpty && (
        <div className="mt-2">
          {fairness.isBalanced ? (
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
              ✅ Nicely balanced!
            </span>
          ) : (
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              {fairness.member1Pct > fairness.member2Pct ? m1?.name : m2?.name} is doing more
            </span>
          )}
        </div>
      )}

      <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>Effort-Weighted Fairness</p>
    </div>
  )
}
