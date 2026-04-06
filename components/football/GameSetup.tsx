"use client"

import { useState } from "react"

type Player = {
  id: string; name: string; position: string; positions?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  players: Player[]
  initialSelected?: Set<string>
  onTeamsGenerated: (result: { teamA: TeamAssignment[]; teamB: TeamAssignment[]; balanceScore: number; gameId: string }) => void
}

import { getPositionArea, getPositionColor } from "@/lib/football-positions"

const AREA_COLORS: Record<string, { color: string; bg: string }> = {
  Goal: { color: "#d97706", bg: "#fef3c7" },
  Defense: { color: "#2563eb", bg: "#dbeafe" },
  Midfield: { color: "#16a34a", bg: "#dcfce7" },
  Attack: { color: "#dc2626", bg: "#fee2e2" },
}

export default function GameSetup({ players, initialSelected, onTeamsGenerated }: Props) {
  const [selected, setSelected] = useState<Set<string>>(initialSelected ?? new Set())
  const [instructions, setInstructions] = useState("")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(players.map((p) => p.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  const selectedPlayers = players.filter((p) => selected.has(p.id))
  const gkCount = selectedPlayers.filter((p) => p.position === "GK").length
  const outfieldCount = selectedPlayers.length - gkCount

  async function handleGenerate() {
    if (selected.size < 4) { setError("Select at least 4 players"); return }
    setGenerating(true); setError("")
    try {
      const res = await fetch("/api/football/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: Array.from(selected), instructions }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Generation failed"); return }
      onTeamsGenerated({ teamA: data.teamA, teamB: data.teamB, balanceScore: data.balanceScore, gameId: data.id })
    } catch {
      setError("Something went wrong")
    } finally {
      setGenerating(false)
    }
  }

  // Group players by area for display
  const grouped = { Goal: [] as Player[], Defense: [] as Player[], Midfield: [] as Player[], Attack: [] as Player[] }
  for (const p of players) {
    const area = getPositionArea(p.position) as keyof typeof grouped
    if (grouped[area]) grouped[area].push(p)
    else grouped.Midfield.push(p)
  }

  return (
    <div className="space-y-4">
      {/* Selection counter */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "#1f2937" }}>
            {selected.size} selected
            <span className="text-xs font-normal ml-2" style={{ color: "#9ca3af" }}>
              ({gkCount} GK + {outfieldCount} outfield)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
            All
          </button>
          <button onClick={clearAll} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
            Clear
          </button>
        </div>
      </div>

      {/* Player selection grid */}
      {(["Goal", "Defense", "Midfield", "Attack"] as const).map((area) => {
        const group = grouped[area]
        if (group.length === 0) return null
        const style = AREA_COLORS[area]
        return (
          <div key={area}>
            <p className="text-xs font-bold mb-1.5 px-1" style={{ color: style.color }}>{area}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {group.map((p) => {
                const isSelected = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={{
                      background: isSelected ? style.bg : "#f9fafb",
                      border: isSelected ? `2px solid ${style.color}` : "1px solid #e5e7eb",
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: style.color }}>{p.skill}</span>
                    <span className="text-xs font-medium truncate" style={{ color: isSelected ? "#1f2937" : "#6b7280" }}>{p.name}</span>
                    <span className="text-[10px] font-bold ml-auto" style={{ color: style.color, opacity: 0.6 }}>{p.position}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Instructions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>
          Instructions (optional)
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={"Separate Rahul and Vishal\nKeep Shubhanshu and Arjun together\nPut Amit on Team A"}
          rows={3}
          className="input-dark w-full text-xs px-3.5 py-2.5 rounded-xl resize-none"
        />
      </div>

      {/* Error */}
      {error && <p className="text-xs text-center" style={{ color: "#dc2626" }}>{error}</p>}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={selected.size < 4 || generating}
        className="w-full btn-primary text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
      >
        {generating ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>⚽</span>
            Generate Teams ({Math.ceil(selected.size / 2)} v {Math.floor(selected.size / 2)})
          </>
        )}
      </button>
    </div>
  )
}
