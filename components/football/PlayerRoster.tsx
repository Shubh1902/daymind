"use client"

import { useState } from "react"
import { getPositionColor, getPositionArea, POSITION_GROUPS } from "@/lib/football-positions"
import { STAT_LABELS, computeOverall, ratingColor, type FifaStats } from "@/lib/football-rating"
import FifaCard from "./FifaCard"

type Player = {
  id: string; name: string; position: string; positions?: string[]
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStats, setEditStats] = useState<FifaStats>({ pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 })
  const [editPosition, setEditPosition] = useState("CM")
  const [editNotes, setEditNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const grouped = { Goal: [] as Player[], Defense: [] as Player[], Midfield: [] as Player[], Attack: [] as Player[] }
  for (const p of players) {
    const area = getPositionArea(p.position) as keyof typeof grouped
    if (grouped[area]) grouped[area].push(p)
    else grouped.Midfield.push(p)
  }

  function startEdit(p: Player) {
    setEditingId(p.id)
    setEditStats({ pace: p.pace, shooting: p.shooting, passing: p.passing, dribbling: p.dribbling, defending: p.defending, physical: p.physical })
    setEditPosition(p.position)
    setEditNotes(p.notes ?? "")
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const overall = computeOverall(editStats, editPosition)
    await fetch(`/api/football/players/${editingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editStats, position: editPosition, skill: overall, notes: editNotes.trim() || null }),
    })
    setEditingId(null); setSaving(false); onRefresh()
  }

  async function deletePlayer(id: string) {
    if (!confirm("Remove this player from the roster?")) return
    await fetch(`/api/football/players/${id}`, { method: "DELETE" })
    onRefresh()
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
    <div className="space-y-5">
      {(["Goal", "Defense", "Midfield", "Attack"] as const).map((area) => {
        const group = grouped[area]
        if (group.length === 0) return null
        const style = AREA_STYLE[area]
        return (
          <div key={area}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: style.bg, color: style.color }}>
                {style.label}
              </span>
              <span className="text-xs" style={{ color: "#9ca3af" }}>{group.length} players</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {group.map((p) => {
                if (editingId === p.id) {
                  return (
                    <div key={p.id} className="w-full rounded-xl p-3 space-y-2.5 animate-slide-up" style={{ background: "#fff", border: "2px solid #f97316" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: "#1f2937" }}>{p.name}</p>
                        <span className="text-lg font-black" style={{ color: ratingColor(computeOverall(editStats, editPosition)) }}>
                          {computeOverall(editStats, editPosition)}
                        </span>
                      </div>

                      {/* Position */}
                      <div className="flex flex-wrap gap-1">
                        {["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"].map((ps) => {
                          const pc = getPositionColor(ps)
                          return (
                            <button key={ps} onClick={() => setEditPosition(ps)} className="px-1.5 py-1 rounded text-[10px] font-bold" style={{ background: editPosition === ps ? pc.bg : "#f9fafb", color: editPosition === ps ? pc.color : "#d1d5db", border: editPosition === ps ? `1.5px solid ${pc.color}` : "1px solid #e5e7eb" }}>{ps}</button>
                          )
                        })}
                      </div>

                      {/* Stats sliders */}
                      <div className="space-y-1.5">
                        {STAT_LABELS.map(({ key, short, color }) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-7 text-right" style={{ color }}>{short}</span>
                            <input
                              type="range" min={1} max={99} value={editStats[key]}
                              onChange={(e) => setEditStats((s) => ({ ...s, [key]: Number(e.target.value) }))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{ background: `linear-gradient(to right, ${color} ${editStats[key]}%, #e5e7eb ${editStats[key]}%)`, accentColor: color }}
                            />
                            <input
                              type="number" min={1} max={99} value={editStats[key]}
                              onChange={(e) => setEditStats((s) => ({ ...s, [key]: Math.max(1, Math.min(99, Number(e.target.value))) }))}
                              className="w-10 text-[10px] text-center font-bold rounded py-0.5"
                              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      <input
                        type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes — e.g. left foot, good stamina"
                        className="input-dark w-full text-xs px-3 py-2 rounded-lg"
                      />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => { deletePlayer(p.id); setEditingId(null) }} className="py-1.5 px-3 rounded-lg text-xs font-semibold" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>Delete</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>Cancel</button>
                        <button onClick={saveEdit} disabled={saving} className="flex-1 btn-primary text-white py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40">Save</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={p.id} onClick={() => startEdit(p)} className="cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <FifaCard player={p} size="sm" />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
