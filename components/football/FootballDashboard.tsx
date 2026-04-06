"use client"

import { getJerseyColor } from "@/lib/football-jersey"
import { getPositionColor } from "@/lib/football-positions"
import Link from "next/link"

type TeamPlayer = { name: string; position: string; skill: number; role: string; playerId?: string }
type Goal = { id: string; team: string; player: { name: string }; assistPlayer?: { name: string } | null }
type Game = {
  id: string; name: string | null
  teamAPlayers: TeamPlayer[]; teamBPlayers: TeamPlayer[]
  jerseyA: string | null; jerseyB: string | null
  scoreA: number | null; scoreB: number | null; completed: boolean
  balanceScore: number | null; createdAt: string; goals: Goal[]
}

interface Props {
  games: Game[]
  totalGames: number
  totalGoals: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function isFutureGame(game: Game): boolean {
  return !game.completed && game.scoreA == null && game.scoreB == null
}

export default function FootballDashboard({ games, totalGames, totalGoals }: Props) {
  if (games.length === 0) return null

  const latestGame = games[0]
  const pastGames = games.filter((g) => g.completed)
  const upcomingGames = games.filter((g) => isFutureGame(g))
  const jA = getJerseyColor(latestGame.jerseyA ?? "orange")
  const jB = getJerseyColor(latestGame.jerseyB ?? "purple")

  // Top scorers from recent games
  const scorerMap = new Map<string, number>()
  for (const game of games) {
    for (const goal of game.goals) {
      scorerMap.set(goal.player.name, (scorerMap.get(goal.player.name) ?? 0) + 1)
    }
  }
  const topScorers = Array.from(scorerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Latest game hero card — clickable */}
      <Link href={`/football/games/${latestGame.id}`} className="block rounded-2xl overflow-hidden transition-all hover:shadow-md" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Header */}
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: isFutureGame(latestGame) ? "#2563eb" : "#1f2937" }}>
              {isFutureGame(latestGame) ? "🔜 Upcoming" : "⚽ Last Game"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: isFutureGame(latestGame) ? "#dbeafe" : "#f3f4f6", color: isFutureGame(latestGame) ? "#2563eb" : "#9ca3af" }}>
              {timeAgo(latestGame.createdAt)}
            </span>
          </div>
          <Link href="/football/history" className="text-[10px] font-medium" style={{ color: "#9ca3af" }}>
            View all →
          </Link>
        </div>

        {/* Match info */}
        <div className="px-4 py-3">
          {latestGame.name && (
            <p className="text-sm font-bold mb-2" style={{ color: "#1f2937" }}>{latestGame.name}</p>
          )}
          <p className="text-[10px] mb-2" style={{ color: "#9ca3af" }}>
            {new Date(latestGame.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {" · "}
            {new Date(latestGame.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>

          {/* Score */}
          {latestGame.completed && latestGame.scoreA != null ? (
            <div className="flex items-center justify-center gap-4 py-3">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ background: jA.hex, border: `2px solid ${jA.border}` }} />
                <span className="text-3xl font-black" style={{ color: jA.hex }}>{latestGame.scoreA}</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#d1d5db" }}>:</span>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ background: jB.hex, border: `2px solid ${jB.border}` }} />
                <span className="text-3xl font-black" style={{ color: jB.hex }}>{latestGame.scoreB}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-6 h-6 rounded-full" style={{ background: jA.hex, border: `1px solid ${jA.border}` }} />
                <span className="text-sm font-bold" style={{ color: "#1f2937" }}>vs</span>
                <div className="w-6 h-6 rounded-full" style={{ background: jB.hex, border: `1px solid ${jB.border}` }} />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#2563eb" }}>
                {latestGame.balanceScore}% balanced
              </span>
            </div>
          )}

          {/* Goal scorers */}
          {latestGame.goals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {latestGame.goals.map((goal, i) => (
                <span key={i} className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: goal.team === "A" ? jA.bg : jB.bg, color: goal.team === "A" ? jA.hex : jB.hex }}>
                  ⚽ {goal.player.name}
                  {goal.assistPlayer && <span className="opacity-60">🅰️{goal.assistPlayer.name}</span>}
                </span>
              ))}
            </div>
          )}

          {/* Teams summary */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div>
              <p className="text-[10px] font-bold flex items-center gap-1 mb-1" style={{ color: jA.hex }}>
                <span className="w-2 h-2 rounded-full" style={{ background: jA.hex }} /> Team A
              </p>
              <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>
                {latestGame.teamAPlayers.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold flex items-center gap-1 mb-1" style={{ color: jB.hex }}>
                <span className="w-2 h-2 rounded-full" style={{ background: jB.hex }} /> Team B
              </p>
              <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>
                {latestGame.teamBPlayers.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick stats row */}
      {(topScorers.length > 0 || pastGames.length > 1) && (
        <div className="grid grid-cols-3 gap-2">
          {/* Recent top scorers */}
          {topScorers.length > 0 && (
            <div className="col-span-2 rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>Recent Top Scorers</p>
              <div className="flex gap-3">
                {topScorers.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: i === 0 ? "#d97706" : "#6b7280" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#1f2937" }}>{name}</p>
                      <p className="text-[10px]" style={{ color: "#9ca3af" }}>{count} goal{count > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Games count */}
          <div className="rounded-xl p-3 text-center" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="text-2xl font-black" style={{ color: "#f97316" }}>{totalGames}</p>
            <p className="text-[10px]" style={{ color: "#9ca3af" }}>games played</p>
          </div>
        </div>
      )}

      {/* Recent past games mini list */}
      {pastGames.length > 1 && (
        <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider px-3 pt-3 pb-1" style={{ color: "#9ca3af" }}>Recent Results</p>
          {pastGames.slice(1, 4).map((game) => {
            const gA = getJerseyColor(game.jerseyA ?? "orange")
            const gB = getJerseyColor(game.jerseyB ?? "purple")
            return (
              <Link key={game.id} href={`/football/games/${game.id}`} className="flex items-center gap-2.5 px-3 py-2 transition-all hover:bg-gray-50" style={{ borderTop: "1px solid #f3f4f6" }}>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ background: gA.hex }} />
                  <span className="text-sm font-bold" style={{ color: gA.hex }}>{game.scoreA ?? "-"}</span>
                </div>
                <span className="text-xs" style={{ color: "#d1d5db" }}>:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold" style={{ color: gB.hex }}>{game.scoreB ?? "-"}</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: gB.hex }} />
                </div>
                <span className="flex-1 text-[10px] truncate" style={{ color: "#9ca3af" }}>
                  {game.name ?? new Date(game.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-[10px]" style={{ color: "#d1d5db" }}>{timeAgo(game.createdAt)}</span>
              </Link>
            )
          })}
          <Link href="/football/history" className="block text-center py-2 text-[10px] font-medium" style={{ color: "#f97316", borderTop: "1px solid #f3f4f6" }}>
            View all history →
          </Link>
        </div>
      )}
    </div>
  )
}
