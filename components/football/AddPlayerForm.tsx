"use client"

import { useState } from "react"
import { POSITION_GROUPS, getPositionColor } from "@/lib/football-positions"
import { STAT_LABELS, computeOverall, ratingColor, type FifaStats } from "@/lib/football-rating"

interface Props {
  onAdded: () => void
}

export default function AddPlayerForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [positions, setPositions] = useState<string[]>([])
  const [stats, setStats] = useState<FifaStats>({ pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 })
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [showPosPicker, setShowPosPicker] = useState(true)

  function togglePosition(posId: string) {
    setPositions((prev) => prev.includes(posId) ? prev.filter((p) => p !== posId) : [...prev, posId])
  }

  function setStat(key: keyof FifaStats, value: number) {
    setStats((prev) => ({ ...prev, [key]: Math.max(1, Math.min(99, value)) }))
  }

  const overall = positions.length > 0 ? computeOverall(stats, positions[0]) : computeOverall(stats, "MID")

  async function handleSubmit() {
    if (!name.trim() || positions.length === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/football/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), position: positions[0], positions,
          ...stats, skill: overall,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        setName(""); setPositions([]); setStats({ pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 }); setNotes("")
        setOpen(false)
        onAdded()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: "#fff7ed", color: "#9a3412", border: "1.5px dashed #fdba74" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Player
      </button>
    )
  }

  return (
    <div className="rounded-xl p-4 space-y-4 animate-slide-up" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* Name + Overall badge */}
      <div className="flex gap-3 items-start">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="input-dark flex-1 text-sm px-3.5 py-2.5 rounded-xl"
          autoFocus
        />
        <div
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{ background: `${ratingColor(overall)}15`, border: `2px solid ${ratingColor(overall)}` }}
        >
          <span className="text-lg font-black leading-none" style={{ color: ratingColor(overall) }}>{overall}</span>
          <span className="text-[8px] font-bold uppercase" style={{ color: ratingColor(overall), opacity: 0.7 }}>OVR</span>
        </div>
      </div>

      {/* Positions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Positions</p>
          <button onClick={() => setShowPosPicker(!showPosPicker)} className="text-xs" style={{ color: "#9ca3af" }}>
            {showPosPicker ? "Hide" : "Show"}
          </button>
        </div>

        {/* Selected tags */}
        {positions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {positions.map((posId, i) => {
              const { color, bg } = getPositionColor(posId)
              return (
                <span key={posId} className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: bg, color, border: `1px solid ${color}30` }}>
                  {posId}{i === 0 ? " ★" : ""}
                </span>
              )
            })}
          </div>
        )}

        {showPosPicker && (
          <div className="space-y-2">
            {POSITION_GROUPS.map((group) => (
              <div key={group.area}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: group.color }}>{group.area}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.positions.map((pos) => {
                    const isSelected = positions.includes(pos.id)
                    return (
                      <button
                        key={pos.id}
                        onClick={() => togglePosition(pos.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: isSelected ? group.bg : "#f9fafb",
                          color: isSelected ? group.color : "#9ca3af",
                          border: isSelected ? `2px solid ${group.color}` : "1px solid #e5e7eb",
                        }}
                      >
                        {pos.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIFA Stats — slider rows */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Attributes</p>
          {positions.includes("GK") && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>GK hints shown</span>
          )}
        </div>
        <div className="space-y-2.5">
          {STAT_LABELS.map(({ key, short, color, gkHint }) => (
            <div key={key}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-8 text-right" style={{ color }}>{short}</span>
                <input
                  type="range" min={1} max={99} value={stats[key]}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, ${color} ${stats[key]}%, #e5e7eb ${stats[key]}%)`, accentColor: color }}
                />
                <input
                  type="number" min={1} max={99} value={stats[key]}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                  className="w-12 text-xs text-center font-bold rounded-lg py-1"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
                />
              </div>
              {positions.includes("GK") && (
                <p className="text-[10px] ml-10 -mt-1" style={{ color: "#92400e" }}>{gkHint}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. left foot, captain material"
        className="input-dark w-full text-xs px-3.5 py-2 rounded-xl"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => { setOpen(false); setShowPosPicker(true) }} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || positions.length === 0 || saving}
          className="flex-1 btn-primary text-white py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1"
        >
          {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `Add Player (${overall} OVR)`}
        </button>
      </div>
    </div>
  )
}
