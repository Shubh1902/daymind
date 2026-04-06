"use client"

type Player = { id: string; name: string; position: string }

interface Props {
  players: Player[]
  onClear: () => void
}

export default function WaitlistBanner({ players, onClear }: Props) {
  if (players.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
      <span className="text-sm shrink-0">⏳</span>
      <div className="flex-1 flex flex-wrap gap-1">
        <span className="text-xs font-bold" style={{ color: "#92400e" }}>Waitlisted:</span>
        {players.map((p) => (
          <span key={p.id} className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#fff", color: "#92400e" }}>
            {p.name}
          </span>
        ))}
      </div>
      <button
        onClick={onClear}
        className="text-[10px] font-medium px-2 py-1 rounded-lg shrink-0"
        style={{ background: "#fff", color: "#92400e", border: "1px solid #fde68a" }}
      >
        Clear
      </button>
    </div>
  )
}
