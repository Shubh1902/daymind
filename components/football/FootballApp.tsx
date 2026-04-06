"use client"

import { useState, useCallback } from "react"
import AddPlayerForm from "./AddPlayerForm"
import PlayerRoster from "./PlayerRoster"
import MessageImport from "./MessageImport"
import GameSetup from "./GameSetup"
import ManualTeamSetup from "./ManualTeamSetup"
import TeamDisplay from "./TeamDisplay"
import TeamComparison from "./TeamComparison"
import WaitlistBanner from "./WaitlistBanner"
import AnalyzeTeams from "./AnalyzeTeams"

type Player = {
  id: string; name: string; position: string; positions?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null; waitlisted?: boolean
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

type GeneratedResult = {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
  gameId: string
  source: "auto" | "manual"
}

type View = "roster" | "import" | "setup" | "manual" | "analyze" | "result" | "compare"

export default function FootballApp({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [view, setView] = useState<View>("roster")
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [autoResult, setAutoResult] = useState<GeneratedResult | null>(null) // for comparison
  const [preSelected, setPreSelected] = useState<Set<string> | null>(null)
  const [comparingLoading, setComparingLoading] = useState(false)

  const waitlistedPlayers = players.filter((p) => p.waitlisted)

  const fetchPlayers = useCallback(async () => {
    const res = await fetch("/api/football/players")
    if (res.ok) setPlayers(await res.json())
  }, [])

  async function clearWaitlist() {
    const waitlisted = players.filter((p) => p.waitlisted)
    await Promise.all(
      waitlisted.map((p) =>
        fetch(`/api/football/players/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlisted: false }),
        })
      )
    )
    await fetchPlayers()
  }

  function handleImportConfirm(data: { selectedIds: string[]; gkIds: string[]; waitlistedNames: string[] }) {
    setPreSelected(new Set(data.selectedIds))
    setView("setup")
  }

  async function handleCompareWithAuto() {
    if (!result) return
    setComparingLoading(true)
    try {
      const allPlayerIds = [...result.teamA, ...result.teamB].map((p) => p.playerId)
      const res = await fetch("/api/football/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: allPlayerIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setAutoResult({ teamA: data.teamA, teamB: data.teamB, balanceScore: data.balanceScore, gameId: data.id, source: "auto" })
        setView("compare")
      }
    } catch { /* ignore */ }
    setComparingLoading(false)
  }

  const tabs: { id: View; label: string; icon: string }[] = [
    { id: "roster", label: "Roster", icon: "👥" },
    { id: "import", label: "Import", icon: "📋" },
    { id: "setup", label: "Auto", icon: "🤖" },
    { id: "manual", label: "Manual", icon: "✋" },
    { id: "analyze", label: "Analyze", icon: "🔍" },
  ]

  if (result) {
    tabs.push({ id: "result", label: "Teams", icon: "⚽" })
  }

  return (
    <div className="space-y-4">
      {/* Waitlist banner */}
      <WaitlistBanner players={waitlistedPlayers} onClear={clearWaitlist} />

      {/* View tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide" style={{ background: "#f3f4f6" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "setup" || tab.id === "manual") setResult(null)
              setView(tab.id)
            }}
            className="flex-1 shrink-0 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
            style={{
              background: view === tab.id ? "#ffffff" : "transparent",
              color: view === tab.id ? "#1f2937" : "#9ca3af",
              boxShadow: view === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              minWidth: "60px",
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Roster */}
      {view === "roster" && (
        <div className="space-y-4 animate-fade-in">
          <AddPlayerForm onAdded={fetchPlayers} />
          <PlayerRoster players={players} onRefresh={fetchPlayers} />
          {players.length >= 4 && (
            <div className="flex gap-2">
              <button onClick={() => setView("import")} className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                <span>📋</span> Import Message
              </button>
              <button onClick={() => setView("setup")} className="flex-1 btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <span>⚽</span> Make Teams
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import */}
      {view === "import" && (
        <div className="animate-fade-in">
          <MessageImport
            players={players}
            onConfirm={handleImportConfirm}
            onRefreshPlayers={fetchPlayers}
          />
        </div>
      )}

      {/* Auto setup */}
      {view === "setup" && (
        <div className="animate-fade-in">
          <GameSetup
            players={players}
            initialSelected={preSelected ?? undefined}
            onTeamsGenerated={(res) => {
              setResult({ ...res, source: "auto" })
              setPreSelected(null)
              setView("result")
            }}
          />
        </div>
      )}

      {/* Manual setup */}
      {view === "manual" && (
        <div className="animate-fade-in">
          <ManualTeamSetup
            players={players}
            initialSelected={preSelected ?? undefined}
            onTeamsCreated={(res) => {
              setResult({ ...res, source: "manual" })
              setPreSelected(null)
              setView("result")
            }}
          />
        </div>
      )}

      {/* Analyze */}
      {view === "analyze" && (
        <div className="animate-fade-in">
          <AnalyzeTeams players={players} onRefreshPlayers={fetchPlayers} />
        </div>
      )}

      {/* Result */}
      {view === "result" && result && (
        <div className="animate-fade-in space-y-3">
          <TeamDisplay
            teamA={result.teamA}
            teamB={result.teamB}
            balanceScore={result.balanceScore}
            gameId={result.gameId}
            allPlayers={players}
            onRefresh={fetchPlayers}
            onRegenerate={() => setView(result.source === "manual" ? "manual" : "setup")}
            onBack={() => setView(result.source === "manual" ? "manual" : "setup")}
          />
          {result.source === "manual" && (
            <button
              onClick={handleCompareWithAuto}
              disabled={comparingLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}
            >
              {comparingLoading ? (
                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>🔍 Compare with Auto Teams</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Compare */}
      {view === "compare" && result && autoResult && (
        <div className="animate-fade-in">
          <TeamComparison
            manualA={result.teamA}
            manualB={result.teamB}
            manualBalance={result.balanceScore}
            autoA={autoResult.teamA}
            autoB={autoResult.teamB}
            autoBalance={autoResult.balanceScore}
            onBack={() => setView("result")}
          />
        </div>
      )}
    </div>
  )
}
