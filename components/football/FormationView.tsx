"use client"

import { toBalancerPosition } from "@/lib/football-positions"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
}

// Position layout on a vertical pitch (0-100 coordinate system)
// Y: 0 = team A goal, 100 = team B goal
const POS_COORDS: Record<string, { x: number; y: number }> = {
  // Team A plays bottom half (y: 0-50), positions mirror top half
  GK_A: { x: 50, y: 8 },
  DEF_A_1: { x: 20, y: 22 }, DEF_A_2: { x: 40, y: 20 }, DEF_A_3: { x: 60, y: 20 }, DEF_A_4: { x: 80, y: 22 },
  MID_A_1: { x: 25, y: 35 }, MID_A_2: { x: 50, y: 33 }, MID_A_3: { x: 75, y: 35 },
  ATT_A_1: { x: 30, y: 45 }, ATT_A_2: { x: 50, y: 47 }, ATT_A_3: { x: 70, y: 45 },

  // Team B plays top half (y: 50-100), mirrored
  GK_B: { x: 50, y: 92 },
  DEF_B_1: { x: 80, y: 78 }, DEF_B_2: { x: 60, y: 80 }, DEF_B_3: { x: 40, y: 80 }, DEF_B_4: { x: 20, y: 78 },
  MID_B_1: { x: 75, y: 65 }, MID_B_2: { x: 50, y: 67 }, MID_B_3: { x: 25, y: 65 },
  ATT_B_1: { x: 70, y: 55 }, ATT_B_2: { x: 50, y: 53 }, ATT_B_3: { x: 30, y: 55 },
}

function assignPositions(team: TeamAssignment[], side: "A" | "B") {
  const gk = team.find((p) => p.role === "gk")
  const outfield = team.filter((p) => p.role === "outfield")
  const sub = team.find((p) => p.role === "sub")

  const defs = outfield.filter((p) => toBalancerPosition(p.position) === "DEF")
  const mids = outfield.filter((p) => toBalancerPosition(p.position) === "MID")
  const atts = outfield.filter((p) => toBalancerPosition(p.position) === "ATT")
  // Unassigned go to midfield
  const rest = outfield.filter((p) => !defs.includes(p) && !mids.includes(p) && !atts.includes(p))
  mids.push(...rest)

  const positioned: { player: TeamAssignment; x: number; y: number }[] = []

  if (gk) positioned.push({ player: gk, ...POS_COORDS[`GK_${side}`] })

  const defSlots = [1, 2, 3, 4].map((i) => POS_COORDS[`DEF_${side}_${i}`])
  defs.forEach((p, i) => {
    const slot = defSlots[Math.floor(i * defSlots.length / Math.max(defs.length, 1))]
    if (slot) positioned.push({ player: p, ...slot })
  })

  const midSlots = [1, 2, 3].map((i) => POS_COORDS[`MID_${side}_${i}`])
  mids.forEach((p, i) => {
    const slot = midSlots[Math.floor(i * midSlots.length / Math.max(mids.length, 1))]
    if (slot) positioned.push({ player: p, ...slot })
  })

  const attSlots = [1, 2, 3].map((i) => POS_COORDS[`ATT_${side}_${i}`])
  atts.forEach((p, i) => {
    const slot = attSlots[Math.floor(i * attSlots.length / Math.max(atts.length, 1))]
    if (slot) positioned.push({ player: p, ...slot })
  })

  return { positioned, sub }
}

function PlayerDot({ player, x, y, color }: { player: TeamAssignment; x: number; y: number; color: string }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
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
        {/* Center line */}
        <div className="absolute left-[5%] right-[5%] top-1/2 h-px" style={{ background: "rgba(255,255,255,0.3)" }} />
        {/* Center circle */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.3)" }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
        {/* Penalty areas */}
        <div className="absolute left-[20%] right-[20%] top-0 h-[12%]" style={{ border: "1px solid rgba(255,255,255,0.25)", borderTop: "none" }} />
        <div className="absolute left-[20%] right-[20%] bottom-0 h-[12%]" style={{ border: "1px solid rgba(255,255,255,0.25)", borderBottom: "none" }} />
        {/* Goal areas */}
        <div className="absolute left-[30%] right-[30%] top-0 h-[5%]" style={{ border: "1px solid rgba(255,255,255,0.2)", borderTop: "none" }} />
        <div className="absolute left-[30%] right-[30%] bottom-0 h-[5%]" style={{ border: "1px solid rgba(255,255,255,0.2)", borderBottom: "none" }} />

        {/* Team labels */}
        <div className="absolute left-2 top-2 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(249,115,22,0.8)", color: "#fff" }}>
          Team A
        </div>
        <div className="absolute right-2 bottom-2 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.8)", color: "#fff" }}>
          Team B
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
      <div className="flex gap-3">
        {a.sub && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>SUB A</span>
            <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{a.sub.name}</span>
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>{a.sub.position}</span>
          </div>
        )}
        {b.sub && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
            <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>SUB B</span>
            <span className="text-xs font-medium" style={{ color: "#1f2937" }}>{b.sub.name}</span>
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>{b.sub.position}</span>
          </div>
        )}
      </div>
    </div>
  )
}
