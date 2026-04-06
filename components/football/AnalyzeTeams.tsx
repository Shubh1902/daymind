"use client"

import { useState } from "react"
import { parseTeamMessage, type ParsedTeamImport } from "@/lib/football-import-parser"
import { getPositionColor } from "@/lib/football-positions"
import { compareTeams } from "@/lib/football-comparison"

type Player = {
  id: string; name: string; position: string; skill: number; workRate: string; [key: string]: unknown
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  players: Player[]
}

const WR: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }

function calcBalance(team: { skill: number; workRate: string }[]): number {
  return team.reduce((s, p) => s + p.skill * (WR[p.workRate] ?? 1), 0)
}

export default function AnalyzeTeams({ players }: Props) {
  const [step, setStep] = useState<"paste" | "result">("paste")
  const [text, setText] = useState("")
  const [parsed, setParsed] = useState<ParsedTeamImport | null>(null)
  const [autoResult, setAutoResult] = useState<{ teamA: TeamAssignment[]; teamB: TeamAssignment[]; balanceScore: number } | null>(null)
  const [loading, setLoading] = useState(false)

  function handleParse() {
    if (!text.trim()) return
    const result = parseTeamMessage(text, players)
    setParsed(result)
    setStep("result")
  }

  // Build team assignments from parsed data
  function buildAssignments(parsedTeam: typeof parsed extends null ? never : NonNullable<typeof parsed>["teamA"]): TeamAssignment[] {
    return parsedTeam
      .filter((p) => p.matchedPlayer)
      .map((p, i) => ({
        playerId: p.matchedPlayer!.id,
        name: p.matchedPlayer!.name,
        position: p.matchedPlayer!.position,
        skill: (p.matchedPlayer as any)?.skill ?? 50,
        workRate: (p.matchedPlayer as any)?.workRate ?? "Med",
        role: i === 0 ? "gk" : "outfield" as string, // first player is often GK
      }))
  }

  async function handleAutoCompare() {
    if (!parsed) return
    setLoading(true)
    const allIds = [...parsed.teamA, ...parsed.teamB]
      .filter((p) => p.matchedPlayer)
      .map((p) => p.matchedPlayer!.id)

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

  if (step === "paste") {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
          Paste someone else's team sheet
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Team Black ⚫️:\n1. Soum\n2. Shreyes\n3. Abhinav\n...\n\nTeam White ⚪️:\n1. Girish\n2. Elan\n3. Vishal\n..."}
          rows={12}
          className="input-dark w-full text-sm px-4 py-3 rounded-xl resize-none"
          autoFocus
        />
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>🔍</span> Analyze Balance
        </button>
      </div>
    )
  }

  if (!parsed) return null

  const teamAMatched = parsed.teamA.filter((p) => p.matchedPlayer)
  const teamBMatched = parsed.teamB.filter((p) => p.matchedPlayer)

  const scoreA = teamAMatched.reduce((s, p) => s + (p.matchedPlayer as any).skill * (WR[(p.matchedPlayer as any).workRate] ?? 1), 0)
  const scoreB = teamBMatched.reduce((s, p) => s + (p.matchedPlayer as any).skill * (WR[(p.matchedPlayer as any).workRate] ?? 1), 0)
  const maxScore = Math.max(scoreA, scoreB, 1)
  const balanceScore = Math.round((100 - Math.abs(scoreA - scoreB) / maxScore * 100) * 10) / 10

  const stronger = scoreA > scoreB ? parsed.teamAName : scoreB > scoreA ? parsed.teamBName : null

  // Swap suggestions
  const manualA = buildAssignments(parsed.teamA)
  const manualB = buildAssignments(parsed.teamB)
  const comparison = autoResult
    ? compareTeams(manualA, manualB, autoResult.teamA, autoResult.teamB)
    : null

  function TeamSection({ name, team, score, accent }: { name: string; team: typeof parsed.teamA; score: number; accent: string }) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${accent}30` }}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${accent}10` }}>
          <span className="text-sm font-bold" style={{ color: accent }}>{name}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>
            {Math.round(score)} pts
          </span>
        </div>
        <div className="p-2 space-y-1">
          {team.map((p, i) => {
            const matched = p.matchedPlayer
            const pc = matched ? getPositionColor(matched.position) : { color: "#9ca3af", bg: "#f3f4f6" }
            return (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: matched ? pc.bg : "#fef2f2", border: `1px solid ${matched ? `${pc.color}20` : "#fecaca"}` }}>
                <span className="text-[10px] font-bold w-8" style={{ color: pc.color }}>{matched?.position ?? "?"}</span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{p.rawName}</span>
                {matched && p.rawName.toLowerCase() !== matched.name.toLowerCase() && (
                  <span className="text-[10px]" style={{ color: "#9ca3af" }}>→ {matched.name}</span>
                )}
                <span className="text-xs font-bold" style={{ color: pc.color }}>{(matched as any)?.skill ?? "?"}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Match info */}
      {parsed.matchInfo && (
        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
          ⚽ {parsed.matchInfo}
        </div>
      )}

      {/* Balance verdict */}
      <div className="text-center py-3 rounded-xl" style={{
        background: balanceScore >= 90 ? "#ecfdf5" : balanceScore >= 75 ? "#fef3c7" : "#fef2f2",
        border: `1px solid ${balanceScore >= 90 ? "#a7f3d0" : balanceScore >= 75 ? "#fde68a" : "#fecaca"}`,
      }}>
        <p className="text-2xl font-black" style={{ color: balanceScore >= 90 ? "#059669" : balanceScore >= 75 ? "#d97706" : "#dc2626" }}>
          {balanceScore}%
        </p>
        <p className="text-xs font-medium" style={{ color: "#6b7280" }}>
          {balanceScore >= 90 ? "Well balanced!" : balanceScore >= 75 ? "Somewhat balanced" : "Unbalanced"}
          {stronger && ` — ${stronger} is stronger`}
        </p>
      </div>

      {/* Teams side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TeamSection name={parsed.teamAName} team={parsed.teamA} score={scoreA} accent="#f97316" />
        <TeamSection name={parsed.teamBName} team={parsed.teamB} score={scoreB} accent="#8b5cf6" />
      </div>

      {/* Auto compare */}
      {!autoResult ? (
        <button
          onClick={handleAutoCompare}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>🤖 Compare with auto-balanced teams</>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-2 rounded-xl" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <p className="text-xs font-bold" style={{ color: "#0369a1" }}>
              Algorithm's balance: <span className="text-sm">{autoResult.balanceScore}%</span> vs These teams: <span className="text-sm">{balanceScore}%</span>
            </p>
          </div>

          {/* Swap suggestions */}
          {comparison && comparison.suggestedSwaps.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#1f2937" }}>Suggested swaps to improve balance:</p>
              <div className="space-y-1.5">
                {comparison.suggestedSwaps.slice(0, 5).map((swap, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="flex-1 text-xs">
                      <span className="font-medium" style={{ color: "#1f2937" }}>
                        Swap <strong>{swap.playerA.name}</strong> ↔ <strong>{swap.playerB.name}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: "#16a34a" }}>+{swap.improvement}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison && comparison.suggestedSwaps.length === 0 && balanceScore >= 90 && (
            <div className="text-center py-3 rounded-xl" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              <span className="text-sm font-bold" style={{ color: "#059669" }}>✅ Teams are already well balanced — no swaps needed!</span>
            </div>
          )}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => { setStep("paste"); setParsed(null); setAutoResult(null) }}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
      >
        Analyze Another
      </button>
    </div>
  )
}
