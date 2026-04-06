"use client"

import { useState, useEffect, useRef } from "react"
import { parseTeamMessage, type ParsedTeamImport, type ParsedPlayer } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"
import { compareTeams } from "@/lib/football-comparison"
import AddPlayerModal from "./AddPlayerModal"

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
    setParsed(parseTeamMessage(text, players))
    setOverrides(new Map())
    setStep("result")
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
    const allIds = [...parsed.teamA, ...parsed.teamB]
      .map((p, i) => {
        const team = i < parsed.teamA.length ? "A" : "B"
        const idx = i < parsed.teamA.length ? i : i - parsed.teamA.length
        const key = `${team}-${idx}`
        return getEffectiveMatch(i < parsed.teamA.length ? parsed.teamA[idx] : parsed.teamB[idx], key)?.id
      })
      .filter(Boolean) as string[]

    try {
      const res = await fetch("/api/football/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: allIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setAutoResult({ teamA: data.teamA, teamB: data.teamB, balanceScore: data.balanceScore })
      }
    } catch { /* ignore */ }
    setLoading(false)
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
          <div className="px-2 py-1.5 space-y-0.5 animate-slide-up" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {players.map((pl) => {
                const pc = getPositionColor(pl.position)
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      setOverrides((prev) => { const n = new Map(prev); n.set(teamKey, pl.id); return n })
                      setShowPickerKey(null)
                      addAliasToPlayer(pl.id, p.rawName)
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left"
                    style={{ background: match?.id === pl.id ? "#dbeafe" : "#fff", border: "1px solid #f3f4f6" }}
                  >
                    <span className="text-[9px] font-bold px-1 rounded" style={{ background: pc.bg, color: pc.color }}>{pl.position}</span>
                    <span className="text-[10px] font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{pl.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: "#6b7280" }}>{pl.skill}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { setAddingName(p.rawName); setShowPickerKey(null) }}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left"
              style={{ background: "#fff7ed", border: "1px solid #fdba74" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>+</span>
              <span className="text-[10px] font-medium" style={{ color: "#9a3412" }}>Add "{p.rawName}" as new player</span>
            </button>
          </div>
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
        <button onClick={handleParse} disabled={!text.trim()} className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
          <span>🔍</span> Analyze Balance
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
          <p className="text-xs font-bold mb-1.5" style={{ color: "#f97316" }}>{parsed.teamAName} ({Math.round(scoreA)} pts)</p>
          <div className="space-y-1">{parsed.teamA.map((p, i) => <PlayerRow key={`A-${i}`} p={p} teamKey={`A-${i}`} />)}</div>
        </div>
        <div>
          <p className="text-xs font-bold mb-1.5" style={{ color: "#8b5cf6" }}>{parsed.teamBName} ({Math.round(scoreB)} pts)</p>
          <div className="space-y-1">{parsed.teamB.map((p, i) => <PlayerRow key={`B-${i}`} p={p} teamKey={`B-${i}`} />)}</div>
        </div>
      </div>

      {/* Add Player Modal */}
      {addingName && <AddPlayerModal initialName={addingName} onSaved={handlePlayerAdded} onClose={() => setAddingName(null)} />}

      {/* Auto compare */}
      {!autoResult ? (
        <button onClick={handleAutoCompare} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          {loading ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <>🤖 Compare with auto-balanced teams</>}
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

      <button onClick={() => { setStep("paste"); setParsed(null); setAutoResult(null); setOverrides(new Map()) }} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
        Analyze Another
      </button>
    </div>
  )
}
