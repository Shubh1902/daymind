"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { POSITION_GROUPS, getPositionColor } from "@/lib/football-positions"
import { STAT_LABELS, computeOverall, ratingColor, type FifaStats } from "@/lib/football-rating"

interface Props {
  initialName?: string
  onSaved: () => void
  onClose: () => void
}

export default function AddPlayerModal({ initialName, onSaved, onClose }: Props) {
  const [name, setName] = useState(initialName ?? "")
  const [positions, setPositions] = useState<string[]>([])
  const [stats, setStats] = useState<FifaStats>({ pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 })
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleKey)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey) }
  }, [onClose])

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
      if (res.ok) onSaved()
    } catch { /* ignore */ }
    setSaving(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl max-h-[92vh] overflow-y-auto animate-slide-up"
        style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: "#ffffff" }}>
          <div className="w-10 h-1 rounded-full" style={{ background: "#d4d4d8" }} />
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: "#1f2937" }}>Add Player</h2>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#6b7280", background: "#f3f4f6" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Name + Overall */}
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>Positions</p>
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
          </div>

          {/* FIFA Stats */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>Attributes</p>
            <div className="space-y-2.5">
              {STAT_LABELS.map(({ key, short, color }) => (
                <div key={key} className="flex items-center gap-2">
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
              ))}
            </div>
          </div>

          {/* Notes */}
          <input
            type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — e.g. left foot, captain material"
            className="input-dark w-full text-xs px-3.5 py-2 rounded-xl"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || positions.length === 0 || saving}
              className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1"
            >
              {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `Add Player (${overall} OVR)`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
