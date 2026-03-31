"use client"

type Props = {
  colors: string[] // all colorHex values from items
  activeColors: string[]
  onToggle: (hex: string) => void
  onClear: () => void
}

// Group hex colors into named color families by hue
function getColorFamily(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2 / 255

  // Neutrals: very light, very dark, or very desaturated
  if (l > 0.9) return "whites"
  if (l < 0.12) return "blacks"
  const saturation = max === 0 ? 0 : (max - min) / max
  if (saturation < 0.15) return "grays"

  // Get hue
  let h = 0
  const d = max - min
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }

  if (h < 15 || h >= 345) return "reds"
  if (h < 40) return "oranges"
  if (h < 70) return "yellows"
  if (h < 160) return "greens"
  if (h < 200) return "teals"
  if (h < 260) return "blues"
  if (h < 300) return "purples"
  return "pinks"
}

const FAMILY_ORDER = ["whites", "blacks", "grays", "reds", "pinks", "oranges", "yellows", "greens", "teals", "blues", "purples"]

export default function ColorPaletteFilter({ colors, activeColors, onToggle, onClear }: Props) {
  // Deduplicate and group
  const uniqueColors = [...new Set(colors.filter(Boolean))]
  const families = new Map<string, string[]>()

  for (const hex of uniqueColors) {
    const family = getColorFamily(hex)
    if (!families.has(family)) families.set(family, [])
    families.get(family)!.push(hex)
  }

  // Sort families by order, pick representative color per family
  const sortedFamilies = FAMILY_ORDER
    .filter((f) => families.has(f))
    .map((f) => ({
      name: f,
      colors: families.get(f)!,
      // Use the first color as representative swatch
      representative: families.get(f)![0],
    }))

  if (sortedFamilies.length === 0) return null

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold" style={{ color: "rgba(234, 88, 12, 0.6)" }}>
          Colors
        </p>
        {activeColors.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs px-1.5 py-0.5 rounded-full transition-all duration-200"
            style={{ color: "#f97316", background: "rgba(249, 115, 22, 0.1)" }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {sortedFamilies.map((family) => {
          const isActive = family.colors.some((c) => activeColors.includes(c))
          return (
            <button
              key={family.name}
              onClick={() => {
                // Toggle all colors in this family
                if (isActive) {
                  family.colors.forEach((c) => {
                    if (activeColors.includes(c)) onToggle(c)
                  })
                } else {
                  family.colors.forEach((c) => {
                    if (!activeColors.includes(c)) onToggle(c)
                  })
                }
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200"
              style={{
                background: isActive ? "rgba(249, 115, 22, 0.12)" : "var(--surface-2)",
                border: isActive ? "2px solid rgba(249, 115, 22, 0.4)" : "1px solid var(--border)",
              }}
              title={family.name}
            >
              {/* Color swatches */}
              <div className="flex -space-x-1">
                {family.colors.slice(0, 3).map((hex) => (
                  <div
                    key={hex}
                    className="w-4 h-4 rounded-full border border-white/50"
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <span
                className="text-xs capitalize"
                style={{ color: isActive ? "#ea580c" : "rgba(249, 115, 22, 0.5)" }}
              >
                {family.name}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(249, 115, 22, 0.3)" }}
              >
                {family.colors.length}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
