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
 * 8v8 formation: 1 GK + 3 DEF + 2 MID + 2 ATT (default 3-2-2)
 *
 * If players don't fit the default formation, redistribute logically:
 * - Too many MIDs, not enough DEFs → move a MID to DEF
 * - Too many ATTs → move one to MID/Wing
 * - etc.
 *
 * Formation slots define Y positions on the pitch.
 */

type FormationSlot = { role: "GK" | "DEF" | "MID" | "ATT"; x: number; y: number }

// Default 3-2-2 formation for one side (y: 0=goal, 50=midfield)
const FORMATION_3_2_2: FormationSlot[] = [
  { role: "GK", x: 50, y: 8 },
  { role: "DEF", x: 20, y: 24 },
  { role: "DEF", x: 50, y: 22 },
  { role: "DEF", x: 80, y: 24 },
  { role: "MID", x: 30, y: 36 },
  { role: "MID", x: 70, y: 36 },
  { role: "ATT", x: 25, y: 47 },
  { role: "ATT", x: 75, y: 47 },
]

function distributeX(count: number): number[] {
  if (count === 0) return []
  if (count === 1) return [50]
  const margin = 15
  const spread = 100 - 2 * margin
  return Array.from({ length: count }, (_, i) => margin + (spread * i) / (count - 1))
}

function assignToFormation(team: TeamAssignment[], side: "A" | "B") {
  const gk = team.find((p) => p.role === "gk")
  const outfield = team.filter((p) => p.role === "outfield")
  const subs = team.filter((p) => p.role === "sub")

  // Categorize outfield by position area
  const defs: TeamAssignment[] = []
  const mids: TeamAssignment[] = []
  const atts: TeamAssignment[] = []

  for (const p of outfield) {
    const area = toBalancerPosition(p.position)
    if (area === "DEF") defs.push(p)
    else if (area === "ATT") atts.push(p)
    else mids.push(p) // MID + unknown
  }

  // Target formation: 3 DEF, 2 MID, 2 ATT = 7 outfield
  // Redistribute if counts don't match
  const targetDef = 3, targetMid = 2, targetAtt = 2
  const totalOutfield = outfield.length

  // If we have more or fewer than 7 outfield, adapt
  // Priority: fill DEF first, then MID, then ATT
  let finalDefs = [...defs]
  let finalMids = [...mids]
  let finalAtts = [...atts]

  // If short on DEFs, pull from MIDs (defensive mids) or ATTs
  while (finalDefs.length < Math.min(targetDef, totalOutfield - 2) && finalMids.length > 1) {
    finalDefs.push(finalMids.pop()!)
  }
  while (finalDefs.length < Math.min(targetDef, totalOutfield - 1) && finalAtts.length > 1) {
    finalDefs.push(finalAtts.pop()!)
  }

  // If short on ATTs, pull from MIDs
  while (finalAtts.length < Math.min(targetAtt, totalOutfield - finalDefs.length - 1) && finalMids.length > targetMid) {
    finalAtts.push(finalMids.pop()!)
  }

  // If too many DEFs (more than 3), move extras to MID
  while (finalDefs.length > 3 && totalOutfield > 4) {
    finalMids.unshift(finalDefs.pop()!)
  }

  // If too many ATTs (more than 3), move extras to MID
  while (finalAtts.length > 3) {
    finalMids.unshift(finalAtts.pop()!)
  }

  // Ensure at least 1 in each non-empty line
  if (finalDefs.length === 0 && finalMids.length > 1) finalDefs.push(finalMids.shift()!)
  if (finalAtts.length === 0 && finalMids.length > 1) finalAtts.push(finalMids.pop()!)

  // Y positions for each line
  const yFlip = side === "B"
  const yGK = yFlip ? 92 : 8
  const yDef = yFlip ? 78 : 22
  const yMid = yFlip ? 65 : 36
  const yAtt = yFlip ? 54 : 47

  const positioned: { player: TeamAssignment; x: number; y: number; displayRole: string }[] = []

  // GK
  if (gk) positioned.push({ player: gk, x: 50, y: yGK, displayRole: "GK" })

  // DEF line
  const defXs = distributeX(finalDefs.length)
  finalDefs.forEach((p, i) => positioned.push({ player: p, x: defXs[i], y: yDef, displayRole: "DEF" }))

  // MID line
  const midXs = distributeX(finalMids.length)
  finalMids.forEach((p, i) => positioned.push({ player: p, x: midXs[i], y: yMid, displayRole: "MID" }))

  // ATT line (wings)
  const attXs = distributeX(finalAtts.length)
  finalAtts.forEach((p, i) => positioned.push({ player: p, x: attXs[i], y: yAtt, displayRole: "ATT" }))

  return { positioned, subs, formation: `${finalDefs.length}-${finalMids.length}-${finalAtts.length}` }
}

function PlayerDot({ player, x, y, color, displayRole }: { player: TeamAssignment; x: number; y: number; color: string; displayRole: string }) {
  const isRepositioned = toBalancerPosition(player.position) !== displayRole && displayRole !== "GK"
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
        style={{ background: color, border: isRepositioned ? "2px solid #fbbf24" : "2px solid rgba(255,255,255,0.5)" }}
        title={isRepositioned ? `${player.position} playing as ${displayRole}` : player.position}
      >
        {player.skill}
      </div>
      <span className="text-[9px] font-bold mt-0.5 px-1 rounded whitespace-nowrap" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
        {player.name.split(" ")[0]}
      </span>
      <span className="text-[8px] font-bold" style={{ color: isRepositioned ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>
        {player.position}{isRepositioned ? `→${displayRole}` : ""}
      </span>
    </div>
  )
}

export default function FormationView({ teamA, teamB }: Props) {
  const a = assignToFormation(teamA, "A")
  const b = assignToFormation(teamB, "B")

  return (
    <div className="space-y-3">
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

        {/* Team labels with formation */}
        <div className="absolute left-2 top-2 px-2 py-0.5 rounded text-[10px] font-bold z-20" style={{ background: "rgba(249,115,22,0.8)", color: "#fff" }}>
          A ({a.formation})
        </div>
        <div className="absolute right-2 bottom-2 px-2 py-0.5 rounded text-[10px] font-bold z-20" style={{ background: "rgba(139,92,246,0.8)", color: "#fff" }}>
          B ({b.formation})
        </div>

        {/* Team A */}
        {a.positioned.map((p) => (
          <PlayerDot key={p.player.playerId} player={p.player} x={p.x} y={p.y} color="#ea580c" displayRole={p.displayRole} />
        ))}

        {/* Team B */}
        {b.positioned.map((p) => (
          <PlayerDot key={p.player.playerId} player={p.player} x={p.x} y={p.y} color="#7c3aed" displayRole={p.displayRole} />
        ))}
      </div>

      {/* Legend for repositioned players */}
      <div className="flex items-center gap-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.5)", background: "#ea580c" }} />
          <span className="text-[10px]" style={{ color: "#9ca3af" }}>Natural position</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ border: "2px solid #fbbf24", background: "#ea580c" }} />
          <span className="text-[10px]" style={{ color: "#fbbf24" }}>Repositioned</span>
        </div>
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
