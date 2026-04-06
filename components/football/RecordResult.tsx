"use client"

import { useState } from "react"
import { getPositionColor } from "@/lib/football-positions"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  gameId: string
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  onSaved: () => void
}

export default function RecordResult({ gameId, teamA, teamB, onSaved }: Props) {
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [goals, setGoals] = useState<{ playerId: string; team: string; playerName: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState<"A" | "B" | null>(null)

  function addGoal(playerId: string, team: string, playerName: string) {
    setGoals((prev) => [...prev, { playerId, team, playerName }])
    if (team === "A") setScoreA((s) => s + 1)
    else setScoreB((s) => s + 1)
    setShowPicker(null)
  }

  function removeGoal(index: number) {
    const goal = goals[index]
    setGoals((prev) => prev.filter((_, i) => i !== index))
    if (goal.team === "A") setScoreA((s) => Math.max(0, s - 1))
    else setScoreB((s) => Math.max(0, s - 1))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/football/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA,
          scoreB,
          goals: goals.map((g) => ({ playerId: g.playerId, team: g.team })),
        }),
      })
      onSaved()
    } catch { /* ignore */ }
    setSaving(false)
  }

  const allTeamA = teamA.filter((p) => p.role === "outfield")
  const allTeamB = teamB.filter((p) => p.role === "outfield")
  // GKs can score too (rare but possible) — add them separately at the end
  const gkA = teamA.find((p) => p.role === "gk")
  const gkB = teamB.find((p) => p.role === "gk")
  const scorersA = gkA ? [...allTeamA, gkA] : allTeamA
  const scorersB = gkB ? [...allTeamB, gkB] : allTeamB

  return (
    <div className="space-y-4 animate-slide-up">
      <h3 className="text-sm font-bold" style={{ color: "#1f2937" }}>Record Game Result</h3>

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-4 py-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
        <div className="text-center">
          <p className="text-xs font-bold mb-1" style={{ color: "#f97316" }}>Team A</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setScoreA((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
            <span className="text-3xl font-bold w-10 text-center" style={{ color: "#1f2937" }}>{scoreA}</span>
            <button onClick={() => { setScoreA((s) => s + 1); setShowPicker("A") }} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
          </div>
        </div>
        <span className="text-xl font-bold" style={{ color: "#d1d5db" }}>:</span>
        <div className="text-center">
          <p className="text-xs font-bold mb-1" style={{ color: "#8b5cf6" }}>Team B</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setScoreB((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
            <span className="text-3xl font-bold w-10 text-center" style={{ color: "#1f2937" }}>{scoreB}</span>
            <button onClick={() => { setScoreB((s) => s + 1); setShowPicker("B") }} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
          </div>
        </div>
      </div>

      {/* Goal scorer picker */}
      {showPicker && (
        <div className="rounded-xl p-3 animate-slide-up" style={{ background: "#ffffff", border: `2px solid ${showPicker === "A" ? "#f97316" : "#8b5cf6"}` }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#6b7280" }}>Who scored? (Team {showPicker})</p>
          <div className="flex flex-wrap gap-1.5">
            {(showPicker === "A" ? scorersA : scorersB).map((p) => {
              const pc = getPositionColor(p.position)
              return (
                <button
                  key={p.playerId}
                  onClick={() => addGoal(p.playerId, showPicker, p.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                  style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}
                >
                  {p.name}
                </button>
              )
            })}
            <button
              onClick={() => setShowPicker(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#f3f4f6", color: "#9ca3af" }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Goal list */}
      {goals.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#6b7280" }}>Goals</p>
          <div className="space-y-1">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
                <span className="text-sm">⚽</span>
                <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{g.playerName}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: g.team === "A" ? "#fff7ed" : "#f5f3ff", color: g.team === "A" ? "#f97316" : "#8b5cf6" }}
                >
                  Team {g.team}
                </span>
                <button onClick={() => removeGoal(i)} className="ml-auto text-xs" style={{ color: "#d1d5db" }}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick add goal buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPicker("A")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
          style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}
        >
          ⚽ Add Goal (A)
        </button>
        <button
          onClick={() => setShowPicker("B")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
          style={{ background: "#f5f3ff", color: "#8b5cf6", border: "1px solid #ddd6fe" }}
        >
          ⚽ Add Goal (B)
        </button>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Save Result ({scoreA} - {scoreB})</>
        )}
      </button>
    </div>
  )
}
