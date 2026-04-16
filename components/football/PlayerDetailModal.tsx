"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { POSITION_GROUPS, getPositionColor, ALL_POSITIONS } from "@/lib/football-positions"
import { STAT_LABELS, computeOverall, ratingColor, type FifaStats } from "@/lib/football-rating"

type Player = {
  id: string; name: string; position: string; positions?: string[]; aliases?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

interface Props {
  /** Existing player to view/edit. Null = create new. */
  player?: Player | null
  /** Pre-filled name for new player creation */
  initialName?: string
  /** "edit" = view/edit existing, "create" = new, "duplicate" = copy from existing */
  mode?: "edit" | "create" | "duplicate"
  onSaved: () => void
  onClose: () => void
  onDelete?: () => void
}

export default function PlayerDetailModal({ player, initialName, mode = player ? "edit" : "create", onSaved, onClose, onDelete }: Props) {
  const isNew = mode === "create" || mode === "duplicate"
  const source = mode === "duplicate" ? player : null

  const [name, setName] = useState(
    mode === "duplicate" ? `${player?.name ?? ""} (copy)` : (player?.name ?? initialName ?? "")
  )
  const [positions, setPositions] = useState<string[]>(
    player?.positions?.length ? [...player.positions] : (player?.position ? [player.position] : [])
  )
  const [stats, setStats] = useState<FifaStats>({
    pace: player?.pace ?? 50, shooting: player?.shooting ?? 50, passing: player?.passing ?? 50,
    dribbling: player?.dribbling ?? 50, defending: player?.defending ?? 50, physical: player?.physical ?? 50,
  })
  const [workRate, setWorkRate] = useState(player?.workRate ?? "Med")
  const [notes, setNotes] = useState(player?.notes ?? "")
  const [aliases, setAliases] = useState((player?.aliases ?? []).join(", "))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
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
  const isGK = positions.includes("GK")

  async function handleSave() {
    if (!name.trim() || positions.length === 0) return
    setSaving(true)
    try {
      if (isNew) {
        // Create new player
        await fetch("/api/football/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(), position: positions[0], positions, ...stats,
            skill: overall, workRate, notes: notes.trim() || null,
          }),
        })
      } else {
        // Update existing
        await fetch(`/api/football/players/${player!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(), position: positions[0], positions, ...stats,
            skill: overall, workRate, notes: notes.trim() || null,
            aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
          }),
        })
      }
      onSaved()
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleDelete() {
    if (!player || !confirm(`Remove ${player.name} from the roster?`)) return
    setDeleting(true)
    await fetch(`/api/football/players/${player.id}`, { method: "DELETE" })
    setDeleting(false)
    onDelete?.()
    onSaved()
  }

  function handleDuplicate() {
    // This is already handled by opening the modal in duplicate mode
    // But if we're in edit mode and user wants to duplicate:
    setName(`${name} (copy)`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl max-h-[92vh] overflow-y-auto animate-slide-up"
        style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: "#ffffff" }}>
          <div className="w-10 h-1 rounded-full" style={{ background: "#d4d4d8" }} />
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: "#1f2937" }}>
              {isNew ? (mode === "duplicate" ? "Duplicate Player" : "Add Player") : "Edit Player"}
            </h2>
            <div className="flex items-center gap-2">
              {!isNew && (
                <button onClick={handleDelete} disabled={deleting} className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {deleting ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "Delete"}
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg" style={{ color: "#6b7280", background: "#f3f4f6" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Name + OVR */}
          <div className="flex gap-3 items-start">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" className="input-dark flex-1 text-sm px-3.5 py-2.5 rounded-xl" autoFocus />
            <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: `${ratingColor(overall)}15`, border: `2px solid ${ratingColor(overall)}` }}>
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
                  return <span key={posId} className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: bg, color, border: `1px solid ${color}30` }}>{posId}{i === 0 ? " ★" : ""}</span>
                })}
              </div>
            )}
            <div className="space-y-2">
              {POSITION_GROUPS.map((group) => (
                <div key={group.area}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: group.color }}>{group.area}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.positions.map((pos) => (
                      <button key={pos.id} onClick={() => togglePosition(pos.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: positions.includes(pos.id) ? group.bg : "#f9fafb", color: positions.includes(pos.id) ? group.color : "#9ca3af", border: positions.includes(pos.id) ? `2px solid ${group.color}` : "1px solid #e5e7eb" }}>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Attributes</p>
              {isGK && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>GK hints</span>}
            </div>
            <div className="space-y-2.5">
              {STAT_LABELS.map(({ key, short, color, gkHint }) => (
                <div key={key}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-8 text-right" style={{ color }}>{short}</span>
                    <input type="range" min={1} max={99} value={stats[key]} onChange={(e) => setStat(key, Number(e.target.value))} className="flex-1 h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${color} ${stats[key]}%, #e5e7eb ${stats[key]}%)`, accentColor: color }} />
                    <input type="number" min={1} max={99} value={stats[key]} onChange={(e) => setStat(key, Number(e.target.value))} className="w-12 text-xs text-center font-bold rounded-lg py-1" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#1f2937" }} />
                  </div>
                  {isGK && <p className="text-[10px] ml-10 -mt-1" style={{ color: "#92400e" }}>{gkHint}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Work Rate */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7280" }}>Work Rate</p>
            <div className="flex gap-2">
              {["Low", "Med", "High"].map((wr) => (
                <button key={wr} onClick={() => setWorkRate(wr)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: workRate === wr ? "#fff7ed" : "#f9fafb", color: workRate === wr ? "#9a3412" : "#9ca3af", border: workRate === wr ? "1.5px solid #f97316" : "1px solid #e5e7eb" }}>
                  {wr}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes — e.g. left foot, captain material" className="input-dark w-full text-xs px-3.5 py-2 rounded-xl" />

          {/* Aliases (edit mode only) */}
          {!isNew && (
            <div>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#9ca3af" }}>Aliases (comma-separated)</p>
              <input type="text" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="e.g. Shubh, SB" className="input-dark w-full text-xs px-3.5 py-2 rounded-xl" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || positions.length === 0 || saving} className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1">
              {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : isNew ? `Add (${overall} OVR)` : `Save (${overall} OVR)`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
