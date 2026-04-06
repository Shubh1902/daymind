"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type TeamPlayer = { name: string; position: string; skill: number; role: string; playerId?: string }
type Goal = { id: string; team: string; player: { name: string } }
type Game = {
  id: string; name: string | null
  teamAPlayers: TeamPlayer[]; teamBPlayers: TeamPlayer[]
  scoreA: number | null; scoreB: number | null; completed: boolean
  balanceScore: number | null; createdAt: string; goals: Goal[]
}

interface Props { games: Game[] }

export default function GameHistoryList({ games: initialGames }: Props) {
  const router = useRouter()
  const [games, setGames] = useState(initialGames)
  const [undoing, setUndoing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

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
      router.refresh()
    } catch { /* ignore */ }
    setUndoing(null)
  }

  async function deleteGame(gameId: string) {
    if (!confirm("Delete this game permanently?")) return
    setDeleting(gameId)
    try {
      await fetch(`/api/football/games/${gameId}`, { method: "DELETE" })
      setGames((prev) => prev.filter((g) => g.id !== gameId))
      router.refresh()
    } catch { /* ignore */ }
    setDeleting(null)
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
      {games.map((game) => {
        const teamA = game.teamAPlayers ?? []
        const teamB = game.teamBPlayers ?? []
        const hasResult = game.completed && game.scoreA != null && game.scoreB != null

        return (
          <div key={game.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            {/* Header + score */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: "#1f2937" }}>
                {game.name ?? new Date(game.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              {hasResult ? (
                <span className="text-lg font-bold px-3 py-0.5 rounded-lg" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <span style={{ color: "#f97316" }}>{game.scoreA}</span>
                  <span style={{ color: "#d1d5db" }}> - </span>
                  <span style={{ color: "#8b5cf6" }}>{game.scoreB}</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>
                  No result
                </span>
              )}
            </div>

            {/* Teams */}
            <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
              <span className="font-semibold" style={{ color: "#f97316" }}>A:</span>{" "}
              {teamA.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
            </div>
            <div className="text-xs mb-2" style={{ color: "#6b7280" }}>
              <span className="font-semibold" style={{ color: "#8b5cf6" }}>B:</span>{" "}
              {teamB.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
            </div>

            {/* Goal scorers */}
            {game.goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
                {game.goals.map((goal, i) => (
                  <span key={i} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: goal.team === "A" ? "#fff7ed" : "#f5f3ff", color: goal.team === "A" ? "#f97316" : "#8b5cf6" }}>
                    ⚽ {goal.player.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
              <p className="text-xs" style={{ color: "#d1d5db" }}>
                {new Date(game.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-1.5">
                {hasResult && (
                  <button
                    onClick={() => undoResult(game.id)}
                    disabled={undoing === game.id}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                    style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
                  >
                    {undoing === game.id ? "..." : "Undo Result"}
                  </button>
                )}
                <button
                  onClick={() => deleteGame(game.id)}
                  disabled={deleting === game.id}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  {deleting === game.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
