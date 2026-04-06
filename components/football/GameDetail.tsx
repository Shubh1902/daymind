"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getJerseyColor } from "@/lib/football-jersey"
import { getPositionColor } from "@/lib/football-positions"
import JerseyPicker from "./JerseyPicker"
import FormationView from "./FormationView"

type TeamPlayer = { name: string; position: string; skill: number; role: string; playerId?: string; workRate?: string }
type GoalData = {
  id: string; team: string; playerId: string; assistPlayerId: string | null; minute: number | null
  player: { id: string; name: string }; assistPlayer: { id: string; name: string } | null
}
type SimplePlayer = { id: string; name: string; position: string; skill: number }

type GameData = {
  id: string; name: string | null
  teamAPlayers: TeamPlayer[]; teamBPlayers: TeamPlayer[]
  jerseyA: string | null; jerseyB: string | null
  scoreA: number | null; scoreB: number | null
  completed: boolean; balanceScore: number | null
  createdAt: string; goals: GoalData[]
}

interface Props { game: GameData; allPlayers: SimplePlayer[] }

export default function GameDetail({ game: initialGame, allPlayers }: Props) {
  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Editable state
  const [scoreA, setScoreA] = useState(game.scoreA ?? 0)
  const [scoreB, setScoreB] = useState(game.scoreB ?? 0)
  const [jerseyA, setJerseyA] = useState(game.jerseyA ?? "orange")
  const [jerseyB, setJerseyB] = useState(game.jerseyB ?? "purple")
  const [goals, setGoals] = useState(game.goals.map((g) => ({
    playerId: g.playerId, playerName: g.player.name,
    team: g.team, assistPlayerId: g.assistPlayerId, assistName: g.assistPlayer?.name,
  })))

  // Editable teams
  const [editTeamA, setEditTeamA] = useState(game.teamAPlayers ?? [])
  const [editTeamB, setEditTeamB] = useState(game.teamBPlayers ?? [])

  // Picker state
  const [scorerPicker, setScorerPicker] = useState<"A" | "B" | null>(null)
  const [assistPicker, setAssistPicker] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list")
  const [showJerseyEdit, setShowJerseyEdit] = useState(false)
  const [replacingPlayer, setReplacingPlayer] = useState<{ team: "A" | "B"; index: number } | null>(null)

  const jA = getJerseyColor(jerseyA)
  const jB = getJerseyColor(jerseyB)
  const teamA = editTeamA
  const teamB = editTeamB
  const playersA = teamA.filter((p) => p.role !== "sub" && p.playerId)
  const playersB = teamB.filter((p) => p.role !== "sub" && p.playerId)

  function addGoal(playerId: string | null, playerName: string, team: string) {
    setGoals((prev) => [...prev, { playerId: playerId ?? "", playerName, team, assistPlayerId: undefined, assistName: undefined }])
    if (team === "A") setScoreA((s) => s + 1)
    else setScoreB((s) => s + 1)
    setScorerPicker(null)
  }

  function addAnonymousGoal(team: string) {
    // Add score without knowing the scorer
    if (team === "A") setScoreA((s) => s + 1)
    else setScoreB((s) => s + 1)
    setScorerPicker(null)
  }

  function removeGoal(index: number) {
    const g = goals[index]
    setGoals((prev) => prev.filter((_, i) => i !== index))
    if (g.team === "A") setScoreA((s) => Math.max(0, s - 1))
    else setScoreB((s) => Math.max(0, s - 1))
  }

  function setAssist(goalIndex: number, playerId: string, name: string) {
    setGoals((prev) => prev.map((g, i) => i === goalIndex ? { ...g, assistPlayerId: playerId, assistName: name } : g))
    setAssistPicker(null)
  }

  function removePlayer(team: "A" | "B", index: number) {
    if (team === "A") setEditTeamA((prev) => prev.filter((_, i) => i !== index))
    else setEditTeamB((prev) => prev.filter((_, i) => i !== index))
  }

  function replacePlayer(team: "A" | "B", index: number, newPlayer: SimplePlayer) {
    const replacement: TeamPlayer = {
      name: newPlayer.name, position: newPlayer.position, skill: newPlayer.skill,
      role: "outfield", playerId: newPlayer.id, workRate: "Med",
    }
    if (team === "A") setEditTeamA((prev) => prev.map((p, i) => i === index ? replacement : p))
    else setEditTeamB((prev) => prev.map((p, i) => i === index ? replacement : p))
    setReplacingPlayer(null)
  }

  function swapPlayerBetweenTeams(fromTeam: "A" | "B", index: number) {
    const player = fromTeam === "A" ? editTeamA[index] : editTeamB[index]
    if (!player) return
    if (fromTeam === "A") {
      setEditTeamA((prev) => prev.filter((_, i) => i !== index))
      setEditTeamB((prev) => [...prev, player])
    } else {
      setEditTeamB((prev) => prev.filter((_, i) => i !== index))
      setEditTeamA((prev) => [...prev, player])
    }
  }

  function removeAssist(goalIndex: number) {
    setGoals((prev) => prev.map((g, i) => i === goalIndex ? { ...g, assistPlayerId: undefined, assistName: undefined } : g))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/football/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA, scoreB, jerseyA, jerseyB,
          teamAPlayers: editTeamA,
          teamBPlayers: editTeamB,
          goals: goals.filter((g) => g.playerId).map((g) => ({
            playerId: g.playerId, team: g.team,
            assistPlayerId: g.assistPlayerId || null,
          })),
        }),
      })
      setLastSaved(new Date().toLocaleTimeString())
      router.refresh()
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Are there unsaved changes?
  const hasChanges = scoreA !== (game.scoreA ?? 0) || scoreB !== (game.scoreB ?? 0)
    || jerseyA !== (game.jerseyA ?? "orange") || jerseyB !== (game.jerseyB ?? "purple")
    || goals.length !== game.goals.length
    || editTeamA.length !== (game.teamAPlayers ?? []).length
    || editTeamB.length !== (game.teamBPlayers ?? []).length
    || JSON.stringify(editTeamA.map((p) => p.playerId)) !== JSON.stringify((game.teamAPlayers ?? []).map((p: any) => p.playerId))
    || JSON.stringify(editTeamB.map((p) => p.playerId)) !== JSON.stringify((game.teamBPlayers ?? []).map((p: any) => p.playerId))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 animate-slide-up">
        <Link href="/football" className="p-2 rounded-lg shrink-0" style={{ background: "#f3f4f6", color: "#374151" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: "#1f2937" }}>
            {game.name ?? "Game Details"}
          </h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            {new Date(game.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {" · "}
            {new Date(game.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        {lastSaved && (
          <span className="text-[10px] shrink-0" style={{ color: "#22c55e" }}>Saved {lastSaved}</span>
        )}
      </div>

      {/* Match card — professional style */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Scoreboard header */}
        <div className="px-4 py-5" style={{ background: "linear-gradient(135deg, #1f2937, #374151)" }}>
          <div className="flex items-center justify-center gap-5">
            {/* Team A */}
            <div className="flex-1 text-right flex flex-col items-end gap-1">
              <div className="w-12 h-12 rounded-full" style={{ background: jA.hex, border: `3px solid ${jA.hex === "#f9fafb" ? "#d1d5db" : "rgba(255,255,255,0.3)"}` }} />
              <p className="text-xs font-bold text-white opacity-80">Team A</p>
            </div>
            {/* Score */}
            <div className="flex items-center gap-3">
              <button onClick={() => setScoreA((s) => Math.max(0, s - 1))} className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>-</button>
              <span className="text-4xl font-black text-white tracking-tight">{scoreA}</span>
              <span className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>-</span>
              <span className="text-4xl font-black text-white tracking-tight">{scoreB}</span>
              <button onClick={() => setScoreB((s) => Math.max(0, s - 1))} className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>-</button>
            </div>
            {/* Team B */}
            <div className="flex-1 text-left flex flex-col items-start gap-1">
              <div className="w-12 h-12 rounded-full" style={{ background: jB.hex, border: `3px solid ${jB.hex === "#f9fafb" ? "#d1d5db" : "rgba(255,255,255,0.3)"}` }} />
              <p className="text-xs font-bold text-white opacity-80">Team B</p>
            </div>
          </div>
          {/* FT badge */}
          <div className="text-center mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
              {game.completed ? "FT" : "IN PROGRESS"}
            </span>
          </div>
        </div>

        {/* Goal timeline — professional match style */}
        {(goals.length > 0 || scoreA + scoreB > 0) && (
          <div className="px-4 py-3">
            {/* Column headers */}
            <div className="flex items-center mb-2 pb-2" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <span className="text-[10px] font-bold text-right" style={{ width: "calc(50% - 12px)", color: jA.hex }}>Team A</span>
              <div className="w-6 shrink-0" />
              <span className="text-[10px] font-bold text-left" style={{ width: "calc(50% - 12px)", color: jB.hex }}>Team B</span>
            </div>

            {/* Goals displayed like a match timeline */}
            <div>
              {goals.map((g, i) => (
                <div key={i} className="flex items-center group" style={{ minHeight: "36px" }}>
                  {/* Team A side (right-aligned) */}
                  <div className="flex items-center justify-end gap-1.5" style={{ width: "calc(50% - 12px)" }}>
                    {g.team === "A" && (
                      <>
                        <button onClick={() => removeGoal(i)} className="text-[10px] opacity-40 sm:opacity-0 sm:group-hover:opacity-60 transition-opacity shrink-0" style={{ color: "#ef4444" }}>×</button>
                        {g.assistName ? (
                          <button onClick={() => removeAssist(i)} className="text-[10px] truncate" style={{ color: "#9ca3af" }}>({g.assistName})</button>
                        ) : g.playerId ? (
                          <button onClick={() => setAssistPicker(i)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "#d1d5db" }}>+A</button>
                        ) : null}
                        <span className="text-xs font-bold truncate" style={{ color: "#1f2937" }}>{g.playerName || "?"}</span>
                        <span className="text-xs shrink-0">⚽</span>
                      </>
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="w-6 flex justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full" style={{ background: g.team === "A" ? jA.hex : jB.hex, boxShadow: "0 0 0 2px #fff, 0 0 0 3px #e5e7eb" }} />
                  </div>

                  {/* Team B side (left-aligned) */}
                  <div className="flex items-center gap-1.5" style={{ width: "calc(50% - 12px)" }}>
                    {g.team === "B" && (
                      <>
                        <span className="text-xs shrink-0">⚽</span>
                        <span className="text-xs font-bold truncate" style={{ color: "#1f2937" }}>{g.playerName || "?"}</span>
                        {g.assistName ? (
                          <button onClick={() => removeAssist(i)} className="text-[10px] truncate" style={{ color: "#9ca3af" }}>({g.assistName})</button>
                        ) : g.playerId ? (
                          <button onClick={() => setAssistPicker(i)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "#d1d5db" }}>+A</button>
                        ) : null}
                        <button onClick={() => removeGoal(i)} className="text-[10px] opacity-40 sm:opacity-0 sm:group-hover:opacity-60 transition-opacity shrink-0 ml-auto" style={{ color: "#ef4444" }}>×</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Unattributed goals note */}
            {scoreA + scoreB > goals.length && (
              <p className="text-[10px] text-center mt-2 py-1 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>
                {scoreA + scoreB - goals.length} goal{scoreA + scoreB - goals.length > 1 ? "s" : ""} without scorer recorded
              </p>
            )}
          </div>
        )}

        {/* Add goal buttons */}
        <div className="flex border-t" style={{ borderColor: "#f3f4f6" }}>
          <button
            onClick={() => setScorerPicker("A")}
            className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:bg-gray-50"
            style={{ color: jA.hex, borderRight: "1px solid #f3f4f6" }}
          >
            ⚽ Add Goal (A)
          </button>
          <button
            onClick={() => setScorerPicker("B")}
            className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:bg-gray-50"
            style={{ color: jB.hex }}
          >
            ⚽ Add Goal (B)
          </button>
        </div>
      </div>

      {/* Goal scorer picker */}
      {scorerPicker && (
        <div className="rounded-xl p-3 animate-slide-up" style={{ border: `2px solid ${scorerPicker === "A" ? jA.hex : jB.hex}` }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#6b7280" }}>Who scored? (Team {scorerPicker})</p>
          <div className="flex flex-wrap gap-1.5">
            {(scorerPicker === "A" ? playersA : playersB).map((p) => {
              const pc = getPositionColor(p.position)
              return (
                <button key={p.playerId} onClick={() => addGoal(p.playerId!, p.name, scorerPicker)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}>
                  {p.name}
                </button>
              )
            })}
            <button onClick={() => addAnonymousGoal(scorerPicker)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              Unknown scorer
            </button>
            <button onClick={() => setScorerPicker(null)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assist picker */}
      {assistPicker !== null && goals[assistPicker] && (
        <div className="rounded-xl p-3 animate-slide-up" style={{ border: "2px solid #22c55e" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#6b7280" }}>Who assisted?</p>
          <div className="flex flex-wrap gap-1.5">
            {(goals[assistPicker].team === "A" ? playersA : playersB)
              .filter((p) => p.playerId !== goals[assistPicker].playerId)
              .map((p) => (
                <button key={p.playerId} onClick={() => setAssist(assistPicker, p.playerId!, p.name)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
                  {p.name}
                </button>
              ))}
            <button onClick={() => setAssistPicker(null)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
              No assist
            </button>
          </div>
        </div>
      )}

      {/* (Goals are now inside the match card above) */}

      {/* Jersey colors */}
      <button onClick={() => setShowJerseyEdit(!showJerseyEdit)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <span className="text-xs font-semibold" style={{ color: "#6b7280" }}>Jersey Colors</span>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full" style={{ background: jA.hex, border: `1px solid ${jA.border}` }} />
          <span className="w-5 h-5 rounded-full" style={{ background: jB.hex, border: `1px solid ${jB.border}` }} />
          <svg className="w-3 h-3" style={{ color: "#9ca3af", transform: showJerseyEdit ? "rotate(180deg)" : "" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {showJerseyEdit && (
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <JerseyPicker label="Team A" selected={jerseyA} onChange={setJerseyA} />
          <JerseyPicker label="Team B" selected={jerseyB} onChange={setJerseyB} />
        </div>
      )}

      {/* Teams view toggle */}
      <div className="flex gap-2 justify-center">
        <button onClick={() => setViewMode("list")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: viewMode === "list" ? "#fff7ed" : "#f9fafb", color: viewMode === "list" ? "#9a3412" : "#9ca3af", border: viewMode === "list" ? "1.5px solid #f97316" : "1px solid #e5e7eb" }}>📋 List</button>
        <button onClick={() => setViewMode("pitch")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: viewMode === "pitch" ? "#dcfce7" : "#f9fafb", color: viewMode === "pitch" ? "#166534" : "#9ca3af", border: viewMode === "pitch" ? "1.5px solid #22c55e" : "1px solid #e5e7eb" }}>⚽ Pitch</button>
      </div>

      {/* Pitch view */}
      {viewMode === "pitch" && (
        <FormationView
          teamA={teamA.map((p) => ({ ...p, playerId: p.playerId ?? p.name, workRate: p.workRate ?? "Med" }))}
          teamB={teamB.map((p) => ({ ...p, playerId: p.playerId ?? p.name, workRate: p.workRate ?? "Med" }))}
          colorA={jA.hex} colorB={jB.hex}
        />
      )}

      {/* List view with edit controls */}
      {viewMode === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([["A", teamA, jA, editTeamA, setEditTeamA] as const, ["B", teamB, jB, editTeamB, setEditTeamB] as const]).map(([team, players, jersey]) => (
            <div key={team}>
              <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: jersey.hex }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: jersey.hex }} /> Team {team} ({players.length})
              </p>
              <div className="space-y-1">
                {players.map((p, i) => {
                  const pc = getPositionColor(p.position)
                  const isReplacing = replacingPlayer?.team === team && replacingPlayer?.index === i
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs group" style={{ background: p.role === "sub" ? "#f3f4f6" : pc.bg, border: "1px solid transparent" }}>
                        <span className="font-bold text-[10px] w-6" style={{ color: pc.color }}>{p.role === "gk" ? "GK" : p.role === "sub" ? "SUB" : p.position}</span>
                        <span className="font-medium flex-1 truncate" style={{ color: p.role === "sub" ? "#9ca3af" : "#1f2937" }}>{p.name}</span>
                        <span className="font-bold text-[10px]" style={{ color: "#9ca3af" }}>{p.skill}</span>
                        {/* Edit controls — visible on tap/hover */}
                        <div className="flex gap-0.5 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => swapPlayerBetweenTeams(team, i)} title={`Move to Team ${team === "A" ? "B" : "A"}`} className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                            <span className="text-[9px]">↔</span>
                          </button>
                          <button onClick={() => setReplacingPlayer({ team, index: i })} title="Replace" className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                            <span className="text-[9px]">🔄</span>
                          </button>
                          <button onClick={() => removePlayer(team, i)} title="Remove" className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                            <span className="text-[9px]">×</span>
                          </button>
                        </div>
                      </div>
                      {/* Replace picker */}
                      {isReplacing && (
                        <div className="ml-2 mt-1 p-2 rounded-lg animate-slide-up" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: "#6b7280" }}>Replace {p.name} with:</p>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {allPlayers
                              .filter((ap) => !editTeamA.some((t) => t.playerId === ap.id) && !editTeamB.some((t) => t.playerId === ap.id))
                              .map((ap) => (
                                <button key={ap.id} onClick={() => replacePlayer(team, i, ap)} className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                                  {ap.name} ({ap.skill})
                                </button>
                              ))}
                            <button onClick={() => setReplacingPlayer(null)} className="px-2 py-1 rounded text-[10px]" style={{ color: "#9ca3af" }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${hasChanges ? "btn-primary text-white" : ""}`}
          style={hasChanges ? {} : { background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb" }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasChanges ? (
            <>💾 Save Changes</>
          ) : (
            <>✅ Up to date</>
          )}
        </button>
      </div>
    </div>
  )
}
