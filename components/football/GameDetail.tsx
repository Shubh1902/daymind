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

  // Picker state
  const [scorerPicker, setScorerPicker] = useState<"A" | "B" | null>(null)
  const [assistPicker, setAssistPicker] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list")
  const [showJerseyEdit, setShowJerseyEdit] = useState(false)

  const jA = getJerseyColor(jerseyA)
  const jB = getJerseyColor(jerseyB)
  const teamA = game.teamAPlayers ?? []
  const teamB = game.teamBPlayers ?? []
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

      {/* Score editor */}
      <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ background: jA.hex, border: `2px solid ${jA.border}` }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setScoreA((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
              <span className="text-3xl font-black w-10 text-center" style={{ color: jA.hex }}>{scoreA}</span>
              <button onClick={() => setScorerPicker("A")} className="w-8 h-8 rounded-lg text-sm font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>Team A</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: "#d1d5db" }}>:</span>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ background: jB.hex, border: `2px solid ${jB.border}` }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setScoreB((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>-</button>
              <span className="text-3xl font-black w-10 text-center" style={{ color: jB.hex }}>{scoreB}</span>
              <button onClick={() => setScorerPicker("B")} className="w-8 h-8 rounded-lg text-sm font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>+</button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>Team B</p>
          </div>
        </div>

        {/* Scorer note */}
        <p className="text-[10px] text-center mt-1" style={{ color: "#d1d5db" }}>
          Tap + to add goal with scorer, or use - to adjust score without scorer
        </p>
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

      {/* Goals list */}
      {(goals.length > 0 || scoreA + scoreB > goals.length) && (
        <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#1f2937" }}>
            Goals ({goals.length} recorded{scoreA + scoreB > goals.length ? `, ${scoreA + scoreB - goals.length} unattributed` : ""})
          </p>
          <div className="space-y-1.5">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: g.team === "A" ? jA.bg : jB.bg, border: `1px solid ${g.team === "A" ? jA.border : jB.border}` }}>
                <span className="text-sm">⚽</span>
                <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{g.playerName || "Unknown"}</span>
                {g.assistName ? (
                  <button onClick={() => removeAssist(i)} className="text-[10px] flex items-center gap-0.5 px-1 rounded" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    🅰️ {g.assistName} ×
                  </button>
                ) : g.playerId ? (
                  <button onClick={() => setAssistPicker(i)} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
                    + assist
                  </button>
                ) : null}
                <span className="text-[10px] font-bold ml-auto px-1 rounded" style={{ color: g.team === "A" ? jA.hex : jB.hex }}>{g.team}</span>
                <button onClick={() => removeGoal(i)} className="text-xs" style={{ color: "#d1d5db" }}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* List view */}
      {viewMode === "list" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: jA.hex }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: jA.hex }} /> Team A
            </p>
            <div className="space-y-0.5">
              {teamA.map((p, i) => {
                const pc = getPositionColor(p.position)
                return (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: p.role === "sub" ? "#f3f4f6" : pc.bg }}>
                    <span className="font-bold text-[10px]" style={{ color: pc.color }}>{p.role === "gk" ? "GK" : p.role === "sub" ? "SUB" : p.position}</span>
                    <span className="font-medium flex-1 truncate" style={{ color: p.role === "sub" ? "#9ca3af" : "#1f2937" }}>{p.name}</span>
                    <span className="font-bold text-[10px]" style={{ color: "#6b7280" }}>{p.skill}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: jB.hex }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: jB.hex }} /> Team B
            </p>
            <div className="space-y-0.5">
              {teamB.map((p, i) => {
                const pc = getPositionColor(p.position)
                return (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: p.role === "sub" ? "#f3f4f6" : pc.bg }}>
                    <span className="font-bold text-[10px]" style={{ color: pc.color }}>{p.role === "gk" ? "GK" : p.role === "sub" ? "SUB" : p.position}</span>
                    <span className="font-medium flex-1 truncate" style={{ color: p.role === "sub" ? "#9ca3af" : "#1f2937" }}>{p.name}</span>
                    <span className="font-bold text-[10px]" style={{ color: "#6b7280" }}>{p.skill}</span>
                  </div>
                )
              })}
            </div>
          </div>
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
