export type Constraint =
  | { type: "separate"; playerNames: [string, string] }
  | { type: "pair"; playerNames: [string, string] }
  | { type: "force_team"; playerName: string; team: "A" | "B" }

/**
 * Parse free-text instructions into actionable constraints.
 * Best-effort — unknown patterns are silently ignored.
 */
export function parseInstructions(text: string, rosterNames: string[]): Constraint[] {
  if (!text?.trim()) return []

  const constraints: Constraint[] = []
  const lower = text.toLowerCase()
  const sentences = lower.split(/[.\n;]+/).map((s) => s.trim()).filter(Boolean)
  const namesLower = rosterNames.map((n) => n.toLowerCase())

  function findName(fragment: string): string | null {
    // Try exact match first, then substring
    for (let i = 0; i < namesLower.length; i++) {
      if (fragment.includes(namesLower[i])) return rosterNames[i]
    }
    // Try first-name match
    for (let i = 0; i < namesLower.length; i++) {
      const firstName = namesLower[i].split(" ")[0]
      if (firstName.length >= 3 && fragment.includes(firstName)) return rosterNames[i]
    }
    return null
  }

  function findTwoNames(sentence: string): [string, string] | null {
    const found: string[] = []
    for (let i = 0; i < namesLower.length; i++) {
      const firstName = namesLower[i].split(" ")[0]
      if (sentence.includes(namesLower[i]) || (firstName.length >= 3 && sentence.includes(firstName))) {
        found.push(rosterNames[i])
      }
      if (found.length === 2) break
    }
    return found.length === 2 ? [found[0], found[1]] : null
  }

  for (const sentence of sentences) {
    // SEPARATE: "separate X and Y", "X and Y different teams", "split X and Y"
    if (/separate|apart|different\s*team|split\s*up|split|opposit/.test(sentence)) {
      const names = findTwoNames(sentence)
      if (names) constraints.push({ type: "separate", playerNames: names })
      continue
    }

    // PAIR: "keep X and Y together", "X and Y same team", "pair X with Y"
    if (/together|same\s*team|pair|with\s*each\s*other/.test(sentence)) {
      const names = findTwoNames(sentence)
      if (names) constraints.push({ type: "pair", playerNames: names })
      continue
    }

    // FORCE_TEAM: "X on team A", "put X in team B", "X team 1"
    const teamMatch = sentence.match(/team\s*(a|b|1|2|one|two)/i)
    if (teamMatch) {
      const team = ["a", "1", "one"].includes(teamMatch[1].toLowerCase()) ? "A" as const : "B" as const
      const name = findName(sentence)
      if (name) constraints.push({ type: "force_team", playerName: name, team })
    }
  }

  return constraints
}
