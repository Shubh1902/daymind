"use client"

import { JERSEY_COLORS, type JerseyColor } from "@/lib/football-jersey"

interface Props {
  label: string
  selected: string
  onChange: (id: string) => void
}

export default function JerseyPicker({ label, selected, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5" style={{ color: "#6b7280" }}>{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {JERSEY_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className="w-8 h-8 rounded-full transition-all"
            style={{
              background: c.hex,
              border: selected === c.id ? "3px solid #f97316" : `2px solid ${c.border}`,
              boxShadow: selected === c.id ? "0 0 0 2px white, 0 0 0 4px #f97316" : "none",
            }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  )
}
