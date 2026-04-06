"use client"

import { useState, useEffect, useRef } from "react"
import { parseMatchMessage, type ParsedImport, type ParsedPlayer } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"
import AddPlayerModal from "./AddPlayerModal"

type Player = {
  id: string; name: string; position: string; positions?: string[]; skill: number; workRate: string; notes: string | null; aliases?: string[]
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
  const [overrides, setOverrides] = useState<Map<number, string | null>>(new Map()) // index → playerId or null
  const [showPickerIdx, setShowPickerIdx] = useState<number | null>(null)
  const needsReparse = useRef(false)

  useEffect(() => {
    if (needsReparse.current && text.trim() && step === "review") {
      const result = parseMatchMessage(text, players)
      setParsed(result)
      setOverrides(new Map())
      needsReparse.current = false
    }
  }, [players, text, step])

  function handleParse() {
    if (!text.trim()) return
    const result = parseMatchMessage(text, players)
    setParsed(result)
    setOverrides(new Map())
    setStep("review")
  }

  async function handlePlayerAdded() {
    needsReparse.current = true
    await onRefreshPlayers()
    setAddingName(null)
  }

  // When user adds an alias after matching to a different player
  async function addAliasToPlayer(playerId: string, alias: string) {
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    const currentAliases = player.aliases ?? []
    if (currentAliases.some((a) => a.toLowerCase() === alias.toLowerCase())) return
    await fetch(`/api/football/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliases: [...currentAliases, alias.trim()] }),
    })
  }

  function getEffectiveMatch(allParsed: ParsedPlayer[], index: number): Player | null {
    const override = overrides.get(index)
    if (override === null) return null // explicitly set to "none"
    if (override) return players.find((p) => p.id === override) ?? null
    return allParsed[index]?.matchedPlayer ?? null
  }

  function handleConfirm() {
    if (!parsed) return
    const allParsed = [...parsed.confirmed, ...parsed.goalkeepers, ...parsed.waitlisted]
    const selectedIds: string[] = []
    const gkIds: string[] = []
    const waitlistedNames: string[] = []

    let idx = 0
    for (const p of parsed.confirmed) {
      const match = getEffectiveMatch(allParsed, idx)
      if (match) selectedIds.push(match.id)
      idx++
    }
    for (const p of parsed.goalkeepers) {
      const match = getEffectiveMatch(allParsed, idx)
      if (match) {
        selectedIds.push(match.id)
        gkIds.push(match.id)
      }
      idx++
    }
    for (const p of parsed.waitlisted) {
      waitlistedNames.push(p.rawName)
      const match = getEffectiveMatch(allParsed, idx)
      if (match) {
        fetch(`/api/football/players/${match.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlisted: true }),
        }).catch(() => {})
      }
      idx++
    }

    // Save aliases for overridden matches
    overrides.forEach((playerId, index) => {
      if (playerId && allParsed[index]) {
        addAliasToPlayer(playerId, allParsed[index].rawName)
      }
    })

    onConfirm({ selectedIds, gkIds, waitlistedNames })
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

  const allParsed = [...parsed.confirmed, ...parsed.goalkeepers, ...parsed.waitlisted]
  const matchedCount = allParsed.filter((_, i) => getEffectiveMatch(allParsed, i)).length

  function PlayerRow({ p, globalIndex }: { p: ParsedPlayer; globalIndex: number }) {
    const effectiveMatch = getEffectiveMatch(allParsed, globalIndex)
    const isUnrecognized = !effectiveMatch
    const isOverridden = overrides.has(globalIndex)
    const showingPicker = showPickerIdx === globalIndex

    return (
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isUnrecognized ? "#fecaca" : "#f3f4f6"}` }}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ background: isUnrecognized ? "#fef2f2" : "#ffffff" }}
        >
          {/* Match indicator */}
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: effectiveMatch ? (isOverridden ? "#3b82f6" : "#22c55e") : "#ef4444" }} />

          {/* Name */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium" style={{ color: "#1f2937" }}>{p.rawName}</span>
            {effectiveMatch && (
              <span className="text-xs ml-1.5" style={{ color: isOverridden ? "#3b82f6" : "#6b7280" }}>
                → {effectiveMatch.name}
              </span>
            )}
          </div>

          {/* Position + skill */}
          {effectiveMatch && (
            <>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: getPositionColor(effectiveMatch.position).bg, color: getPositionColor(effectiveMatch.position).color }}>
                {effectiveMatch.position}
              </span>
              <span className="text-xs font-bold" style={{ color: "#6b7280" }}>{effectiveMatch.skill}</span>
            </>
          )}

          {/* Change / Add buttons */}
          <button
            onClick={() => setShowPickerIdx(showingPicker ? null : globalIndex)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
            style={{
              background: showingPicker ? "#dbeafe" : (isUnrecognized ? "#fff7ed" : "#f9fafb"),
              color: showingPicker ? "#2563eb" : (isUnrecognized ? "#f97316" : "#9ca3af"),
              border: `1px solid ${showingPicker ? "#93c5fd" : (isUnrecognized ? "#fdba74" : "#e5e7eb")}`,
            }}
          >
            {isUnrecognized ? "+ Match" : "Change"}
          </button>
        </div>

        {/* Picker dropdown */}
        {showingPicker && (
          <div className="px-3 py-2 space-y-1 animate-slide-up" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Match to player:</p>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {players.map((pl) => {
                const pc = getPositionColor(pl.position)
                const isCurrent = effectiveMatch?.id === pl.id
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      setOverrides((prev) => { const n = new Map(prev); n.set(globalIndex, pl.id); return n })
                      setShowPickerIdx(null)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background: isCurrent ? "#dbeafe" : "#ffffff",
                      border: isCurrent ? "1.5px solid #3b82f6" : "1px solid #f3f4f6",
                    }}
                  >
                    <span className="text-[10px] font-bold px-1 rounded" style={{ background: pc.bg, color: pc.color }}>{pl.position}</span>
                    <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{pl.name}</span>
                    {pl.aliases && pl.aliases.length > 0 && (
                      <span className="text-[9px] truncate max-w-[80px]" style={{ color: "#d1d5db" }}>
                        aka {pl.aliases.join(", ")}
                      </span>
                    )}
                    <span className="text-xs font-bold" style={{ color: "#6b7280" }}>{pl.skill}</span>
                  </button>
                )
              })}
            </div>
            {/* Add new option */}
            <button
              onClick={() => { setAddingName(p.rawName); setShowPickerIdx(null) }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left"
              style={{ background: "#fff7ed", border: "1px solid #fdba74" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>+</span>
              <span className="text-xs font-medium" style={{ color: "#9a3412" }}>Add "{p.rawName}" as new player</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  let globalIdx = 0

  return (
    <div className="space-y-4">
      {parsed.matchInfo && (
        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          ⚽ {parsed.matchInfo}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
        <span className="font-bold" style={{ color: matchedCount === allParsed.length ? "#16a34a" : "#1f2937" }}>
          {matchedCount}/{allParsed.length} matched
        </span>
        {parsed.goalkeepers.length > 0 && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>{parsed.goalkeepers.length} GK</span>
        )}
        {parsed.waitlisted.length > 0 && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>{parsed.waitlisted.length} WL</span>
        )}
      </div>

      {/* Confirmed */}
      {parsed.confirmed.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#16a34a" }}>Confirmed ({parsed.confirmed.length})</p>
          <div className="space-y-1">
            {parsed.confirmed.map((p, i) => { const idx = globalIdx++; return <PlayerRow key={idx} p={p} globalIndex={idx} /> })}
          </div>
        </div>
      )}

      {/* GKs */}
      {parsed.goalkeepers.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#d97706" }}>Goalkeepers ({parsed.goalkeepers.length})</p>
          <div className="space-y-1">
            {parsed.goalkeepers.map((p, i) => { const idx = globalIdx++; return <PlayerRow key={idx} p={p} globalIndex={idx} /> })}
          </div>
        </div>
      )}

      {/* Waitlisted */}
      {parsed.waitlisted.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#6b7280" }}>Waitlisted ({parsed.waitlisted.length})</p>
          <div className="space-y-1">
            {parsed.waitlisted.map((p, i) => { const idx = globalIdx++; return <PlayerRow key={idx} p={p} globalIndex={idx} /> })}
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {addingName && (
        <AddPlayerModal initialName={addingName} onSaved={handlePlayerAdded} onClose={() => setAddingName(null)} />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { setStep("paste"); setParsed(null); setAddingName(null); setOverrides(new Map()) }}
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
          Confirm ({matchedCount})
        </button>
      </div>
    </div>
  )
}
