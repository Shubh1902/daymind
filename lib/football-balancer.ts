import { type Constraint } from "./football-instructions"

type Player = {
  id: string
  name: string
  position: string // GK, DEF, MID, ATT
  skill: number    // 1-10
  workRate: string  // Low, Med, High
}

export type TeamAssignment = {
  playerId: string
  name: string
  position: string
  skill: number
  workRate: string
  role: "outfield" | "gk" | "sub"
}

export type GeneratedTeams = {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
}

const WORK_RATE_MULT: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }

function compositeScore(p: Player): number {
  return p.skill * (WORK_RATE_MULT[p.workRate] ?? 1.0)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Generate two balanced teams from selected players.
 * Handles GK assignment, constraint enforcement, position balance, and subs.
 */
export function generateTeams(players: Player[], constraints: Constraint[]): GeneratedTeams {
  if (players.length < 4) {
    throw new Error("Need at least 4 players to make teams")
  }

  // Step 1: Separate GKs from outfield
  const gks = players.filter((p) => p.position === "GK")
  const outfield = players.filter((p) => p.position !== "GK")

  // Assign GKs
  let gkA: Player | null = null
  let gkB: Player | null = null
  const extraGks: Player[] = []

  if (gks.length >= 2) {
    // Sort by skill desc, assign top 2
    const sortedGks = [...gks].sort((a, b) => b.skill - a.skill)
    gkA = sortedGks[0]
    gkB = sortedGks[1]
    extraGks.push(...sortedGks.slice(2))
  } else if (gks.length === 1) {
    gkA = gks[0] // Team A gets the dedicated GK
  }

  // All outfield players (including extra GKs who play outfield)
  const allOutfield = [...outfield, ...extraGks]

  // Step 2: Build constraint lookup
  const forceTeam = new Map<string, "A" | "B">()
  const mustSeparate: [string, string][] = []
  const mustPair: [string, string][] = []

  for (const c of constraints) {
    if (c.type === "force_team") {
      const p = players.find((pl) => pl.name.toLowerCase() === c.playerName.toLowerCase())
      if (p) forceTeam.set(p.id, c.team)
    } else if (c.type === "separate") {
      const p1 = players.find((pl) => pl.name.toLowerCase() === c.playerNames[0].toLowerCase())
      const p2 = players.find((pl) => pl.name.toLowerCase() === c.playerNames[1].toLowerCase())
      if (p1 && p2) mustSeparate.push([p1.id, p2.id])
    } else if (c.type === "pair") {
      const p1 = players.find((pl) => pl.name.toLowerCase() === c.playerNames[0].toLowerCase())
      const p2 = players.find((pl) => pl.name.toLowerCase() === c.playerNames[1].toLowerCase())
      if (p1 && p2) mustPair.push([p1.id, p2.id])
    }
  }

  // Step 3: Determine team sizes
  const totalOutfield = allOutfield.length
  const halfSize = Math.floor(totalOutfield / 2)
  const teamASize = halfSize
  const teamBSize = totalOutfield - halfSize

  // Step 4: Snake draft with constraints
  const sorted = shuffle(allOutfield).sort((a, b) => compositeScore(b) - compositeScore(a))

  const teamAIds = new Set<string>()
  const teamBIds = new Set<string>()
  let scoreA = 0
  let scoreB = 0

  // Apply forced assignments first
  for (const p of sorted) {
    const forced = forceTeam.get(p.id)
    if (forced === "A" && teamAIds.size < teamASize) {
      teamAIds.add(p.id); scoreA += compositeScore(p)
    } else if (forced === "B" && teamBIds.size < teamBSize) {
      teamBIds.add(p.id); scoreB += compositeScore(p)
    }
  }

  // Draft remaining
  for (const p of sorted) {
    if (teamAIds.has(p.id) || teamBIds.has(p.id)) continue

    // Check which team can accept
    const canA = teamAIds.size < teamASize
    const canB = teamBIds.size < teamBSize

    if (!canA && !canB) break
    if (!canA) { teamBIds.add(p.id); scoreB += compositeScore(p); continue }
    if (!canB) { teamAIds.add(p.id); scoreA += compositeScore(p); continue }

    // Prefer weaker team
    let preferA = scoreA <= scoreB

    // Check constraints
    const wouldViolate = (targetSet: Set<string>, otherSet: Set<string>): boolean => {
      // Must separate: if partner is on same team
      for (const [a, b] of mustSeparate) {
        if ((p.id === a && targetSet.has(b)) || (p.id === b && targetSet.has(a))) return true
      }
      // Must pair: if partner is on other team
      for (const [a, b] of mustPair) {
        if ((p.id === a && otherSet.has(b)) || (p.id === b && otherSet.has(a))) return true
      }
      return false
    }

    if (preferA && wouldViolate(teamAIds, teamBIds)) preferA = false
    if (!preferA && wouldViolate(teamBIds, teamAIds)) preferA = true

    if (preferA) {
      teamAIds.add(p.id); scoreA += compositeScore(p)
    } else {
      teamBIds.add(p.id); scoreB += compositeScore(p)
    }
  }

  // Step 5: Position balance — ensure each team has at least 1 DEF, 1 MID, 1 ATT
  function positionCount(ids: Set<string>, pos: string): number {
    return allOutfield.filter((p) => ids.has(p.id) && p.position === pos).length
  }

  for (const pos of ["DEF", "MID", "ATT"]) {
    const countA = positionCount(teamAIds, pos)
    const countB = positionCount(teamBIds, pos)
    if (countA === 0 && countB >= 2) {
      // Swap: give A one of B's pos players for one of A's most-common position
      const donor = allOutfield.find((p) => teamBIds.has(p.id) && p.position === pos)
      const mostCommonPos = ["DEF", "MID", "ATT"].reduce((best, p2) =>
        positionCount(teamAIds, p2) > positionCount(teamAIds, best) ? p2 : best
      )
      const receiver = allOutfield.find((p) => teamAIds.has(p.id) && p.position === mostCommonPos && positionCount(teamAIds, mostCommonPos) > 1)
      if (donor && receiver) {
        teamBIds.delete(donor.id); teamAIds.add(donor.id)
        teamAIds.delete(receiver.id); teamBIds.add(receiver.id)
      }
    } else if (countB === 0 && countA >= 2) {
      const donor = allOutfield.find((p) => teamAIds.has(p.id) && p.position === pos)
      const mostCommonPos = ["DEF", "MID", "ATT"].reduce((best, p2) =>
        positionCount(teamBIds, p2) > positionCount(teamBIds, best) ? p2 : best
      )
      const receiver = allOutfield.find((p) => teamBIds.has(p.id) && p.position === mostCommonPos && positionCount(teamBIds, mostCommonPos) > 1)
      if (donor && receiver) {
        teamAIds.delete(donor.id); teamBIds.add(donor.id)
        teamBIds.delete(receiver.id); teamAIds.add(receiver.id)
      }
    }
  }

  // Step 6: Assign subs (lowest composite in each team)
  function buildTeam(ids: Set<string>, gk: Player | null): TeamAssignment[] {
    const members = allOutfield
      .filter((p) => ids.has(p.id))
      .sort((a, b) => compositeScore(b) - compositeScore(a))

    const result: TeamAssignment[] = []

    // Add GK
    if (gk) {
      result.push({ playerId: gk.id, name: gk.name, position: gk.position, skill: gk.skill, workRate: gk.workRate, role: "gk" })
    }

    // Add outfield, last one is sub
    members.forEach((p, i) => {
      result.push({
        playerId: p.id, name: p.name, position: p.position, skill: p.skill, workRate: p.workRate,
        role: i === members.length - 1 ? "sub" : "outfield",
      })
    })

    return result
  }

  const teamA = buildTeam(teamAIds, gkA)
  const teamB = buildTeam(teamBIds, gkB)

  // Step 7: Balance score
  const totalA = teamA.reduce((s, p) => s + p.skill * (WORK_RATE_MULT[p.workRate] ?? 1), 0)
  const totalB = teamB.reduce((s, p) => s + p.skill * (WORK_RATE_MULT[p.workRate] ?? 1), 0)
  const maxTotal = Math.max(totalA, totalB, 1)
  const balanceScore = Math.round((100 - Math.abs(totalA - totalB) / maxTotal * 100) * 10) / 10

  return { teamA, teamB, balanceScore }
}
