"use client"

import { useState } from "react"

const POSITIONS = [
  { id: "GK", label: "GK", color: "#d97706", bg: "#fef3c7" },
  { id: "DEF", label: "DEF", color: "#2563eb", bg: "#dbeafe" },
  { id: "MID", label: "MID", color: "#16a34a", bg: "#dcfce7" },
  { id: "ATT", label: "ATT", color: "#dc2626", bg: "#fee2e2" },
]
const WORK_RATES = ["Low", "Med", "High"]

interface Props {
  onAdded: () => void
}

export default function AddPlayerForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [position, setPosition] = useState("MID")
  const [skill, setSkill] = useState(5)
  const [workRate, setWorkRate] = useState("Med")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/football/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), position, skill, workRate, notes: notes.trim() || null }),
      })
      if (res.ok) {
        setName(""); setPosition("MID"); setSkill(5); setWorkRate("Med"); setNotes("")
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
    <div className="rounded-xl p-4 space-y-3 animate-slide-up" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name"
        className="input-dark w-full text-sm px-3.5 py-2.5 rounded-xl"
        autoFocus
      />

      {/* Position */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>Position</p>
        <div className="flex gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPosition(p.id)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: position === p.id ? p.bg : "#f9fafb",
                color: position === p.id ? p.color : "#9ca3af",
                border: position === p.id ? `2px solid ${p.color}` : "1px solid #e5e7eb",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>
          Skill <span style={{ color: "#f97316" }}>{skill}</span>/10
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setSkill(n)}
              className="flex-1 h-8 rounded-md text-xs font-semibold transition-all"
              style={{
                background: n <= skill ? "#f97316" : "#f3f4f6",
                color: n <= skill ? "#ffffff" : "#d1d5db",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Work Rate */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>Work Rate</p>
        <div className="flex gap-2">
          {WORK_RATES.map((wr) => (
            <button
              key={wr}
              onClick={() => setWorkRate(wr)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: workRate === wr ? "#fff7ed" : "#f9fafb",
                color: workRate === wr ? "#9a3412" : "#9ca3af",
                border: workRate === wr ? "1.5px solid #f97316" : "1px solid #e5e7eb",
              }}
            >
              {wr}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. left foot, good stamina"
        className="input-dark w-full text-xs px-3.5 py-2 rounded-xl"
      />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          className="flex-1 btn-primary text-white py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1"
        >
          {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Add Player"}
        </button>
      </div>
    </div>
  )
}
