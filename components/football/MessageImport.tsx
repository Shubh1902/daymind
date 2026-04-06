"use client"

import { useState } from "react"
import { parseMatchMessage, type ParsedImport, type ParsedPlayer } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"

type Player = {
  id: string; name: string; position: string; positions?: string[]; skill: number; workRate: string; notes: string | null
}

interface Props {
  players: Player[]
  onConfirm: (data: { selectedIds: string[]; gkIds: string[]; waitlistedNames: string[] }) => void
  onRefreshPlayers: () => Promise<void>
}

export default function MessageImport({ players, onConfirm, onRefreshPlayers }: Props) {
  const [step, setStep] = useState<"paste" | "review">("paste")
  const [text, setText] = useState("")
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [addingName, setAddingName] = useState<string | null>(null)
  const [addPos, setAddPos] = useState("CM")
  const [addSkill, setAddSkill] = useState(5)
  const [addSaving, setAddSaving] = useState(false)

  function handleParse() {
    if (!text.trim()) return
    const result = parseMatchMessage(text, players)
    setParsed(result)
    setStep("review")
  }

  async function handleAddPlayer(rawName: string) {
    setAddingName(rawName)
    setAddPos("CM")
    setAddSkill(5)
  }

  async function saveNewPlayer() {
    if (!addingName) return
    setAddSaving(true)
    try {
      const res = await fetch("/api/football/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addingName.trim(), position: addPos, positions: [addPos], skill: addSkill, workRate: "Med" }),
      })
      if (res.ok) {
        await onRefreshPlayers()
        // Re-parse with updated roster
        setTimeout(() => {
          setAddingName(null)
          setAddSaving(false)
        }, 300)
      }
    } catch { /* ignore */ }
    setAddSaving(false)
  }

  function handleConfirm() {
    if (!parsed) return
    const selectedIds: string[] = []
    const gkIds: string[] = []
    const waitlistedNames: string[] = []

    for (const p of parsed.confirmed) {
      if (p.matchedPlayer) selectedIds.push(p.matchedPlayer.id)
    }
    for (const p of parsed.goalkeepers) {
      if (p.matchedPlayer) {
        selectedIds.push(p.matchedPlayer.id)
        gkIds.push(p.matchedPlayer.id)
      }
    }
    for (const p of parsed.waitlisted) {
      waitlistedNames.push(p.rawName)
      if (p.matchedPlayer) {
        // Mark as waitlisted via API
        fetch(`/api/football/players/${p.matchedPlayer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlisted: true }),
        }).catch(() => {})
      }
    }

    onConfirm({ selectedIds, gkIds, waitlistedNames })
  }

  // Re-parse when players change (after adding new player)
  function reParse() {
    if (text.trim()) {
      const result = parseMatchMessage(text, players)
      setParsed(result)
    }
  }

  function PlayerRow({ p, sectionColor }: { p: ParsedPlayer; sectionColor: string }) {
    const matched = p.matchedPlayer
    const isUnrecognized = !matched || p.confidence < 0.5

    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: isUnrecognized ? "#fef2f2" : "#ffffff", border: `1px solid ${isUnrecognized ? "#fecaca" : "#f3f4f6"}` }}
      >
        {/* Match indicator */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: p.confidence >= 0.8 ? "#22c55e" : p.confidence >= 0.5 ? "#f59e0b" : "#ef4444",
          }}
        />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: "#1f2937" }}>{p.rawName}</span>
          {matched && p.rawName.toLowerCase() !== matched.name.toLowerCase() && (
            <span className="text-xs ml-1.5" style={{ color: "#6b7280" }}>
              → {matched.name}
            </span>
          )}
        </div>

        {/* Position badge */}
        {matched && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: getPositionColor(matched.position).bg, color: getPositionColor(matched.position).color }}
          >
            {matched.position}
          </span>
        )}

        {/* Skill */}
        {matched && (
          <span className="text-xs font-bold" style={{ color: "#6b7280" }}>{matched.skill}</span>
        )}

        {/* Add button for unrecognized */}
        {isUnrecognized && (
          <button
            onClick={() => handleAddPlayer(p.rawName)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
            style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fdba74" }}
          >
            + Add
          </button>
        )}
      </div>
    )
  }

  // ── Paste step ──
  if (step === "paste") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Paste your match message
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Match on Monday 8PM to 10PM\n\n1. Sajan\n2. Jayanth\n3. Shreyes\n...\n\nGK:\n1. Girish\n2. Soum\n\nWL:\n3. Elan\n4. Sanchit"}
            rows={12}
            className="input-dark w-full text-sm px-4 py-3 rounded-xl resize-none"
            autoFocus
          />
        </div>
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>📋</span> Parse Message
        </button>
      </div>
    )
  }

  // ── Review step ──
  if (!parsed) return null

  const allConfirmed = [...parsed.confirmed, ...parsed.goalkeepers]
  const matchedCount = allConfirmed.filter((p) => p.matchedPlayer && p.confidence >= 0.5).length
  const totalCount = allConfirmed.length
  const hasUnrecognized = parsed.unrecognized.length > 0

  return (
    <div className="space-y-4">
      {/* Match info */}
      {parsed.matchInfo && (
        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          ⚽ {parsed.matchInfo}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
        <span className="font-bold" style={{ color: "#1f2937" }}>{matchedCount}/{totalCount} matched</span>
        {parsed.goalkeepers.length > 0 && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>
            {parsed.goalkeepers.length} GK
          </span>
        )}
        {parsed.waitlisted.length > 0 && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>
            {parsed.waitlisted.length} WL
          </span>
        )}
        {hasUnrecognized && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
            {parsed.unrecognized.length} new
          </span>
        )}
      </div>

      {/* Confirmed players */}
      {parsed.confirmed.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#16a34a" }}>Confirmed ({parsed.confirmed.length})</p>
          <div className="space-y-1">
            {parsed.confirmed.map((p, i) => <PlayerRow key={i} p={p} sectionColor="#16a34a" />)}
          </div>
        </div>
      )}

      {/* Goalkeepers */}
      {parsed.goalkeepers.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#d97706" }}>Goalkeepers ({parsed.goalkeepers.length})</p>
          <div className="space-y-1">
            {parsed.goalkeepers.map((p, i) => <PlayerRow key={i} p={p} sectionColor="#d97706" />)}
          </div>
        </div>
      )}

      {/* Waitlisted */}
      {parsed.waitlisted.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#6b7280" }}>Waitlisted ({parsed.waitlisted.length})</p>
          <div className="space-y-1">
            {parsed.waitlisted.map((p, i) => <PlayerRow key={i} p={p} sectionColor="#6b7280" />)}
          </div>
        </div>
      )}

      {/* Add new player form */}
      {addingName && (
        <div className="rounded-xl p-3 space-y-2 animate-slide-up" style={{ background: "#fff", border: "2px solid #f97316" }}>
          <p className="text-xs font-bold" style={{ color: "#1f2937" }}>Add "{addingName}" to roster</p>
          <div className="flex gap-1 flex-wrap">
            {["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"].map((pos) => {
              const pc = getPositionColor(pos)
              return (
                <button key={pos} onClick={() => setAddPos(pos)} className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: addPos === pos ? pc.bg : "#f9fafb", color: addPos === pos ? pc.color : "#d1d5db", border: addPos === pos ? `1.5px solid ${pc.color}` : "1px solid #e5e7eb" }}>{pos}</button>
              )
            })}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setAddSkill(n)} className="flex-1 h-6 rounded text-xs font-semibold" style={{ background: n <= addSkill ? "#f97316" : "#f3f4f6", color: n <= addSkill ? "#fff" : "#d1d5db" }}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddingName(null)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>Cancel</button>
            <button onClick={async () => { await saveNewPlayer(); reParse() }} disabled={addSaving} className="flex-1 btn-primary text-white py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40">
              {addSaving ? "..." : "Add & Match"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { setStep("paste"); setParsed(null) }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          Confirm & Make Teams ({matchedCount})
        </button>
      </div>
    </div>
  )
}
