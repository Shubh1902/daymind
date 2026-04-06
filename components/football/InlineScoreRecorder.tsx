"use client"

import { useState } from "react"
import { getPositionColor } from "@/lib/football-positions"
import PlayerSearchDropdown from "./PlayerSearchDropdown"

type TeamPlayer = { name: string; position: string; skill: number; role: string; playerId?: string; workRate?: string }
type GoalEntry = { playerId: string; playerName: string; team: string; assistPlayerId?: string; assistName?: string }

interface Props {
  gameId: string
  teamA: TeamPlayer[]
  teamB: TeamPlayer[]
  existingGoals: { team: string; player: { name: string }; assistPlayer?: { name: string } | null }[]
  existingScoreA: number | null
  existingScoreB: number | null
  onSaved: () => void
}

export default function InlineScoreRecorder({ gameId, teamA, teamB, existingGoals, existingScoreA, existingScoreB, onSaved }: Props) {
  const [scoreA, setScoreA] = useState(existingScoreA ?? 0)
  const [scoreB, setScoreB] = useState(existingScoreB ?? 0)

  // Pre-populate from existing goals when editing
  const [goals, setGoals] = useState<GoalEntry[]>(() => {
    if (!existingGoals || existingGoals.length === 0) return []
    const allPlayers = [...teamA, ...teamB]
    return existingGoals.map((g) => {
      const scorer = allPlayers.find((p) => p.name === g.player.name)
      const assister = g.assistPlayer ? allPlayers.find((p) => p.name === g.assistPlayer?.name) : null
      return {
        playerId: scorer?.playerId ?? "",
        playerName: g.player.name,
        team: g.team,
        assistPlayerId: assister?.playerId,
        assistName: g.assistPlayer?.name,
      }
    })
  })
  const [pickerTeam, setPickerTeam] = useState<"A" | "B" | null>(null)
  const [assistPicker, setAssistPicker] = useState<number | null>(null) // index of goal needing assist
  const [saving, setSaving] = useState(false)

  const playersA = teamA.filter((p) => p.role !== "sub" && p.playerId)
  const playersB = teamB.filter((p) => p.role !== "sub" && p.playerId)

  function addGoal(playerId: string, playerName: string, team: string) {
    setGoals((prev) => [...prev, { playerId, playerName, team }])
    if (team === "A") setScoreA((s) => s + 1)
    else setScoreB((s) => s + 1)
    setPickerTeam(null)
  }

  function setAssist(goalIndex: number, assistPlayerId: string, assistName: string) {
    setGoals((prev) => prev.map((g, i) => i === goalIndex ? { ...g, assistPlayerId, assistName } : g))
    setAssistPicker(null)
  }

  function removeGoal(index: number) {
    const g = goals[index]
    setGoals((prev) => prev.filter((_, i) => i !== index))
    if (g.team === "A") setScoreA((s) => Math.max(0, s - 1))
    else setScoreB((s) => Math.max(0, s - 1))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/football/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA, scoreB,
          goals: goals.map((g) => ({ playerId: g.playerId, team: g.team, assistPlayerId: g.assistPlayerId })),
        }),
      })
      onSaved()
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <div className="space-y-3 pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
      <p className="text-xs font-bold" style={{ color: "#1f2937" }}>Record Result</p>

      {/* Scoreboard */}
      <div className="flex items-center justify-center gap-4 py-3 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
        <div className="text-center">
          <p className="text-[10px] font-bold" style={{ color: "#f97316" }}>Team A</p>
          <div className="flex items-center gap-1.5 mt-1">
            <button onClick={() => setScoreA((s) => Math.max(0, s - 1))} className="w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
            <span className="text-2xl font-black w-8 text-center" style={{ color: "#1f2937" }}>{scoreA}</span>
            <button onClick={() => setPickerTeam("A")} className="w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
          </div>
        </div>
        <span className="text-lg font-bold" style={{ color: "#d1d5db" }}>:</span>
        <div className="text-center">
          <p className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>Team B</p>
          <div className="flex items-center gap-1.5 mt-1">
            <button onClick={() => setScoreB((s) => Math.max(0, s - 1))} className="w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
            <span className="text-2xl font-black w-8 text-center" style={{ color: "#1f2937" }}>{scoreB}</span>
            <button onClick={() => setPickerTeam("B")} className="w-7 h-7 rounded-lg text-sm font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
          </div>
        </div>
      </div>

      {/* Goal scorer picker */}
      {pickerTeam && (
        <div className="rounded-xl p-2.5 animate-slide-up" style={{ border: `2px solid ${pickerTeam === "A" ? "#f97316" : "#8b5cf6"}` }}>
          <p className="text-[10px] font-bold mb-1.5" style={{ color: "#6b7280" }}>Who scored? (Team {pickerTeam})</p>
          <div className="flex flex-wrap gap-1.5">
            {(pickerTeam === "A" ? playersA : playersB).map((p) => {
              const pc = getPositionColor(p.position)
              return (
                <button key={p.playerId} onClick={() => addGoal(p.playerId!, p.name, pickerTeam)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}>
                  {p.name}
                </button>
              )
            })}
            <button onClick={() => setPickerTeam(null)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#f3f4f6", color: "#9ca3af" }}>Skip</button>
          </div>
        </div>
      )}

      {/* Assist picker */}
      {assistPicker !== null && goals[assistPicker] && (
        <div className="rounded-xl p-2.5 animate-slide-up" style={{ border: "2px solid #22c55e" }}>
          <p className="text-[10px] font-bold mb-1.5" style={{ color: "#6b7280" }}>Who assisted {goals[assistPicker].playerName}'s goal?</p>
          <div className="flex flex-wrap gap-1.5">
            {(goals[assistPicker].team === "A" ? playersA : playersB)
              .filter((p) => p.playerId !== goals[assistPicker].playerId)
              .map((p) => (
                <button key={p.playerId} onClick={() => setAssist(assistPicker, p.playerId!, p.name)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
                  {p.name}
                </button>
              ))}
            <button onClick={() => setAssistPicker(null)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#f3f4f6", color: "#9ca3af" }}>No assist</button>
          </div>
        </div>
      )}

      {/* Goal list */}
      {goals.length > 0 && (
        <div className="space-y-1">
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}>
              <span className="text-sm">⚽</span>
              <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{g.playerName}</span>
              {g.assistName && (
                <span className="text-[10px]" style={{ color: "#16a34a" }}>🅰️ {g.assistName}</span>
              )}
              <span className="text-[10px] font-bold px-1 rounded" style={{ background: g.team === "A" ? "#fff7ed" : "#f5f3ff", color: g.team === "A" ? "#f97316" : "#8b5cf6" }}>
                {g.team}
              </span>
              {!g.assistPlayerId && (
                <button onClick={() => setAssistPicker(i)} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#dcfce7", color: "#166534" }}>
                  + assist
                </button>
              )}
              <button onClick={() => removeGoal(i)} className="ml-auto text-xs" style={{ color: "#d1d5db" }}>&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Quick add buttons */}
      <div className="flex gap-2">
        <button onClick={() => setPickerTeam("A")} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}>⚽ Goal (A)</button>
        <button onClick={() => setPickerTeam("B")} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "#f5f3ff", color: "#8b5cf6", border: "1px solid #ddd6fe" }}>⚽ Goal (B)</button>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1">
        {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `Save Result (${scoreA} - ${scoreB})`}
      </button>
    </div>
  )
}
