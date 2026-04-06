"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import FormationView from "./FormationView"
import InlineScoreRecorder from "./InlineScoreRecorder"
import { getPositionColor } from "@/lib/football-positions"
import { getJerseyColor } from "@/lib/football-jersey"
import JerseyPicker from "./JerseyPicker"

type TeamPlayer = { name: string; position: string; skill: number; role: string; playerId?: string; workRate?: string }
type Goal = { id: string; team: string; player: { name: string }; assistPlayer?: { name: string } | null }
type Game = {
  id: string; name: string | null
  teamAPlayers: TeamPlayer[]; teamBPlayers: TeamPlayer[]
  jerseyA: string | null; jerseyB: string | null
  scoreA: number | null; scoreB: number | null; completed: boolean
  balanceScore: number | null; createdAt: string; goals: Goal[]
}

interface Props { games: Game[] }

export default function GameHistoryList({ games: initialGames }: Props) {
  const router = useRouter()
  const [games, setGames] = useState(initialGames)
  const [undoing, setUndoing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list")
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)

  async function undoResult(gameId: string) {
    if (!confirm("Undo this game result? Score and goals will be cleared.")) return
    setUndoing(gameId)
    try {
      await fetch(`/api/football/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA: null, scoreB: null, goals: [] }),
      })
      setGames((prev) => prev.map((g) =>
        g.id === gameId ? { ...g, scoreA: null, scoreB: null, completed: false, goals: [] } : g
      ))
    } catch { /* ignore */ }
    setUndoing(null)
  }

  async function deleteGame(gameId: string) {
    if (!confirm("Delete this game permanently?")) return
    setDeleting(gameId)
    try {
      await fetch(`/api/football/games/${gameId}`, { method: "DELETE" })
      setGames((prev) => prev.filter((g) => g.id !== gameId))
    } catch { /* ignore */ }
    setDeleting(null)
  }

  function toggleSelect(gameId: string) {
    setSelectedForDelete((prev) => {
      const n = new Set(prev)
      if (n.has(gameId)) n.delete(gameId)
      else n.add(gameId)
      return n
    })
  }

  async function bulkDelete() {
    if (selectedForDelete.size === 0) return
    if (!confirm(`Delete ${selectedForDelete.size} game${selectedForDelete.size > 1 ? "s" : ""} permanently?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedForDelete).map((id) =>
          fetch(`/api/football/games/${id}`, { method: "DELETE" })
        )
      )
      setGames((prev) => prev.filter((g) => !selectedForDelete.has(g.id)))
      setSelectedForDelete(new Set())
      setBulkMode(false)
      router.refresh()
    } catch { /* ignore */ }
    setBulkDeleting(false)
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-3xl block mb-2">⚽</span>
        <p className="text-sm" style={{ color: "#9ca3af" }}>No games yet — generate your first teams!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bulk controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setBulkMode(!bulkMode); setSelectedForDelete(new Set()) }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: bulkMode ? "#fef2f2" : "#f9fafb", color: bulkMode ? "#dc2626" : "#6b7280", border: `1px solid ${bulkMode ? "#fecaca" : "#e5e7eb"}` }}
        >
          {bulkMode ? "Cancel" : "Select"}
        </button>
        {bulkMode && selectedForDelete.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
          >
            {bulkDeleting ? "..." : `Delete ${selectedForDelete.size}`}
          </button>
        )}
        {bulkMode && (
          <button
            onClick={() => setSelectedForDelete(new Set(games.map((g) => g.id)))}
            className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{ color: "#6b7280" }}
          >
            Select all
          </button>
        )}
      </div>

      {games.map((game) => {
        const teamA = game.teamAPlayers ?? []
        const teamB = game.teamBPlayers ?? []
        const hasResult = game.completed && game.scoreA != null && game.scoreB != null
        const jA = getJerseyColor(game.jerseyA ?? "orange")
        const jB = getJerseyColor(game.jerseyB ?? "purple")
        const isExpanded = expandedId === game.id
        const isSelected = selectedForDelete.has(game.id)

        return (
          <div key={game.id} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: `1px solid ${isSelected ? "#fecaca" : "#e5e7eb"}` }}>
            {/* Header — clickable to expand */}
            <div
              className="px-4 py-3 flex items-center gap-3 cursor-pointer"
              onClick={() => bulkMode ? toggleSelect(game.id) : setExpandedId(isExpanded ? null : game.id)}
            >
              {bulkMode && (
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0" style={{ borderColor: isSelected ? "#dc2626" : "#d1d5db", background: isSelected ? "#fef2f2" : "transparent" }}>
                  {isSelected && <svg className="w-3 h-3" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold truncate block" style={{ color: "#1f2937" }}>
                  {game.name ?? new Date(game.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="text-[10px]" style={{ color: "#d1d5db" }}>
                  {new Date(game.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {" · "}{teamA.length}v{teamB.length}
                </span>
              </div>

              {/* Jersey dots */}
              <div className="flex gap-1 shrink-0">
                <span className="w-4 h-4 rounded-full" style={{ background: jA.hex, border: `1px solid ${jA.border}` }} />
                <span className="w-4 h-4 rounded-full" style={{ background: jB.hex, border: `1px solid ${jB.border}` }} />
              </div>

              {hasResult ? (
                <span className="text-lg font-bold px-2 py-0.5 rounded-lg shrink-0" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <span style={{ color: jA.hex }}>{game.scoreA}</span>
                  <span style={{ color: "#d1d5db" }}>-</span>
                  <span style={{ color: jB.hex }}>{game.scoreB}</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "#fef3c7", color: "#d97706" }}>
                  {game.balanceScore}%
                </span>
              )}

              {!bulkMode && (
                <svg className="w-4 h-4 shrink-0 transition-transform" style={{ color: "#d1d5db", transform: isExpanded ? "rotate(180deg)" : "" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>

            {/* Expanded detail */}
            {isExpanded && !bulkMode && (
              <div className="px-4 pb-4 pt-0 space-y-3 animate-slide-up" style={{ borderTop: "1px solid #f3f4f6" }}>
                {/* View toggle */}
                <div className="flex gap-2 justify-center pt-2">
                  <button onClick={() => setViewMode("list")} className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: viewMode === "list" ? "#fff7ed" : "#f9fafb", color: viewMode === "list" ? "#9a3412" : "#9ca3af", border: viewMode === "list" ? "1.5px solid #f97316" : "1px solid #e5e7eb" }}>📋 List</button>
                  <button onClick={() => setViewMode("pitch")} className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: viewMode === "pitch" ? "#dcfce7" : "#f9fafb", color: viewMode === "pitch" ? "#166534" : "#9ca3af", border: viewMode === "pitch" ? "1.5px solid #22c55e" : "1px solid #e5e7eb" }}>⚽ Pitch</button>
                </div>

                {/* Pitch view */}
                {viewMode === "pitch" && (
                  <FormationView
                    teamA={teamA.map((p) => ({ ...p, playerId: p.playerId ?? p.name, workRate: p.workRate ?? "Med" }))}
                    teamB={teamB.map((p) => ({ ...p, playerId: p.playerId ?? p.name, workRate: p.workRate ?? "Med" }))}
                    colorA={jA.hex}
                    colorB={jB.hex}
                  />
                )}

                {/* List view */}
                {viewMode === "list" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: jA.hex }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: jA.hex, border: `1px solid ${jA.border}` }} />
                      Team A
                    </p>
                      <div className="space-y-0.5">
                        {teamA.map((p, i) => {
                          const pc = getPositionColor(p.position)
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: p.role === "sub" ? "#f3f4f6" : pc.bg }}>
                              <span className="font-bold text-[10px]" style={{ color: pc.color }}>{p.role === "gk" ? "GK" : p.role === "sub" ? "SUB" : p.position}</span>
                              <span className="font-medium flex-1 truncate" style={{ color: p.role === "sub" ? "#9ca3af" : "#1f2937" }}>{p.name}</span>
                              <span className="font-bold text-[10px]" style={{ color: "#6b7280" }}>{p.skill}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: jB.hex }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: jB.hex, border: `1px solid ${jB.border}` }} />
                      Team B
                    </p>
                      <div className="space-y-0.5">
                        {teamB.map((p, i) => {
                          const pc = getPositionColor(p.position)
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: p.role === "sub" ? "#f3f4f6" : pc.bg }}>
                              <span className="font-bold text-[10px]" style={{ color: pc.color }}>{p.role === "gk" ? "GK" : p.role === "sub" ? "SUB" : p.position}</span>
                              <span className="font-medium flex-1 truncate" style={{ color: p.role === "sub" ? "#9ca3af" : "#1f2937" }}>{p.name}</span>
                              <span className="font-bold text-[10px]" style={{ color: "#6b7280" }}>{p.skill}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Goal scorers */}
                {game.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {game.goals.map((goal, i) => (
                      <span key={i} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: goal.team === "A" ? "#fff7ed" : "#f5f3ff", color: goal.team === "A" ? "#f97316" : "#8b5cf6" }}>
                        ⚽ {goal.player.name}
                        {goal.assistPlayer && <span className="text-[9px] opacity-70">🅰️ {goal.assistPlayer.name}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Record / edit score */}
                {recordingId === game.id ? (
                  <InlineScoreRecorder
                    gameId={game.id}
                    teamA={teamA}
                    teamB={teamB}
                    existingGoals={game.goals}
                    existingScoreA={game.scoreA}
                    existingScoreB={game.scoreB}
                    onSaved={() => { setRecordingId(null); router.refresh() }}
                  />
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setRecordingId(game.id)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                    >
                      {hasResult ? "Edit Score" : "Add Score"}
                    </button>
                    {hasResult && (
                      <button onClick={() => undoResult(game.id)} disabled={undoing === game.id} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                        {undoing === game.id ? "..." : "Undo Result"}
                      </button>
                    )}
                    <button onClick={() => deleteGame(game.id)} disabled={deleting === game.id} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      {deleting === game.id ? "..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
