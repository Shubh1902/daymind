"use client"

import { useState } from "react"
import RecordResult from "./RecordResult"
import FormationView from "./FormationView"
import PlayerDetailModal from "./PlayerDetailModal"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

type FullPlayer = {
  id: string; name: string; position: string; positions?: string[]; aliases?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

interface Props {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
  gameId: string
  allPlayers?: FullPlayer[]
  jerseyA?: string
  jerseyB?: string
  onRefresh?: () => void
  onRegenerate: () => void
  onBack: () => void
}

import { getPositionColor, toBalancerPosition } from "@/lib/football-positions"
import { getJerseyColor } from "@/lib/football-jersey"

const AREA_COLORS: Record<string, { color: string; bg: string }> = {
  GK: { color: "#d97706", bg: "#fef3c7" },
  DEF: { color: "#2563eb", bg: "#dbeafe" },
  MID: { color: "#16a34a", bg: "#dcfce7" },
  ATT: { color: "#dc2626", bg: "#fee2e2" },
}

function TeamColumn({ team, label, accent, allPlayers, onPlayerClick }: { team: TeamAssignment[]; label: string; accent: string; allPlayers?: FullPlayer[]; onPlayerClick?: (p: FullPlayer) => void }) {
  const gk = team.find((p) => p.role === "gk")
  const outfield = team.filter((p) => p.role === "outfield")
  const subs = team.filter((p) => p.role === "sub")
  const hasDedicatedGK = (gk as any)?.dedicatedGK ?? (gk ? toBalancerPosition(gk.position) === "GK" : false)

  // Group outfield by area (DEF/MID/ATT)
  const grouped: Record<string, TeamAssignment[]> = {}
  for (const p of outfield) {
    const area = toBalancerPosition(p.position)
    if (!grouped[area]) grouped[area] = []
    grouped[area].push(p)
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
            {hasDedicatedGK ? (
              <span title="Dedicated GK — defence boosted" className="text-xs">🛡️</span>
            ) : (
              <span title="Rotation GK" className="text-[9px] px-1 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>ROT</span>
            )}
          </div>
        )}

        {/* Outfield grouped */}
        {["DEF", "MID", "ATT"].map((pos) => {
          const group = grouped[pos]
          if (!group?.length) return null
          const style = AREA_COLORS[pos]
          return (
            <div key={pos}>
              {group.map((p) => {
                const pc = getPositionColor(p.position)
                return (
                  <div key={p.playerId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1" style={{ background: `${style.bg}`, border: `1px solid ${style.color}20` }}>
                    <span className="text-[10px] font-bold w-8 text-center" style={{ color: pc.color }}>{p.position}</span>
                    <button
                      onClick={() => { const full = allPlayers?.find((fp) => fp.id === p.playerId); if (full && onPlayerClick) onPlayerClick(full) }}
                      className="text-xs font-medium flex-1 truncate text-left hover:underline decoration-dotted underline-offset-2"
                      style={{ color: "#1f2937" }}
                    >{p.name}</button>
                    <span className="text-xs font-bold" style={{ color: style.color }}>{p.skill}</span>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Subs */}
        {subs.map((sub) => (
          <div key={sub.playerId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mt-1" style={{ background: "#f3f4f6", border: "1px dashed #d1d5db" }}>
            <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>SUB</span>
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "#6b7280" }}>{sub.name}</span>
            <span className="text-xs" style={{ color: "#9ca3af" }}>{sub.position} · {sub.skill}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TeamDisplay({ teamA, teamB, balanceScore, gameId, allPlayers, jerseyA = "orange", jerseyB = "purple", onRefresh, onRegenerate, onBack }: Props) {
  const jA = getJerseyColor(jerseyA)
  const jB = getJerseyColor(jerseyB)
  const [showRecord, setShowRecord] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list")
  const [editingPlayer, setEditingPlayer] = useState<FullPlayer | null>(null)

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

      {/* View toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setViewMode("list")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: viewMode === "list" ? "#fff7ed" : "#f9fafb", color: viewMode === "list" ? "#9a3412" : "#9ca3af", border: viewMode === "list" ? "1.5px solid #f97316" : "1px solid #e5e7eb" }}
        >
          📋 List
        </button>
        <button
          onClick={() => setViewMode("pitch")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: viewMode === "pitch" ? "#dcfce7" : "#f9fafb", color: viewMode === "pitch" ? "#166534" : "#9ca3af", border: viewMode === "pitch" ? "1.5px solid #22c55e" : "1px solid #e5e7eb" }}
        >
          ⚽ Pitch
        </button>
      </div>

      {/* Formation view */}
      {viewMode === "pitch" && (
        <FormationView teamA={teamA} teamB={teamB} colorA={jA.hex} colorB={jB.hex} />
      )}

      {/* Teams side by side (list view) */}
      {viewMode === "list" && (
        <div className="flex gap-3">
          <TeamColumn team={teamA} label="Team A" accent={jA.hex} allPlayers={allPlayers} onPlayerClick={setEditingPlayer} />
          <TeamColumn team={teamB} label="Team B" accent={jB.hex} allPlayers={allPlayers} onPlayerClick={setEditingPlayer} />
        </div>
      )}

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
          className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fdba74" }}
        >
          <span>🔄</span> Regenerate
        </button>
      </div>

      {/* Record Result */}
      {!resultSaved ? (
        showRecord ? (
          <RecordResult
            gameId={gameId}
            teamA={teamA}
            teamB={teamB}
            onSaved={() => setResultSaved(true)}
          />
        ) : (
          <button
            onClick={() => setShowRecord(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
          >
            <span>📋</span> Record Game Result
          </button>
        )
      ) : (
        <div className="text-center py-3 rounded-xl" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <span className="text-sm font-semibold" style={{ color: "#059669" }}>✅ Result saved!</span>
        </div>
      )}

      {/* Player edit modal */}
      {editingPlayer && (
        <PlayerDetailModal
          player={editingPlayer}
          mode="edit"
          onSaved={() => { setEditingPlayer(null); onRefresh?.() }}
          onClose={() => setEditingPlayer(null)}
          onDelete={() => { setEditingPlayer(null); onRefresh?.() }}
        />
      )}
    </div>
  )
}
