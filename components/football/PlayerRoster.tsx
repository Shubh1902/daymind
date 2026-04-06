"use client"

import { useState } from "react"
import { getPositionColor, getPositionArea } from "@/lib/football-positions"
import { ratingColor } from "@/lib/football-rating"
import PlayerDetailModal from "./PlayerDetailModal"

type Player = {
  id: string; name: string; position: string; positions?: string[]; aliases?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

interface Props {
  players: Player[]
  onRefresh: () => void
}

const AREA_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  Goal: { color: "#d97706", bg: "#fef3c7", label: "GK" },
  Defense: { color: "#2563eb", bg: "#dbeafe", label: "DEF" },
  Midfield: { color: "#16a34a", bg: "#dcfce7", label: "MID" },
  Attack: { color: "#dc2626", bg: "#fee2e2", label: "ATT" },
}

export default function PlayerRoster({ players, onRefresh }: Props) {
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null)
  const [modalMode, setModalMode] = useState<"edit" | "duplicate">("edit")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"position" | "rating">("position")

  const filtered = search.trim()
    ? players.filter((p) => {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q)
          || p.position.toLowerCase().includes(q)
          || p.positions?.some((pos) => pos.toLowerCase().includes(q))
          || p.aliases?.some((a) => a.toLowerCase().includes(q))
          || p.notes?.toLowerCase().includes(q)
      })
    : players

  // Sort filtered players
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rating") return b.skill - a.skill
    return 0 // default: keep DB order (by position)
  })

  const grouped = { Goal: [] as Player[], Defense: [] as Player[], Midfield: [] as Player[], Attack: [] as Player[] }
  for (const p of sorted) {
    const area = getPositionArea(p.position) as keyof typeof grouped
    if (grouped[area]) grouped[area].push(p)
    else grouped.Midfield.push(p)
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl block mb-2">⚽</span>
        <p className="text-sm" style={{ color: "#9ca3af" }}>No players yet — add your first player above</p>
      </div>
    )
  }

  return (
    <>
      {/* Search + Sort */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSortBy(sortBy === "position" ? "rating" : "position")}
          className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: sortBy === "rating" ? "#fff7ed" : "#f9fafb",
            color: sortBy === "rating" ? "#9a3412" : "#9ca3af",
            border: sortBy === "rating" ? "1.5px solid #f97316" : "1px solid #e5e7eb",
          }}
        >
          {sortBy === "rating" ? "⬇ OVR" : "⬇ Pos"}
        </button>
      </div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${players.length} players...`}
          className="w-full pl-9 pr-8 py-2 rounded-xl text-sm"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#d1d5db" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {search.trim() && (
        <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>{filtered.length} of {players.length} players</p>
      )}

      <div className="space-y-4">
        {(["Goal", "Defense", "Midfield", "Attack"] as const).map((area) => {
          const group = grouped[area]
          if (group.length === 0) return null
          const style = AREA_STYLE[area]
          return (
            <div key={area}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: style.bg, color: style.color }}>{style.label}</span>
                <span className="text-xs" style={{ color: "#9ca3af" }}>{group.length} players</span>
              </div>
              <div className="space-y-1.5">
                {group.map((p) => {
                  const pc = getPositionColor(p.position)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
                      style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
                      onClick={() => { setModalPlayer(p); setModalMode("edit") }}
                    >
                      {/* OVR badge */}
                      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: `${ratingColor(p.skill)}12`, border: `1.5px solid ${ratingColor(p.skill)}` }}>
                        <span className="text-sm font-black leading-none" style={{ color: ratingColor(p.skill) }}>{p.skill}</span>
                      </div>

                      {/* Name + positions */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1f2937" }}>{p.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {(p.positions?.length ? p.positions : [p.position]).map((pos, i) => (
                            <span key={pos} className="text-[10px] font-bold px-1 rounded" style={{ background: i === 0 ? getPositionColor(pos).bg : "transparent", color: getPositionColor(pos).color, border: i > 0 ? `1px solid ${getPositionColor(pos).color}40` : "none" }}>
                              {pos}
                            </span>
                          ))}
                          {p.aliases && p.aliases.length > 0 && (
                            <span className="text-[9px] truncate max-w-[80px]" style={{ color: "#d1d5db" }}>
                              aka {p.aliases.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Duplicate button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setModalPlayer(p); setModalMode("duplicate") }}
                        className="p-1.5 rounded-lg opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
                        style={{ color: "#6b7280", background: "#f3f4f6" }}
                        title="Duplicate player"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal for edit/duplicate */}
      {modalPlayer && (
        <PlayerDetailModal
          player={modalPlayer}
          mode={modalMode}
          onSaved={() => { setModalPlayer(null); onRefresh() }}
          onClose={() => setModalPlayer(null)}
          onDelete={() => { setModalPlayer(null); onRefresh() }}
        />
      )}
    </>
  )
}
