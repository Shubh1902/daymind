import { toBalancerPosition } from "./football-positions"

export type FifaStats = {
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
}

export const STAT_LABELS: { key: keyof FifaStats; label: string; short: string; color: string }[] = [
  { key: "pace", label: "Pace", short: "PAC", color: "#22c55e" },
  { key: "shooting", label: "Shooting", short: "SHO", color: "#ef4444" },
  { key: "passing", label: "Passing", short: "PAS", color: "#3b82f6" },
  { key: "dribbling", label: "Dribbling", short: "DRI", color: "#f59e0b" },
  { key: "defending", label: "Defending", short: "DEF", color: "#6366f1" },
  { key: "physical", label: "Physical", short: "PHY", color: "#ec4899" },
]

/**
 * Compute overall rating from 6 FIFA attributes.
 * Weights vary by position area — attackers weight shooting higher, defenders weight defending, etc.
 */
export function computeOverall(stats: FifaStats, position: string): number {
  const area = toBalancerPosition(position)
  let weights: number[]

  switch (area) {
    case "GK":
      weights = [0.10, 0.05, 0.15, 0.10, 0.35, 0.25] // DEF + PHY heavy
      break
    case "DEF":
      weights = [0.15, 0.05, 0.15, 0.10, 0.35, 0.20] // DEF heavy
      break
    case "MID":
      weights = [0.15, 0.15, 0.25, 0.20, 0.10, 0.15] // PAS + DRI heavy
      break
    case "ATT":
      weights = [0.20, 0.30, 0.15, 0.20, 0.05, 0.10] // SHO + PAC heavy
      break
    default:
      weights = [1/6, 1/6, 1/6, 1/6, 1/6, 1/6]
  }

  const vals = [stats.pace, stats.shooting, stats.passing, stats.dribbling, stats.defending, stats.physical]
  const total = vals.reduce((sum, v, i) => sum + v * weights[i], 0)
  return Math.round(total)
}

/**
 * Composite score for team balancing.
 * Uses position-weighted overall + physical as stamina factor.
 */
export function compositeBalanceScore(stats: FifaStats, position: string): number {
  const overall = computeOverall(stats, position)
  const staminaFactor = stats.physical / 99 // 0-1 range
  return overall * (0.85 + 0.15 * staminaFactor) // physical gives up to 15% boost
}

/** Get rating tier color */
export function ratingColor(rating: number): string {
  if (rating >= 85) return "#22c55e" // green — elite
  if (rating >= 70) return "#3b82f6" // blue — good
  if (rating >= 55) return "#f59e0b" // amber — average
  return "#ef4444" // red — low
}
