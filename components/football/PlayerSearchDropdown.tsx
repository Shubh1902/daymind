"use client"

import { useState, useRef, useEffect } from "react"
import { getPositionColor } from "@/lib/football-positions"

type Player = {
  id: string; name: string; position: string; skill: number; aliases?: string[]; [key: string]: unknown
}

interface Props {
  players: Player[]
  selectedId?: string | null
  onSelect: (player: Player) => void
  onAddNew: () => void
  rawName: string
}

export default function PlayerSearchDropdown({ players, selectedId, onSelect, onAddNew, rawName }: Props) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus search on mount
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const filtered = search.trim()
    ? players.filter((p) => {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q)
          || p.position.toLowerCase().includes(q)
          || p.aliases?.some((a) => a.toLowerCase().includes(q))
      })
    : players

  return (
    <div className="px-2 py-1.5 space-y-1 animate-slide-up" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
      {/* Search input */}
      <div className="relative mb-1">
        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#9ca3af" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#1f2937" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#d1d5db" }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Player list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-[10px] text-center py-2" style={{ color: "#d1d5db" }}>
            No players match "{search}"
          </p>
        )}
        {filtered.map((pl) => {
          const pc = getPositionColor(pl.position)
          const isCurrent = selectedId === pl.id
          return (
            <button
              key={pl.id}
              onClick={() => onSelect(pl)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all"
              style={{
                background: isCurrent ? "#dbeafe" : "#fff",
                border: isCurrent ? "1.5px solid #3b82f6" : "1px solid #f3f4f6",
              }}
            >
              <span className="text-[9px] font-bold px-1 rounded" style={{ background: pc.bg, color: pc.color }}>{pl.position}</span>
              <span className="text-[10px] font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{pl.name}</span>
              {pl.aliases && pl.aliases.length > 0 && (
                <span className="text-[8px] truncate max-w-[60px]" style={{ color: "#d1d5db" }}>
                  aka {pl.aliases.join(", ")}
                </span>
              )}
              <span className="text-[10px] font-bold" style={{ color: "#6b7280" }}>{pl.skill}</span>
            </button>
          )
        })}
      </div>

      {/* Add new */}
      <button
        onClick={onAddNew}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left"
        style={{ background: "#fff7ed", border: "1px solid #fdba74" }}
      >
        <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>+</span>
        <span className="text-[10px] font-medium" style={{ color: "#9a3412" }}>Add "{rawName}" as new player</span>
      </button>
    </div>
  )
}
