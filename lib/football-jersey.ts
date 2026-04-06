export type JerseyColor = {
  id: string
  label: string
  hex: string       // main color
  text: string      // text color on that background
  bg: string        // lighter version for cards
  border: string    // border color
}

export const JERSEY_COLORS: JerseyColor[] = [
  { id: "black", label: "Black", hex: "#1f2937", text: "#ffffff", bg: "#374151", border: "#4b5563" },
  { id: "white", label: "White", hex: "#f9fafb", text: "#1f2937", bg: "#ffffff", border: "#d1d5db" },
  { id: "red", label: "Red", hex: "#dc2626", text: "#ffffff", bg: "#fee2e2", border: "#fca5a5" },
  { id: "blue", label: "Blue", hex: "#2563eb", text: "#ffffff", bg: "#dbeafe", border: "#93c5fd" },
  { id: "green", label: "Green", hex: "#16a34a", text: "#ffffff", bg: "#dcfce7", border: "#86efac" },
  { id: "yellow", label: "Yellow", hex: "#eab308", text: "#1f2937", bg: "#fef9c3", border: "#fde047" },
  { id: "orange", label: "Orange", hex: "#f97316", text: "#ffffff", bg: "#fff7ed", border: "#fdba74" },
  { id: "purple", label: "Purple", hex: "#8b5cf6", text: "#ffffff", bg: "#f5f3ff", border: "#c4b5fd" },
  { id: "pink", label: "Pink", hex: "#ec4899", text: "#ffffff", bg: "#fce7f3", border: "#f9a8d4" },
  { id: "cyan", label: "Cyan", hex: "#06b6d4", text: "#ffffff", bg: "#ecfeff", border: "#67e8f9" },
  { id: "grey", label: "Grey", hex: "#6b7280", text: "#ffffff", bg: "#f3f4f6", border: "#9ca3af" },
  { id: "maroon", label: "Maroon", hex: "#991b1b", text: "#ffffff", bg: "#fef2f2", border: "#dc2626" },
]

const colorMap = new Map(JERSEY_COLORS.map((c) => [c.id, c]))

export function getJerseyColor(id: string): JerseyColor {
  return colorMap.get(id) ?? JERSEY_COLORS[0] // default black
}

/** Try to detect jersey color from a team name like "Team Black ⚫️" */
export function detectJerseyColor(teamName: string): string {
  const lower = teamName.toLowerCase()
  for (const c of JERSEY_COLORS) {
    if (lower.includes(c.id) || lower.includes(c.label.toLowerCase())) return c.id
  }
  // Check for color emojis
  if (lower.includes("⚫") || lower.includes("🖤")) return "black"
  if (lower.includes("⚪") || lower.includes("🤍")) return "white"
  if (lower.includes("🔴") || lower.includes("❤")) return "red"
  if (lower.includes("🔵") || lower.includes("💙")) return "blue"
  if (lower.includes("🟢") || lower.includes("💚")) return "green"
  if (lower.includes("🟡") || lower.includes("💛")) return "yellow"
  if (lower.includes("🟠") || lower.includes("🧡")) return "orange"
  if (lower.includes("🟣") || lower.includes("💜")) return "purple"
  return ""
}
