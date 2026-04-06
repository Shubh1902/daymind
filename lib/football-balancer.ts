import { type Constraint } from "./football-instructions"
import { toBalancerPosition } from "./football-positions"
import { compositeBalanceScore as fifaComposite, type FifaStats } from "./football-rating"

type Player = {
  id: string
  name: string
  position: string
  skill: number
  workRate: string
  pace?: number; shooting?: number; passing?: number; dribbling?: number; defending?: number; physical?: number
}

export type TeamAssignment = {
  playerId: string
  name: string
  position: string
  skill: number
  workRate: string
  role: "outfield" | "gk" | "sub"
  dedicatedGK?: boolean // true if player's actual position is GK
}

export type GeneratedTeams = {
  teamA: TeamAssignment[]
  teamB: TeamAssignment[]
  balanceScore: number
}

function compositeScore(p: Player): number {
  if (p.pace != null && p.shooting != null && p.passing != null && p.dribbling != null && p.defending != null && p.physical != null) {
    return fifaComposite(
      { pace: p.pace, shooting: p.shooting, passing: p.passing, dribbling: p.dribbling, defending: p.defending, physical: p.physical },
      p.position
    )
  }
  const WORK_RATE_MULT: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }
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
 * Generate two balanced 8v8 teams.
 *
 * Rules:
 * - Each team ALWAYS has a GK (dedicated or rotation from outfield)
 * - 8v8: 1 GK + 7 outfield per team (8 total per team)
 * - Extras beyond 16 are subs
 * - If no dedicated GKs: lowest-rated outfield player on each team rotates as GK
 * - If 1 dedicated GK: that team gets them, other team picks rotation GK
 * - If 2+ dedicated GKs: one per team, extras play outfield
 * - Team with dedicated GK has slight defence advantage (factored into balance)
 */
