"use client"

import { useState, useEffect, useRef } from "react"
import { parseTeamMessage, type ParsedTeamImport, type ParsedPlayer } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"
import { compareTeams } from "@/lib/football-comparison"
import AddPlayerModal from "./AddPlayerModal"
import { detectJerseyColor, getJerseyColor } from "@/lib/football-jersey"
import PlayerSearchDropdown from "./PlayerSearchDropdown"
import FormationView from "./FormationView"

type Player = {
  id: string; name: string; position: string; skill: number; workRate: string; aliases?: string[]; [key: string]: unknown
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  players: Player[]
  onRefreshPlayers: () => Promise<void>
}

const WR: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }

export default function AnalyzeTeams({ players, onRefreshPlayers }: Props) {
  const [step, setStep] = useState<"paste" | "result">("paste")
  const [text, setText] = useState("")
  const [parsed, setParsed] = useState<ParsedTeamImport | null>(null)
  const [overrides, setOverrides] = useState<Map<string, string | null>>(new Map()) // "A-0" → playerId
  const [showPickerKey, setShowPickerKey] = useState<string | null>(null)
  const [addingName, setAddingName] = useState<string | null>(null)
  const [autoResult, setAutoResult] = useState<{ teamA: TeamAssignment[]; teamB: TeamAssignment[]; balanceScore: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [compareError, setCompareError] = useState("")
  const [swaps, setSwaps] = useState<Map<string, string>>(new Map()) // playerIdA ↔ playerIdB mapping
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saved, setSaved] = useState(false)
  const [swapSelectA, setSwapSelectA] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const needsReparse = useRef(false)

  useEffect(() => {
    if (needsReparse.current && text.trim() && step === "result") {
      setParsed(parseTeamMessage(text, players))
      setOverrides(new Map())
      needsReparse.current = false
    }
  }, [players, text, step])

  function handleParse() {
    if (!text.trim()) return
    setParsing(true)
    // Small timeout so the spinner actually renders before the sync parse blocks the thread
    setTimeout(() => {
      setParsed(parseTeamMessage(text, players))
      setOverrides(new Map())
      setStep("result")
      setParsing(false)
    }, 30)
  }

  async function handlePlayerAdded() {
    needsReparse.current = true
    await onRefreshPlayers()
    setAddingName(null)
  }

  function getEffectiveMatch(p: ParsedPlayer, key: string): Player | null {
    const override = overrides.get(key)
    if (override === null) return null
    if (override) return players.find((pl) => pl.id === override) ?? null
    return p.matchedPlayer as Player | null
  }

  async function handleAutoCompare() {
    if (!parsed) return
    setLoading(true)
    setCompareError("")
    const allIds = [...parsed.teamA, ...parsed.teamB]
      .map((p, i) => {
        const team = i < parsed.teamA.length ? "A" : "B"
        const idx = i < parsed.teamA.length ? i : i - parsed.teamA.length
        const key = `${team}-${idx}`
        return getEffectiveMatch(i < parsed.teamA.length ? parsed.teamA[idx] : parsed.teamB[idx], key)?.id
      })
      .filter(Boolean) as string[]

    if (allIds.length < 4) {
      setCompareError(`Need at least 4 matched players to compare — only ${allIds.length} matched. Fix unrecognised players above first.`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/football/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: allIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setAutoResult({ teamA: data.teamA, teamB: data.teamB, balanceScore: data.balanceScore })
      } else {
        const err = await res.json().catch(() => ({}))
        setCompareError(err.error ?? "Auto-compare failed. Try again.")
      }
    } catch {
      setCompareError("Network error. Check your connection and try again.")
    }
    setLoading(false)
  }

  // Apply a swap: move playerA to team B and playerB to team A
  function applySwap(playerAId: string, playerBId: string) {
    if (!parsed) return
    // Find which team each player is on and swap via overrides
    const allParsedList = [...parsed.teamA, ...parsed.teamB]
    let keyA: string | null = null, keyB: string | null = null

    parsed.teamA.forEach((p, i) => {
      const m = getEffectiveMatch(p, `A-${i}`)
      if (m?.id === playerAId) keyA = `A-${i}`
      if (m?.id === playerBId) keyB = `A-${i}`
    })
    parsed.teamB.forEach((p, i) => {
      const m = getEffectiveMatch(p, `B-${i}`)
      if (m?.id === playerAId) keyA = `B-${i}`
      if (m?.id === playerBId) keyB = `B-${i}`
    })

    if (keyA && keyB) {
      setOverrides((prev) => {
        const n = new Map(prev)
        n.set(keyA!, playerBId)
        n.set(keyB!, playerAId)
        return n
      })
      setAutoResult(null) // Clear auto comparison to recalculate
    }
  }

  // Build team assignments for saving
  function buildTeamAssignments() {
    if (!parsed) return null
    const teamA = parsed.teamA.map((p, i) => getEffectiveMatch(p, `A-${i}`)).filter(Boolean).map((m, i) => ({
      playerId: m!.id, name: m!.name, position: m!.position, skill: m!.skill, workRate: (m as any)?.workRate ?? "Med",
      role: i === 0 ? "gk" : "outfield" as string,
    }))
    const teamB = parsed.teamB.map((p, i) => getEffectiveMatch(p, `B-${i}`)).filter(Boolean).map((m, i) => ({
      playerId: m!.id, name: m!.name, position: m!.position, skill: m!.skill, workRate: (m as any)?.workRate ?? "Med",
      role: i === 0 ? "gk" : "outfield" as string,
    }))
    return { teamA, teamB }
  }

  async function handleAcceptTeams(): Promise<void> {
    const teams = buildTeamAssignments()
    if (!teams) return
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/football/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: teams.teamA, teamB: teams.teamB, balanceScore, name: parsed?.matchInfo ?? "Analyzed Game" }),
      })
      if (res.ok) {
        setSaved(true)
      } else {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error ?? "Failed to save. Try again.")
      }
    } catch {
      setSaveError("Network error. Check your connection and try again.")
    }
    setSaving(false)
  }

  // Save alias when user overrides a match
  async function addAliasToPlayer(playerId: string, alias: string) {
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    const currentAliases = player.aliases ?? []
    if (currentAliases.some((a) => a.toLowerCase() === alias.toLowerCase())) return
    await fetch(`/api/football/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliases: [...currentAliases, alias.trim()] }),
    }).catch(() => {})
  }

  function PlayerRow({ p, teamKey }: { p: ParsedPlayer; teamKey: string }) {
    const match = getEffectiveMatch(p, teamKey)
    const isUnrecognized = !match
    const isOverridden = overrides.has(teamKey)
    const showingPicker = showPickerKey === teamKey

    return (
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isUnrecognized ? "#fecaca" : "#f3f4f6"}` }}>
        <div className="flex items-center gap-2 px-2 py-1.5" style={{ background: isUnrecognized ? "#fef2f2" : "transparent" }}>
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: match ? (isOverridden ? "#3b82f6" : "#22c55e") : "#ef4444" }} />
          <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>
            {p.rawName}
            {match && p.rawName.toLowerCase() !== match.name.toLowerCase() && (
              <span style={{ color: isOverridden ? "#3b82f6" : "#9ca3af" }}> → {match.name}</span>
            )}
          </span>
          {match && (
            <>
              <span className="text-[10px] font-bold px-1 rounded" style={{ background: getPositionColor(match.position).bg, color: getPositionColor(match.position).color }}>{match.position}</span>
              <span className="text-[10px] font-bold" style={{ color: "#6b7280" }}>{match.skill}</span>
            </>
          )}
          <button
            onClick={() => setShowPickerKey(showingPicker ? null : teamKey)}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{
              background: isUnrecognized ? "#fff7ed" : "#f9fafb",
              color: isUnrecognized ? "#f97316" : "#9ca3af",
              border: `1px solid ${isUnrecognized ? "#fdba74" : "#e5e7eb"}`,
            }}
          >
            {isUnrecognized ? "+" : "~"}
          </button>
        </div>

        {showingPicker && (
          <PlayerSearchDropdown
            players={players}
            selectedId={match?.id}
            rawName={p.rawName}
            onSelect={(pl) => {
              setOverrides((prev) => { const n = new Map(prev); n.set(teamKey, pl.id); return n })
              setShowPickerKey(null)
              addAliasToPlayer(pl.id, p.rawName)
            }}
            onAddNew={() => { setAddingName(p.rawName); setShowPickerKey(null) }}
          />
        )}
      </div>
    )
  }

  // ── Paste ──
  if (step === "paste") {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Paste someone else's team sheet</p>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder={"Team Black ⚫️:\n1. Soum\n2. Shreyes\n...\n\nTeam White ⚪️:\n1. Girish\n2. Elan\n..."}
          rows={12} className="input-dark w-full text-sm px-4 py-3 rounded-xl resize-none" autoFocus
        />
        {!text.trim() && (
          <p className="text-xs text-center" style={{ color: "#9ca3af" }}>↑ Paste a team sheet above to get started</p>
        )}
        <button
          onClick={handleParse}
          disabled={!text.trim() || parsing}
          className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {parsing
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing…</>
            : <><span>🔍</span> Analyze Balance</>
          }
        </button>
      </div>
    )
  }

  // ── Result ──
  if (!parsed) return null

  const scoreA = parsed.teamA.reduce((s, p, i) => {
    const m = getEffectiveMatch(p, `A-${i}`)
    return s + (m ? m.skill * (WR[(m as any).workRate] ?? 1) : 0)
  }, 0)
  const scoreB = parsed.teamB.reduce((s, p, i) => {
    const m = getEffectiveMatch(p, `B-${i}`)
    return s + (m ? m.skill * (WR[(m as any).workRate] ?? 1) : 0)
  }, 0)
  const maxScore = Math.max(scoreA, scoreB, 1)
  const balanceScore = Math.round((100 - Math.abs(scoreA - scoreB) / maxScore * 100) * 10) / 10
  const stronger = scoreA > scoreB ? parsed.teamAName : scoreB > scoreA ? parsed.teamBName : null
  const matchedCount = [...parsed.teamA, ...parsed.teamB].filter((p, i) => {
    const team = i < parsed.teamA.length ? "A" : "B"
    const idx = i < parsed.teamA.length ? i : i - parsed.teamA.length
    return getEffectiveMatch(p, `${team}-${idx}`)
  }).length
  const totalCount = parsed.teamA.length + parsed.teamB.length

  // Detect jersey colors from team names
  const detectedA = detectJerseyColor(parsed.teamAName)
  const detectedB = detectJerseyColor(parsed.teamBName)
  const jA = getJerseyColor(detectedA || "orange")
  const jB = getJerseyColor(detectedB || "purple")

  return (
    <div className="space-y-4">
      {parsed.matchInfo && (
        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>⚽ {parsed.matchInfo}</div>
      )}

      {/* Balance verdict */}
      <div className="text-center py-3 rounded-xl" style={{
        background: balanceScore >= 90 ? "#ecfdf5" : balanceScore >= 75 ? "#fef3c7" : "#fef2f2",
        border: `1px solid ${balanceScore >= 90 ? "#a7f3d0" : balanceScore >= 75 ? "#fde68a" : "#fecaca"}`,
      }}>
        <p className="text-2xl font-black" style={{ color: balanceScore >= 90 ? "#059669" : balanceScore >= 75 ? "#d97706" : "#dc2626" }}>{balanceScore}%</p>
        <p className="text-xs font-medium" style={{ color: "#6b7280" }}>
          {balanceScore >= 90 ? "Well balanced!" : balanceScore >= 75 ? "Somewhat balanced" : "Unbalanced"}
          {stronger && ` — ${stronger} is stronger`}
        </p>
        <p className="text-[10px] mt-1" style={{ color: "#d1d5db" }}>{matchedCount}/{totalCount} players matched</p>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: jA.hex }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: jA.hex, border: `1px solid ${jA.border}` }} />
            {parsed.teamAName} ({Math.round(scoreA)} pts)
          </p>
          <div className="space-y-1">{parsed.teamA.map((p, i) => <PlayerRow key={`A-${i}`} p={p} teamKey={`A-${i}`} />)}</div>
        </div>
        <div>
          <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: jB.hex }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: jB.hex, border: `1px solid ${jB.border}` }} />
            {parsed.teamBName} ({Math.round(scoreB)} pts)
          </p>
          <div className="space-y-1">{parsed.teamB.map((p, i) => <PlayerRow key={`B-${i}`} p={p} teamKey={`B-${i}`} />)}</div>
        </div>
      </div>

      {/* Add Player Modal */}
      {addingName && <AddPlayerModal initialName={addingName} onSaved={handlePlayerAdded} onClose={() => setAddingName(null)} />}

      {/* Auto compare */}
      {compareError && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          ⚠️ {compareError}
        </div>
      )}
      {!autoResult ? (
        <button onClick={handleAutoCompare} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Generating…</>
            : <>🤖 Compare with auto-balanced teams</>
          }
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-2 rounded-xl" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <p className="text-xs font-bold" style={{ color: "#0369a1" }}>Algorithm: {autoResult.balanceScore}% vs These teams: {balanceScore}%</p>
          </div>
          {(() => {
            const manualA = parsed.teamA.map((p, i) => { const m = getEffectiveMatch(p, `A-${i}`); return m ? { playerId: m.id, name: m.name, position: m.position, skill: m.skill, workRate: (m as any).workRate ?? "Med", role: "outfield" } : null }).filter(Boolean) as TeamAssignment[]
            const manualB = parsed.teamB.map((p, i) => { const m = getEffectiveMatch(p, `B-${i}`); return m ? { playerId: m.id, name: m.name, position: m.position, skill: m.skill, workRate: (m as any).workRate ?? "Med", role: "outfield" } : null }).filter(Boolean) as TeamAssignment[]
            const comparison = compareTeams(manualA, manualB, autoResult.teamA, autoResult.teamB)
            return comparison.suggestedSwaps.length > 0 ? (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#1f2937" }}>Suggested swaps:</p>
                <div className="space-y-1.5">
                  {comparison.suggestedSwaps.slice(0, 5).map((swap, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <span className="flex-1 text-xs"><strong>{swap.playerA.name}</strong> ↔ <strong>{swap.playerB.name}</strong></span>
                      <span className="text-xs font-bold" style={{ color: "#16a34a" }}>+{swap.improvement}%</span>
                      <button
                        onClick={() => applySwap(swap.playerA.id, swap.playerB.id)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : balanceScore >= 90 ? (
              <div className="text-center py-3 rounded-xl" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <span className="text-sm font-bold" style={{ color: "#059669" }}>✅ Already well balanced!</span>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* Pitch view */}
      {(() => {
        const teams = buildTeamAssignments()
        if (!teams || teams.teamA.length < 2 || teams.teamB.length < 2) return null
        return (
          <details className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
            <summary className="px-3 py-2.5 cursor-pointer text-xs font-semibold flex items-center gap-2" style={{ background: "#f9fafb", color: "#6b7280" }}>
              ⚽ Pitch View
            </summary>
            <div className="p-2">
              <FormationView teamA={teams.teamA as any} teamB={teams.teamB as any} colorA={jA.hex} colorB={jB.hex} />
            </div>
          </details>
        )
      })()}

      {/* Accept / Save */}
      {saveError && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          ⚠️ {saveError}
        </div>
      )}
      {matchedCount < 4 && (
        <p className="text-xs text-center" style={{ color: "#9ca3af" }}>Match at least 4 players above to save</p>
      )}
      {!saved ? (
        <button
          onClick={handleAcceptTeams}
          disabled={saving || matchedCount < 4}
          className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            : <>✅ Accept & Save Teams</>
          }
        </button>
      ) : (
        <div className="text-center py-3 rounded-xl" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <span className="text-sm font-bold" style={{ color: "#059669" }}>✅ Teams saved!</span>
        </div>
      )}

      <button onClick={() => { setStep("paste"); setParsed(null); setAutoResult(null); setOverrides(new Map()); setSaved(false); setSwaps(new Map()) }} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
        Analyze Another
      </button>
    </div>
  )
}
