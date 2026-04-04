"use client"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
  onRegenerate: () => void
  onBack: () => void
}

const POS_COLORS: Record<string, { color: string; bg: string }> = {
  GK: { color: "#d97706", bg: "#fef3c7" },
  DEF: { color: "#2563eb", bg: "#dbeafe" },
  MID: { color: "#16a34a", bg: "#dcfce7" },
  ATT: { color: "#dc2626", bg: "#fee2e2" },
}

function TeamColumn({ team, label, accent }: { team: TeamAssignment[]; label: string; accent: string }) {
  const gk = team.find((p) => p.role === "gk")
  const outfield = team.filter((p) => p.role === "outfield")
  const sub = team.find((p) => p.role === "sub")
  const hasDedicatedGK = gk?.position === "GK"

  // Group outfield by position
  const grouped: Record<string, TeamAssignment[]> = {}
  for (const p of outfield) {
    if (!grouped[p.position]) grouped[p.position] = []
    grouped[p.position].push(p)
  }

  const totalSkill = team.reduce((s, p) => s + p.skill, 0)

  return (
    <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "#ffffff", border: `2px solid ${accent}30` }}>
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: `${accent}12` }}>
        <span className="text-sm font-bold" style={{ color: accent }}>{label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>
          {totalSkill} pts
        </span>
      </div>

      <div className="p-2.5 space-y-1.5">
        {/* GK */}
        {gk && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
            <span className="text-xs font-bold" style={{ color: "#d97706" }}>GK</span>
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{gk.name}</span>
            <span className="text-xs font-bold" style={{ color: "#d97706" }}>{gk.skill}</span>
            {hasDedicatedGK && (
              <span title="Dedicated GK — defence boosted" className="text-xs">🛡️</span>
            )}
          </div>
        )}

        {/* Outfield grouped */}
        {["DEF", "MID", "ATT"].map((pos) => {
          const group = grouped[pos]
          if (!group?.length) return null
          const style = POS_COLORS[pos]
          return (
            <div key={pos}>
              {group.map((p) => (
                <div key={p.playerId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1" style={{ background: `${style.bg}`, border: `1px solid ${style.color}20` }}>
                  <span className="text-xs font-bold w-6 text-center" style={{ color: style.color }}>{pos}</span>
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{p.name}</span>
                  <span className="text-xs font-bold" style={{ color: style.color }}>{p.skill}</span>
                </div>
              ))}
            </div>
          )
        })}

        {/* Sub */}
        {sub && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg mt-1" style={{ background: "#f3f4f6", border: "1px dashed #d1d5db" }}>
            <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>SUB</span>
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "#6b7280" }}>{sub.name}</span>
            <span className="text-xs" style={{ color: "#9ca3af" }}>{sub.position} · {sub.skill}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeamDisplay({ teamA, teamB, balanceScore, onRegenerate, onBack }: Props) {
  return (
    <div className="space-y-4 animate-scale-in">
      {/* Balance Score */}
      <div className="text-center">
        <span
          className="inline-block text-sm font-bold px-4 py-1.5 rounded-full"
          style={{
            background: balanceScore >= 90 ? "#ecfdf5" : balanceScore >= 75 ? "#fef3c7" : "#fef2f2",
            color: balanceScore >= 90 ? "#059669" : balanceScore >= 75 ? "#d97706" : "#dc2626",
            border: `1px solid ${balanceScore >= 90 ? "#a7f3d0" : balanceScore >= 75 ? "#fde68a" : "#fecaca"}`,
          }}
        >
          {balanceScore}% balanced
        </span>
      </div>

      {/* Teams side by side */}
      <div className="flex gap-3">
        <TeamColumn team={teamA} label="Team A" accent="#f97316" />
        <TeamColumn team={teamB} label="Team B" accent="#8b5cf6" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
        >
          Back
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <span>🔄</span> Regenerate
        </button>
      </div>
    </div>
  )
}
