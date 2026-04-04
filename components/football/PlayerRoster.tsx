"use client"

import { useState } from "react"

type Player = {
  id: string; name: string; position: string; positions?: string[]; skill: number; workRate: string; notes: string | null
}

interface Props {
  players: Player[]
  onRefresh: () => void
}

const POS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  GK: { color: "#d97706", bg: "#fef3c7", label: "GK" },
  DEF: { color: "#2563eb", bg: "#dbeafe", label: "DEF" },
  MID: { color: "#16a34a", bg: "#dcfce7", label: "MID" },
  ATT: { color: "#dc2626", bg: "#fee2e2", label: "ATT" },
}

export default function PlayerRoster({ players, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSkill, setEditSkill] = useState(5)
  const [editPosition, setEditPosition] = useState("MID")
  const [editWorkRate, setEditWorkRate] = useState("Med")
  const [saving, setSaving] = useState(false)

  const grouped = { GK: [] as Player[], DEF: [] as Player[], MID: [] as Player[], ATT: [] as Player[] }
  for (const p of players) {
    const key = p.position as keyof typeof grouped
    if (grouped[key]) grouped[key].push(p)
    else grouped.ATT.push(p) // fallback
  }

  function startEdit(p: Player) {
    setEditingId(p.id); setEditSkill(p.skill); setEditPosition(p.position); setEditWorkRate(p.workRate)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    await fetch(`/api/football/players/${editingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: editSkill, position: editPosition, workRate: editWorkRate }),
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
    <div className="space-y-4">
      {(["GK", "DEF", "MID", "ATT"] as const).map((pos) => {
        const group = grouped[pos]
        if (group.length === 0) return null
        const style = POS_STYLE[pos]
        return (
          <div key={pos}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: style.bg, color: style.color }}>
                {style.label}
              </span>
              <span className="text-xs" style={{ color: "#9ca3af" }}>{group.length} players</span>
            </div>
            <div className="space-y-1.5">
              {group.map((p) => {
                if (editingId === p.id) {
                  return (
                    <div key={p.id} className="rounded-xl p-3 space-y-2 animate-slide-up" style={{ background: "#fff", border: "2px solid #f97316" }}>
                      <p className="text-sm font-bold" style={{ color: "#1f2937" }}>{p.name}</p>
                      <div className="flex gap-1">
                        {["GK", "DEF", "MID", "ATT"].map((ps) => (
                          <button key={ps} onClick={() => setEditPosition(ps)} className="flex-1 py-1 rounded text-xs font-bold" style={{ background: editPosition === ps ? POS_STYLE[ps].bg : "#f9fafb", color: editPosition === ps ? POS_STYLE[ps].color : "#d1d5db", border: editPosition === ps ? `1.5px solid ${POS_STYLE[ps].color}` : "1px solid #e5e7eb" }}>{ps}</button>
                        ))}
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <button key={n} onClick={() => setEditSkill(n)} className="flex-1 h-6 rounded text-xs font-semibold" style={{ background: n <= editSkill ? "#f97316" : "#f3f4f6", color: n <= editSkill ? "#fff" : "#d1d5db" }}>{n}</button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {["Low", "Med", "High"].map((wr) => (
                          <button key={wr} onClick={() => setEditWorkRate(wr)} className="flex-1 py-1 rounded text-xs font-semibold" style={{ background: editWorkRate === wr ? "#fff7ed" : "#f9fafb", color: editWorkRate === wr ? "#9a3412" : "#9ca3af", border: editWorkRate === wr ? "1.5px solid #f97316" : "1px solid #e5e7eb" }}>{wr}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>Cancel</button>
                        <button onClick={saveEdit} disabled={saving} className="flex-1 btn-primary text-white py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40">Save</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl group cursor-pointer transition-all hover:shadow-sm"
                    style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}
                    onClick={() => startEdit(p)}
                  >
                    {/* Skill badge */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {p.skill}
                    </div>
                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1f2937" }}>{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {(p.positions?.length ? p.positions : [p.position]).map((pos, i) => {
                          const ps = POS_STYLE[pos]
                          return ps ? (
                            <span key={pos} className="text-[10px] font-bold px-1 rounded" style={{ background: i === 0 ? ps.bg : "transparent", color: ps.color, border: i > 0 ? `1px solid ${ps.color}40` : "none" }}>
                              {pos}
                            </span>
                          ) : null
                        })}
                        <span className="text-xs" style={{ color: "#d1d5db" }}>·</span>
                        <span className="text-xs" style={{ color: "#9ca3af" }}>WR: {p.workRate}</span>
                        {p.notes && <span className="text-xs truncate" style={{ color: "#d1d5db" }}> · {p.notes}</span>}
                      </div>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlayer(p.id) }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      style={{ color: "#ef4444", background: "#fef2f2" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
  )
}
