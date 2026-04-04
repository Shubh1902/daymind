"use client"

import { useState, useEffect, useCallback } from "react"
import AddPlayerForm from "./AddPlayerForm"
import PlayerRoster from "./PlayerRoster"
import GameSetup from "./GameSetup"
import TeamDisplay from "./TeamDisplay"

type Player = {
  id: string; name: string; position: string; positions?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

type GeneratedResult = {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
  gameId: string
}

type View = "roster" | "setup" | "result"

export default function FootballApp({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [view, setView] = useState<View>("roster")
  const [result, setResult] = useState<GeneratedResult | null>(null)

  const fetchPlayers = useCallback(async () => {
    const res = await fetch("/api/football/players")
    if (res.ok) setPlayers(await res.json())
  }, [])

  return (
    <div className="space-y-5">
      {/* View tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: "#f3f4f6" }}>
        <button
          onClick={() => setView("roster")}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: view === "roster" ? "#ffffff" : "transparent",
            color: view === "roster" ? "#1f2937" : "#9ca3af",
            boxShadow: view === "roster" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>👥</span> Roster
        </button>
        <button
          onClick={() => { setView("setup"); setResult(null) }}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: view === "setup" ? "#ffffff" : "transparent",
            color: view === "setup" ? "#1f2937" : "#9ca3af",
            boxShadow: view === "setup" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <span>⚽</span> Make Teams
        </button>
        {result && (
          <button
            onClick={() => setView("result")}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: view === "result" ? "#ffffff" : "transparent",
              color: view === "result" ? "#1f2937" : "#9ca3af",
              boxShadow: view === "result" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <span>📋</span> Teams
          </button>
        )}
      </div>

      {/* Roster view */}
      {view === "roster" && (
        <div className="space-y-4 animate-fade-in">
          <AddPlayerForm onAdded={fetchPlayers} />
          <PlayerRoster players={players} onRefresh={fetchPlayers} />
          {players.length >= 4 && (
            <button
              onClick={() => setView("setup")}
              className="w-full btn-primary text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>⚽</span> Set Up Game ({players.length} players available)
            </button>
          )}
        </div>
      )}

      {/* Setup view */}
      {view === "setup" && (
        <div className="animate-fade-in">
          <GameSetup
            players={players}
            onTeamsGenerated={(res) => {
              setResult(res)
              setView("result")
            }}
          />
        </div>
      )}

      {/* Result view */}
      {view === "result" && result && (
        <div className="animate-fade-in">
          <TeamDisplay
            teamA={result.teamA}
            teamB={result.teamB}
            balanceScore={result.balanceScore}
            gameId={result.gameId}
            onRegenerate={() => setView("setup")}
            onBack={() => setView("setup")}
          />
        </div>
      )}
    </div>
  )
}
