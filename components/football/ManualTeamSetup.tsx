"use client"

import { useState } from "react"
import { getPositionColor, getPositionArea } from "@/lib/football-positions"

type Player = {
  id: string; name: string; position: string; positions?: string[]; skill: number; workRate: string; notes: string | null
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  players: Player[]
  onTeamsCreated: (result: { teamA: TeamAssignment[]; teamB: TeamAssignment[]; balanceScore: number; gameId: string }) => void
}

export default function ManualTeamSetup({ players, onTeamsCreated }: Props) {
  const [teamA, setTeamA] = useState<Set<string>>(new Set())
  const [teamB, setTeamB] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const unassigned = players.filter((p) => !teamA.has(p.id) && !teamB.has(p.id))

  function assign(playerId: string, team: "A" | "B") {
    // Remove from other team first
    if (team === "A") {
      setTeamB((prev) => { const n = new Set(prev); n.delete(playerId); return n })
      setTeamA((prev) => new Set(prev).add(playerId))
    } else {
      setTeamA((prev) => { const n = new Set(prev); n.delete(playerId); return n })
      setTeamB((prev) => new Set(prev).add(playerId))
    }
  }

  function unassign(playerId: string) {
    setTeamA((prev) => { const n = new Set(prev); n.delete(playerId); return n })
    setTeamB((prev) => { const n = new Set(prev); n.delete(playerId); return n })
  }

  function buildAssignments(ids: Set<string>): TeamAssignment[] {
    return players
      .filter((p) => ids.has(p.id))
      .map((p) => ({
        playerId: p.id, name: p.name, position: p.position,
        skill: p.skill, workRate: p.workRate, role: "outfield" as const,
      }))
  }

  // Compute balance
  const WR: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }
  const scoreA = players.filter((p) => teamA.has(p.id)).reduce((s, p) => s + p.skill * (WR[p.workRate] ?? 1), 0)
  const scoreB = players.filter((p) => teamB.has(p.id)).reduce((s, p) => s + p.skill * (WR[p.workRate] ?? 1), 0)
  const maxScore = Math.max(scoreA, scoreB, 1)
  const balanceScore = Math.round((100 - Math.abs(scoreA - scoreB) / maxScore * 100) * 10) / 10

  async function handleSave() {
    if (teamA.size < 2 || teamB.size < 2) { setError("Each team needs at least 2 players"); return }
    setSaving(true); setError("")
    try {
      const tA = buildAssignments(teamA)
      const tB = buildAssignments(teamB)
      // Save via API
      const res = await fetch("/api/football/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: tA, teamB: tB, balanceScore }),
      })
      if (res.ok) {
        const game = await res.json()
        onTeamsCreated({ teamA: tA, teamB: tB, balanceScore, gameId: game.id })
      } else {
        setError("Failed to save")
      }
    } catch {
      setError("Something went wrong")
    }
    setSaving(false)
  }

  function PlayerChip({ player, team, onRemove }: { player: Player; team?: "A" | "B"; onRemove?: () => void }) {
    const pc = getPositionColor(player.position)
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: pc.bg, border: `1px solid ${pc.color}30` }}>
        <span className="font-bold" style={{ color: pc.color }}>{player.skill}</span>
        <span className="font-medium truncate" style={{ color: "#1f2937" }}>{player.name}</span>
        <span className="text-[10px] font-bold" style={{ color: pc.color }}>{player.position}</span>
        {onRemove && (
          <button onClick={onRemove} className="ml-auto text-xs" style={{ color: "#9ca3af" }}>&times;</button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Balance indicator */}
      {(teamA.size > 0 || teamB.size > 0) && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <span className="text-xs" style={{ color: "#6b7280" }}>
            <span className="font-bold" style={{ color: "#f97316" }}>A: {teamA.size}</span>
            {" vs "}
            <span className="font-bold" style={{ color: "#8b5cf6" }}>B: {teamB.size}</span>
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: balanceScore >= 90 ? "#ecfdf5" : balanceScore >= 75 ? "#fef3c7" : "#fef2f2",
              color: balanceScore >= 90 ? "#059669" : balanceScore >= 75 ? "#d97706" : "#dc2626",
            }}
          >
            {balanceScore}% balanced
          </span>
        </div>
      )}

      {/* Two team columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Team A */}
        <div className="rounded-xl p-3 min-h-[120px]" style={{ background: "#fff7ed", border: "2px solid #fdba7440" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#f97316" }}>Team A ({teamA.size})</p>
          <div className="space-y-1.5">
            {players.filter((p) => teamA.has(p.id)).map((p) => (
              <PlayerChip key={p.id} player={p} team="A" onRemove={() => unassign(p.id)} />
            ))}
            {teamA.size === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "#fdba74" }}>Tap a player below to add</p>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="rounded-xl p-3 min-h-[120px]" style={{ background: "#f5f3ff", border: "2px solid #c4b5fd40" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#8b5cf6" }}>Team B ({teamB.size})</p>
          <div className="space-y-1.5">
            {players.filter((p) => teamB.has(p.id)).map((p) => (
              <PlayerChip key={p.id} player={p} team="B" onRemove={() => unassign(p.id)} />
            ))}
            {teamB.size === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "#c4b5fd" }}>Tap a player below to add</p>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned players */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
          Available ({unassigned.length})
        </p>
        {unassigned.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "#d1d5db" }}>All players assigned!</p>
        ) : (
          <div className="space-y-1.5">
            {unassigned.map((p) => {
              const pc = getPositionColor(p.position)
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: pc.bg, color: pc.color }}>
                    {p.skill}
                  </div>
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{p.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: pc.color }}>{p.position}</span>
                  <button
                    onClick={() => assign(p.id, "A")}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold"
                    style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fdba74" }}
                  >
                    A
                  </button>
                  <button
                    onClick={() => assign(p.id, "B")}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold"
                    style={{ background: "#f5f3ff", color: "#8b5cf6", border: "1px solid #c4b5fd" }}
                  >
                    B
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-center" style={{ color: "#dc2626" }}>{error}</p>}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={teamA.size < 2 || teamB.size < 2 || saving}
        className="w-full btn-primary text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Save Teams ({teamA.size} v {teamB.size})</>
        )}
      </button>
    </div>
  )
}
