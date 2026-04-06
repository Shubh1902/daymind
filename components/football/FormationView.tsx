"use client"

import { toBalancerPosition } from "@/lib/football-positions"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
}

/**
 * Distribute N players evenly across a horizontal row.
 * Returns x positions (5-95 range) for each player.
 */
function distributeX(count: number): number[] {
  if (count === 0) return []
  if (count === 1) return [50]
  const margin = 12
  const spread = 100 - 2 * margin
  return Array.from({ length: count }, (_, i) => margin + (spread * i) / (count - 1))
}

function assignPositions(team: TeamAssignment[], side: "A" | "B") {
  const gk = team.find((p) => p.role === "gk")
  const outfield = team.filter((p) => p.role === "outfield")
  const subs = team.filter((p) => p.role === "sub")

  const defs = outfield.filter((p) => toBalancerPosition(p.position) === "DEF")
  const mids = outfield.filter((p) => toBalancerPosition(p.position) === "MID")
  const atts = outfield.filter((p) => toBalancerPosition(p.position) === "ATT")
  // Unclassified go to midfield
  const rest = outfield.filter((p) => !defs.includes(p) && !mids.includes(p) && !atts.includes(p))
  mids.push(...rest)

  const positioned: { player: TeamAssignment; x: number; y: number }[] = []

  // Y positions depend on side
  // Team A: top half (GK=8%, DEF=22%, MID=35%, ATT=46%)
  // Team B: bottom half (GK=92%, DEF=78%, MID=65%, ATT=54%)
  const yGK = side === "A" ? 8 : 92
  const yDEF = side === "A" ? 22 : 78
  const yMID = side === "A" ? 35 : 65
  const yATT = side === "A" ? 46 : 54

  // GK
  if (gk) positioned.push({ player: gk, x: 50, y: yGK })

  // DEF row
  const defXs = distributeX(defs.length)
  defs.forEach((p, i) => positioned.push({ player: p, x: defXs[i], y: yDEF }))

  // MID row
  const midXs = distributeX(mids.length)
  mids.forEach((p, i) => positioned.push({ player: p, x: midXs[i], y: yMID }))

  // ATT row
  const attXs = distributeX(atts.length)
  atts.forEach((p, i) => positioned.push({ player: p, x: attXs[i], y: yATT }))

  return { positioned, subs }
}

function PlayerDot({ player, x, y, color }: { player: TeamAssignment; x: number; y: number; color: string }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
        style={{ background: color, border: "2px solid rgba(255,255,255,0.5)" }}
      >
        {player.skill}
      </div>
      <span
        className="text-[9px] font-bold mt-0.5 px-1 rounded whitespace-nowrap"
        style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
      >
        {player.name.split(" ")[0]}
      </span>
      <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
        {player.position}
      </span>
    </div>
  )
}

export default function FormationView({ teamA, teamB }: Props) {
  const a = assignPositions(teamA, "A")
  const b = assignPositions(teamB, "B")

  return (
    <div className="space-y-3">
      {/* Pitch */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          aspectRatio: "3/4",
          background: "linear-gradient(180deg, #2d8a4e 0%, #3a9d5b 25%, #2d8a4e 50%, #3a9d5b 75%, #2d8a4e 100%)",
          border: "3px solid #1a5c32",
        }}
      >
        {/* Field markings */}
        <div className="absolute left-[5%] right-[5%] top-1/2 h-px" style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.3)" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
        <div className="absolute left-[20%] right-[20%] top-0 h-[12%]" style={{ border: "1px solid rgba(255,255,255,0.25)", borderTop: "none" }} />
        <div className="absolute left-[20%] right-[20%] bottom-0 h-[12%]" style={{ border: "1px solid rgba(255,255,255,0.25)", borderBottom: "none" }} />
        <div className="absolute left-[30%] right-[30%] top-0 h-[5%]" style={{ border: "1px solid rgba(255,255,255,0.2)", borderTop: "none" }} />
        <div className="absolute left-[30%] right-[30%] bottom-0 h-[5%]" style={{ border: "1px solid rgba(255,255,255,0.2)", borderBottom: "none" }} />

        {/* Team labels */}
        <div className="absolute left-2 top-2 px-2 py-0.5 rounded text-[10px] font-bold z-20" style={{ background: "rgba(249,115,22,0.8)", color: "#fff" }}>
          Team A ({teamA.filter((p) => p.role !== "sub").length})
        </div>
        <div className="absolute right-2 bottom-2 px-2 py-0.5 rounded text-[10px] font-bold z-20" style={{ background: "rgba(139,92,246,0.8)", color: "#fff" }}>
          Team B ({teamB.filter((p) => p.role !== "sub").length})
        </div>

        {/* Team A players (orange) */}
        {a.positioned.map((p) => (
          <PlayerDot key={p.player.playerId} player={p.player} x={p.x} y={p.y} color="#ea580c" />
        ))}

        {/* Team B players (purple) */}
        {b.positioned.map((p) => (
          <PlayerDot key={p.player.playerId} player={p.player} x={p.x} y={p.y} color="#7c3aed" />
        ))}
      </div>

      {/* Subs */}
      {(a.subs.length > 0 || b.subs.length > 0) && (
        <div className="flex gap-3">
          {a.subs.length > 0 && (
            <div className="flex-1 space-y-1">
              {a.subs.map((sub) => (
                <div key={sub.playerId} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>SUB</span>
                  <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{sub.name}</span>
                  <span className="text-[10px]" style={{ color: "#9ca3af" }}>{sub.position}</span>
                </div>
              ))}
            </div>
          )}
          {b.subs.length > 0 && (
            <div className="flex-1 space-y-1">
              {b.subs.map((sub) => (
                <div key={sub.playerId} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>SUB</span>
                  <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{sub.name}</span>
                  <span className="text-[10px]" style={{ color: "#9ca3af" }}>{sub.position}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
