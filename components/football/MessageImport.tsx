"use client"

import { useState, useEffect, useRef } from "react"
import { parseMatchMessage, type ParsedImport, type ParsedPlayer } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"
import AddPlayerModal from "./AddPlayerModal"

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
  const needsReparse = useRef(false)

  // Re-parse when players prop updates (after adding a new player)
  useEffect(() => {
    if (needsReparse.current && text.trim() && step === "review") {
      const result = parseMatchMessage(text, players)
      setParsed(result)
      needsReparse.current = false
    }
  }, [players, text, step])

  function handleParse() {
    if (!text.trim()) return
    const result = parseMatchMessage(text, players)
    setParsed(result)
    setStep("review")
  }

  async function handlePlayerAdded() {
    needsReparse.current = true
    await onRefreshPlayers()
    setAddingName(null)
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
        fetch(`/api/football/players/${p.matchedPlayer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlisted: true }),
        }).catch(() => {})
      }
    }

    onConfirm({ selectedIds, gkIds, waitlistedNames })
  }

  function PlayerRow({ p }: { p: ParsedPlayer }) {
    const matched = p.matchedPlayer
    const isUnrecognized = !matched || p.confidence < 0.5

    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: isUnrecognized ? "#fef2f2" : "#ffffff", border: `1px solid ${isUnrecognized ? "#fecaca" : "#f3f4f6"}` }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: p.confidence >= 0.8 ? "#22c55e" : p.confidence >= 0.5 ? "#f59e0b" : "#ef4444" }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: "#1f2937" }}>{p.rawName}</span>
          {matched && p.rawName.toLowerCase() !== matched.name.toLowerCase() && (
            <span className="text-xs ml-1.5" style={{ color: "#6b7280" }}>→ {matched.name}</span>
          )}
        </div>
        {matched && (
          <>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: getPositionColor(matched.position).bg, color: getPositionColor(matched.position).color }}>
              {matched.position}
            </span>
            <span className="text-xs font-bold" style={{ color: "#6b7280" }}>{matched.skill}</span>
          </>
        )}
        {isUnrecognized && (
          <button
            onClick={() => setAddingName(p.rawName)}
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

  const allPlaying = [...parsed.confirmed, ...parsed.goalkeepers]
  const matchedCount = allPlaying.filter((p) => p.matchedPlayer && p.confidence >= 0.5).length
  const unmatchedCount = allPlaying.filter((p) => !p.matchedPlayer || p.confidence < 0.5).length

  return (
    <div className="space-y-4">
      {parsed.matchInfo && (
        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          ⚽ {parsed.matchInfo}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
        <span className="font-bold" style={{ color: matchedCount === allPlaying.length ? "#16a34a" : "#1f2937" }}>
          {matchedCount}/{allPlaying.length} matched
        </span>
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
        {unmatchedCount > 0 && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
            {unmatchedCount} not in roster
          </span>
        )}
      </div>

      {/* Confirmed */}
      {parsed.confirmed.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#16a34a" }}>Confirmed ({parsed.confirmed.length})</p>
          <div className="space-y-1">{parsed.confirmed.map((p, i) => <PlayerRow key={i} p={p} />)}</div>
        </div>
      )}

      {/* GKs */}
      {parsed.goalkeepers.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#d97706" }}>Goalkeepers ({parsed.goalkeepers.length})</p>
          <div className="space-y-1">{parsed.goalkeepers.map((p, i) => <PlayerRow key={i} p={p} />)}</div>
        </div>
      )}

      {/* Waitlisted */}
      {parsed.waitlisted.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#6b7280" }}>Waitlisted ({parsed.waitlisted.length})</p>
          <div className="space-y-1">{parsed.waitlisted.map((p, i) => <PlayerRow key={i} p={p} />)}</div>
        </div>
      )}

      {/* Add Player Modal — full form with FIFA stats */}
      {addingName && (
        <AddPlayerModal
          initialName={addingName}
          onSaved={handlePlayerAdded}
          onClose={() => setAddingName(null)}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { setStep("paste"); setParsed(null); setAddingName(null) }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={matchedCount === 0}
          className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          Confirm & Make Teams ({matchedCount})
        </button>
      </div>
    </div>
  )
}
