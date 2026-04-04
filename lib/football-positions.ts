export type PositionGroup = {
  area: string
  color: string
  bg: string
  positions: { id: string; label: string }[]
}

export const POSITION_GROUPS: PositionGroup[] = [
  {
    area: "Goal",
    color: "#d97706",
    bg: "#fef3c7",
    positions: [{ id: "GK", label: "GK" }],
  },
  {
    area: "Defense",
    color: "#2563eb",
    bg: "#dbeafe",
    positions: [
      { id: "CB", label: "CB" },
      { id: "LB", label: "LB" },
      { id: "RB", label: "RB" },
      { id: "LWB", label: "LWB" },
      { id: "RWB", label: "RWB" },
    ],
  },
  {
    area: "Midfield",
    color: "#16a34a",
    bg: "#dcfce7",
    positions: [
      { id: "CDM", label: "CDM" },
      { id: "CM", label: "CM" },
      { id: "CAM", label: "CAM" },
      { id: "LM", label: "LM" },
      { id: "RM", label: "RM" },
      { id: "LW", label: "LW" },
      { id: "RW", label: "RW" },
    ],
  },
  {
    area: "Attack",
    color: "#dc2626",
    bg: "#fee2e2",
    positions: [
      { id: "ST", label: "ST" },
      { id: "CF", label: "CF" },
      { id: "SS", label: "SS" },
    ],
  },
]

export const ALL_POSITIONS = POSITION_GROUPS.flatMap((g) => g.positions.map((p) => p.id))

/** Get the area (Goal/Defense/Midfield/Attack) for a position ID */
export function getPositionArea(posId: string): string {
  for (const g of POSITION_GROUPS) {
    if (g.positions.some((p) => p.id === posId)) return g.area
  }
  return "Midfield"
}

/** Get color for a position */
export function getPositionColor(posId: string): { color: string; bg: string } {
  for (const g of POSITION_GROUPS) {
    if (g.positions.some((p) => p.id === posId)) return { color: g.color, bg: g.bg }
  }
  return { color: "#6b7280", bg: "#f3f4f6" }
}

/** Map detailed positions to balancer categories (GK/DEF/MID/ATT) */
export function toBalancerPosition(posId: string): string {
  const area = getPositionArea(posId)
  switch (area) {
    case "Goal": return "GK"
    case "Defense": return "DEF"
    case "Midfield": return "MID"
    case "Attack": return "ATT"
    default: return "MID"
  }
}
