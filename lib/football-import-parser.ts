type Player = { id: string; name: string; position: string; [key: string]: unknown }

export type ParsedPlayer = {
  rawName: string
  matchedPlayer: Player | null
  confidence: number // 0-1
  section: "confirmed" | "gk" | "waitlisted"
}

export type ParsedImport = {
  matchInfo: string | null
  confirmed: ParsedPlayer[]
  goalkeepers: ParsedPlayer[]
  waitlisted: ParsedPlayer[]
  unrecognized: ParsedPlayer[]
}

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** Fuzzy match a raw name against the roster */
export function fuzzyMatchPlayer(rawName: string, roster: Player[]): { player: Player; confidence: number } | null {
  const raw = rawName.toLowerCase().trim()
  if (!raw) return null

  let bestMatch: Player | null = null
  let bestConfidence = 0

  for (const p of roster) {
    const name = p.name.toLowerCase().trim()

    // Exact match
    if (raw === name) return { player: p, confidence: 1.0 }

    // Prefix match (either direction): "shubh" matches "shubhanshu"
    if (name.startsWith(raw) || raw.startsWith(name)) {
      const conf = Math.min(raw.length, name.length) / Math.max(raw.length, name.length)
      if (conf > bestConfidence) { bestMatch = p; bestConfidence = Math.max(conf, 0.8) }
      continue
    }

    // First name match
    const firstName = name.split(" ")[0]
    const rawFirst = raw.split(" ")[0]
    if (firstName === rawFirst || firstName.startsWith(rawFirst) || rawFirst.startsWith(firstName)) {
      const conf = Math.min(rawFirst.length, firstName.length) / Math.max(rawFirst.length, firstName.length)
      if (conf > bestConfidence) { bestMatch = p; bestConfidence = Math.max(conf, 0.75) }
      continue
    }

    // Levenshtein distance
    const dist = levenshtein(raw, name)
    const maxLen = Math.max(raw.length, name.length)
    const threshold = maxLen >= 5 ? 2 : 1
    if (dist <= threshold) {
      const conf = 1 - dist / maxLen
      if (conf > bestConfidence) { bestMatch = p; bestConfidence = conf }
    }

    // Also try against first name only
    const firstDist = levenshtein(rawFirst, firstName)
    const firstMaxLen = Math.max(rawFirst.length, firstName.length)
    if (firstDist <= 1 && firstMaxLen >= 3) {
      const conf = 0.7 + (1 - firstDist / firstMaxLen) * 0.2
      if (conf > bestConfidence) { bestMatch = p; bestConfidence = conf }
    }
  }

  return bestMatch && bestConfidence >= 0.5 ? { player: bestMatch, confidence: bestConfidence } : null
}

/** Parse a WhatsApp-style match message into structured player lists */
export function parseMatchMessage(text: string, roster: Player[]): ParsedImport {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { matchInfo: null, confirmed: [], goalkeepers: [], waitlisted: [], unrecognized: [] }

  let matchInfo: string | null = null
  let currentSection: "confirmed" | "gk" | "waitlisted" = "confirmed"

  const confirmed: ParsedPlayer[] = []
  const goalkeepers: ParsedPlayer[] = []
  const waitlisted: ParsedPlayer[] = []
  const usedPlayerIds = new Set<string>()

  for (const line of lines) {
    const lower = line.toLowerCase()

    // Detect section headers
    if (/^gk\s*:/.test(lower) || /^goalkeeper/i.test(lower)) {
      currentSection = "gk"
      continue
    }
    if (/^wl\s*:/.test(lower) || /^waitlist/i.test(lower) || /^waiting\s*list/i.test(lower)) {
      currentSection = "waitlisted"
      continue
    }

    // Try to extract a player name from the line
    // Match patterns: "1. Sajan", "1) Sajan", "⁠Robin", "- Robin", or just a name
    const nameMatch = line.match(/^\d+[.)⁠\s]*[-–—]?\s*(.+)/) || line.match(/^[-–—•]\s*(.+)/)
    let rawName = nameMatch ? nameMatch[1].trim() : null

    // If no pattern matched, check if it looks like a header line (contains date/time words)
    if (!rawName) {
      if (/match|game|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\s*(am|pm)|to\s+\d/i.test(line)) {
        if (!matchInfo) matchInfo = line
        continue
      }
      // Skip lines that look like section labels or empty indicators
      if (/^[\s\d.)\-–—]*$/.test(line) || line.length <= 1) continue
      // Treat as bare name
      rawName = line
    }

    // Skip parenthetical notes like "(Advance booking for Wednesday)"
    rawName = rawName.replace(/\(.*?\)/g, "").trim()
    if (!rawName || rawName.length < 2) continue

    // Fuzzy match
    const match = fuzzyMatchPlayer(rawName, roster.filter((p) => !usedPlayerIds.has(p.id)))

    const parsed: ParsedPlayer = {
      rawName,
      matchedPlayer: match?.player ?? null,
      confidence: match?.confidence ?? 0,
      section: currentSection,
    }

    if (match?.player) usedPlayerIds.add(match.player.id)

    switch (currentSection) {
      case "confirmed": confirmed.push(parsed); break
      case "gk": goalkeepers.push(parsed); break
      case "waitlisted": waitlisted.push(parsed); break
    }
  }

  // Separate unrecognized (low confidence or no match)
  const allParsed = [...confirmed, ...goalkeepers, ...waitlisted]
  const unrecognized = allParsed.filter((p) => !p.matchedPlayer || p.confidence < 0.5)

  return { matchInfo, confirmed, goalkeepers, waitlisted, unrecognized }
}
