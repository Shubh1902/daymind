"use client"

import { useState } from "react"
import { getPositionColor } from "@/lib/football-positions"

type PlayerStat = {
  id: string; name: string; position: string; positions: string[]; skill: number
  gamesPlayed: number; gamesSub: number; totalGoals: number; totalAssists: number
  wins: number; losses: number; draws: number; winRate: number; goalsPerGame: number
}

interface Props {
  stats: PlayerStat[]
}

type SortKey = "totalGoals" | "totalAssists" | "gamesPlayed" | "winRate" | "skill" | "goalsPerGame" | "name"

export default function PlayerStats({ stats: initialStats }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("totalGoals")
  const [filterPos, setFilterPos] = useState<string | null>(null)

  const filtered = filterPos
    ? initialStats.filter((s) => s.position === filterPos || s.positions?.includes(filterPos))
    : initialStats

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    return (b[sortBy] as number) - (a[sortBy] as number)
  })

  // Leaderboard highlights
  const topScorer = initialStats.reduce((best, s) => s.totalGoals > (best?.totalGoals ?? 0) ? s : best, initialStats[0])
  const mostGames = initialStats.reduce((best, s) => s.gamesPlayed > (best?.gamesPlayed ?? 0) ? s : best, initialStats[0])
  const bestWinRate = initialStats.filter((s) => s.gamesPlayed >= 3).reduce((best, s) => s.winRate > (best?.winRate ?? 0) ? s : best, null as PlayerStat | null)

  const positions = [...new Set(initialStats.flatMap((s) => [s.position, ...(s.positions ?? [])]))]

  return (
    <div className="space-y-5">
      {/* Leaderboard cards */}
      {initialStats.some((s) => s.gamesPlayed > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {topScorer && topScorer.totalGoals > 0 && (
            <div className="rounded-xl p-3 text-center" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
              <span className="text-lg block">⚽</span>
              <p className="text-xs font-bold mt-1" style={{ color: "#92400e" }}>{topScorer.name}</p>
              <p className="text-lg font-black" style={{ color: "#d97706" }}>{topScorer.totalGoals}</p>
              <p className="text-[10px]" style={{ color: "#b45309" }}>Top Scorer</p>
            </div>
          )}
          {mostGames && mostGames.gamesPlayed > 0 && (
            <div className="rounded-xl p-3 text-center" style={{ background: "#dbeafe", border: "1px solid #93c5fd" }}>
              <span className="text-lg block">🏟️</span>
              <p className="text-xs font-bold mt-1" style={{ color: "#1e40af" }}>{mostGames.name}</p>
              <p className="text-lg font-black" style={{ color: "#2563eb" }}>{mostGames.gamesPlayed}</p>
              <p className="text-[10px]" style={{ color: "#1d4ed8" }}>Most Games</p>
            </div>
          )}
          {bestWinRate && (
            <div className="rounded-xl p-3 text-center" style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
              <span className="text-lg block">🏆</span>
              <p className="text-xs font-bold mt-1" style={{ color: "#166534" }}>{bestWinRate.name}</p>
              <p className="text-lg font-black" style={{ color: "#16a34a" }}>{bestWinRate.winRate}%</p>
              <p className="text-[10px]" style={{ color: "#15803d" }}>Win Rate (3+ games)</p>
            </div>
          )}
        </div>
      )}

      {/* Sort + Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { key: "totalGoals", label: "Goals" },
          { key: "totalAssists", label: "Assists" },
          { key: "gamesPlayed", label: "Games" },
          { key: "winRate", label: "Win %" },
          { key: "skill", label: "OVR" },
          { key: "goalsPerGame", label: "G/Game" },
          { key: "name", label: "Name" },
        ] as { key: SortKey; label: string }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: sortBy === s.key ? "#fff7ed" : "#f9fafb",
              color: sortBy === s.key ? "#9a3412" : "#9ca3af",
              border: sortBy === s.key ? "1.5px solid #f97316" : "1px solid #e5e7eb",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Position filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilterPos(null)}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
          style={{
            background: !filterPos ? "#f3f4f6" : "#f9fafb",
            color: !filterPos ? "#1f2937" : "#d1d5db",
            border: !filterPos ? "1.5px solid #d1d5db" : "1px solid #e5e7eb",
          }}
        >
          All
        </button>
        {positions.sort().map((pos) => {
          const pc = getPositionColor(pos)
          return (
            <button
              key={pos}
              onClick={() => setFilterPos(filterPos === pos ? null : pos)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
              style={{
                background: filterPos === pos ? pc.bg : "#f9fafb",
                color: filterPos === pos ? pc.color : "#d1d5db",
                border: filterPos === pos ? `1.5px solid ${pc.color}` : "1px solid #e5e7eb",
              }}
            >
              {pos}
            </button>
          )
        })}
      </div>

      {/* Stats table */}
      <div className="space-y-1.5">
        {sorted.map((s, i) => {
          const pc = getPositionColor(s.position)
          const totalMatches = s.wins + s.losses + s.draws
          return (
            <div
              key={s.id}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
            >
              {/* Rank */}
              <span className="text-xs font-bold w-5 text-center" style={{ color: i < 3 ? "#f97316" : "#d1d5db" }}>
                {i + 1}
              </span>

              {/* Position + OVR badge */}
              <div
                className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
                style={{ background: pc.bg, border: `1px solid ${pc.color}25` }}
              >
                <span className="text-[10px] font-bold leading-none" style={{ color: pc.color }}>{s.position}</span>
                <span className="text-[9px] font-bold" style={{ color: pc.color, opacity: 0.7 }}>{s.skill}</span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#1f2937" }}>{s.name}</p>
                <div className="flex gap-2 text-[10px]" style={{ color: "#9ca3af" }}>
                  {totalMatches > 0 && (
                    <span>
                      <span style={{ color: "#16a34a" }}>{s.wins}W</span>
                      {" "}<span style={{ color: "#6b7280" }}>{s.draws}D</span>
                      {" "}<span style={{ color: "#ef4444" }}>{s.losses}L</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Key stat based on sort */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold" style={{ color: "#1f2937" }}>
                  {sortBy === "totalGoals" ? s.totalGoals :
                   sortBy === "totalAssists" ? s.totalAssists :
                   sortBy === "gamesPlayed" ? s.gamesPlayed :
                   sortBy === "winRate" ? `${s.winRate}%` :
                   sortBy === "skill" ? s.skill :
                   sortBy === "goalsPerGame" ? s.goalsPerGame :
                   ""}
                </p>
                <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                  {sortBy === "totalGoals" ? "goals" :
                   sortBy === "totalAssists" ? "assists" :
                   sortBy === "gamesPlayed" ? "games" :
                   sortBy === "winRate" ? "win rate" :
                   sortBy === "skill" ? "overall" :
                   sortBy === "goalsPerGame" ? "per game" :
                   ""}
                </p>
              </div>

              {/* Games + Goals + Assists mini */}
              <div className="shrink-0 flex gap-1">
                <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                  {s.gamesPlayed}G
                </span>
                <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: "#fef3c7", color: "#d97706" }}>
                  {s.totalGoals}⚽
                </span>
                {s.totalAssists > 0 && (
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    {s.totalAssists}🅰️
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8">
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-sm" style={{ color: "#9ca3af" }}>No stats yet — play some games first!</p>
        </div>
      )}
    </div>
  )
}