export function generateTeams(players: Player[], constraints: Constraint[]): GeneratedTeams {
  if (players.length < 4) {
    throw new Error("Need at least 4 players to make teams")
  }

  // Step 1: Identify GKs
  const dedicatedGKs = players.filter((p) => toBalancerPosition(p.position) === "GK")
  const outfieldPlayers = players.filter((p) => toBalancerPosition(p.position) !== "GK")

  // Assign dedicated GKs
  let gkA: Player | null = null
  let gkB: Player | null = null
  let gkADedicated = false
  let gkBDedicated = false
  const extraGKsToOutfield: Player[] = []

  if (dedicatedGKs.length >= 2) {
    const sortedGKs = [...dedicatedGKs].sort((a, b) => b.skill - a.skill)
    gkA = sortedGKs[0]; gkADedicated = true
    gkB = sortedGKs[1]; gkBDedicated = true
    extraGKsToOutfield.push(...sortedGKs.slice(2))
  } else if (dedicatedGKs.length === 1) {
    gkA = dedicatedGKs[0]; gkADedicated = true
    // gkB will be assigned from outfield later
  }
  // If 0 dedicated GKs, both will be assigned from outfield later

  // All outfield-eligible players
  const allOutfield = [...outfieldPlayers, ...extraGKsToOutfield]

  // Step 2: Constraints
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

  // Step 3: Calculate team sizes
  // For 8v8: each team needs 7 outfield + 1 GK = 8
  // Total outfield needed = 14, remaining are subs
  // But we support flexible counts too
  const totalPlaying = allOutfield.length + (gkA ? 0 : 0) + (gkB ? 0 : 0) // GKs are separate
  const halfOutfield = Math.floor(allOutfield.length / 2)
  const teamAOutfieldSize = halfOutfield
  const teamBOutfieldSize = allOutfield.length - halfOutfield

  // Step 4: Snake draft
  const sorted = shuffle(allOutfield).sort((a, b) => compositeScore(b) - compositeScore(a))

  const teamAIds = new Set<string>()
  const teamBIds = new Set<string>()
  let scoreA = 0
  let scoreB = 0

  // Forced assignments
  for (const p of sorted) {
    const forced = forceTeam.get(p.id)
    if (forced === "A" && teamAIds.size < teamAOutfieldSize) {
      teamAIds.add(p.id); scoreA += compositeScore(p)
    } else if (forced === "B" && teamBIds.size < teamBOutfieldSize) {
      teamBIds.add(p.id); scoreB += compositeScore(p)
    }
  }

  // Draft remaining
  for (const p of sorted) {
    if (teamAIds.has(p.id) || teamBIds.has(p.id)) continue
    const canA = teamAIds.size < teamAOutfieldSize
    const canB = teamBIds.size < teamBOutfieldSize
    if (!canA && !canB) break
    if (!canA) { teamBIds.add(p.id); scoreB += compositeScore(p); continue }
    if (!canB) { teamAIds.add(p.id); scoreA += compositeScore(p); continue }

    let preferA = scoreA <= scoreB
    const wouldViolate = (targetSet: Set<string>, otherSet: Set<string>): boolean => {
      for (const [a, b] of mustSeparate) {
        if ((p.id === a && targetSet.has(b)) || (p.id === b && targetSet.has(a))) return true
      }
      for (const [a, b] of mustPair) {
        if ((p.id === a && otherSet.has(b)) || (p.id === b && otherSet.has(a))) return true
      }
      return false
    }
    if (preferA && wouldViolate(teamAIds, teamBIds)) preferA = false
    if (!preferA && wouldViolate(teamBIds, teamAIds)) preferA = true

    if (preferA) { teamAIds.add(p.id); scoreA += compositeScore(p) }
    else { teamBIds.add(p.id); scoreB += compositeScore(p) }
  }

  // Step 5: Assign rotation GKs from outfield if needed
  // Pick the lowest-rated outfield player from each team that needs a GK
  function pickRotationGK(ids: Set<string>): Player | null {
    const teamPlayers = allOutfield.filter((p) => ids.has(p.id))
    if (teamPlayers.length === 0) return null
    // Prefer defenders for rotation GK, then lowest overall
    const defenders = teamPlayers.filter((p) => toBalancerPosition(p.position) === "DEF")
    const pool = defenders.length > 0 ? defenders : teamPlayers
    pool.sort((a, b) => compositeScore(a) - compositeScore(b))
    return pool[0]
  }

  if (!gkB) {
    const rotGK = pickRotationGK(teamBIds)
    if (rotGK) {
      gkB = rotGK
      teamBIds.delete(rotGK.id)
      gkBDedicated = false
    }
  }
  if (!gkA) {
    const rotGK = pickRotationGK(teamAIds)
    if (rotGK) {
      gkA = rotGK
      teamAIds.delete(rotGK.id)
      gkADedicated = false
    }
  }

  // Step 6: Position balance
  function positionCount(ids: Set<string>, pos: string): number {
    return allOutfield.filter((p) => ids.has(p.id) && toBalancerPosition(p.position) === pos).length
  }

  for (const pos of ["DEF", "MID", "ATT"]) {
    const countA = positionCount(teamAIds, pos)
    const countB = positionCount(teamBIds, pos)
    if (countA === 0 && countB >= 2) {
      const donor = allOutfield.find((p) => teamBIds.has(p.id) && toBalancerPosition(p.position) === pos)
      const mostCommonPos = ["DEF", "MID", "ATT"].reduce((best, p2) =>
        positionCount(teamAIds, p2) > positionCount(teamAIds, best) ? p2 : best
      )
      const receiver = allOutfield.find((p) => teamAIds.has(p.id) && toBalancerPosition(p.position) === mostCommonPos && positionCount(teamAIds, mostCommonPos) > 1)
      if (donor && receiver) {
        teamBIds.delete(donor.id); teamAIds.add(donor.id)
        teamAIds.delete(receiver.id); teamBIds.add(receiver.id)
      }
    } else if (countB === 0 && countA >= 2) {
      const donor = allOutfield.find((p) => teamAIds.has(p.id) && toBalancerPosition(p.position) === pos)
      const mostCommonPos = ["DEF", "MID", "ATT"].reduce((best, p2) =>
        positionCount(teamBIds, p2) > positionCount(teamBIds, best) ? p2 : best
      )
      const receiver = allOutfield.find((p) => teamBIds.has(p.id) && toBalancerPosition(p.position) === mostCommonPos && positionCount(teamBIds, mostCommonPos) > 1)
      if (donor && receiver) {
        teamAIds.delete(donor.id); teamBIds.add(donor.id)
        teamBIds.delete(receiver.id); teamAIds.add(receiver.id)
      }
    }
  }

  // Step 7: Build final teams — 8v8 format
  // For each team: GK + up to 7 outfield = 8, rest are subs
  function buildTeam(ids: Set<string>, gk: Player | null, isDedicatedGK: boolean): TeamAssignment[] {
    const members = allOutfield
      .filter((p) => ids.has(p.id))
      .sort((a, b) => compositeScore(b) - compositeScore(a))

    const result: TeamAssignment[] = []

    // GK is always slot 1
    if (gk) {
      result.push({
        playerId: gk.id, name: gk.name, position: gk.position,
        skill: gk.skill, workRate: gk.workRate, role: "gk",
        dedicatedGK: isDedicatedGK,
      })
    }

    // Outfield: first 7 are starters, rest are subs (for 8v8)
    const maxOutfield = 7
    members.forEach((p, i) => {
      result.push({
        playerId: p.id, name: p.name, position: p.position,
        skill: p.skill, workRate: p.workRate,
        role: i < maxOutfield ? "outfield" : "sub",
      })
    })

    return result
  }

  const teamA = buildTeam(teamAIds, gkA, gkADedicated)
  const teamB = buildTeam(teamBIds, gkB, gkBDedicated)

  // Step 8: Balance score
  // Team with dedicated GK gets a 3% defence boost for balance consideration
  const allPlayersMap = new Map(players.map((p) => [p.id, p]))
  let totalA = teamA.reduce((s, a) => {
    const orig = allPlayersMap.get(a.playerId)
    return s + (orig ? compositeScore(orig) : a.skill)
  }, 0)
  let totalB = teamB.reduce((s, a) => {
    const orig = allPlayersMap.get(a.playerId)
    return s + (orig ? compositeScore(orig) : a.skill)
  }, 0)

  // Dedicated GK bonus for balance calculation
  if (gkADedicated && !gkBDedicated) totalA *= 1.03
  if (gkBDedicated && !gkADedicated) totalB *= 1.03

  const maxTotal = Math.max(totalA, totalB, 1)
  const balanceScore = Math.round((100 - Math.abs(totalA - totalB) / maxTotal * 100) * 10) / 10

  return { teamA, teamB, balanceScore }
}
