"use client"

import { STAT_LABELS, computeOverall, ratingColor, type FifaStats } from "@/lib/football-rating"
import { getPositionColor } from "@/lib/football-positions"

type Player = {
  name: string
  position: string
  positions?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
}

interface Props {
  player: Player
  size?: "sm" | "md"
}

export default function FifaCard({ player, size = "md" }: Props) {
  const stats: FifaStats = {
    pace: player.pace, shooting: player.shooting, passing: player.passing,
    dribbling: player.dribbling, defending: player.defending, physical: player.physical,
  }
  const overall = computeOverall(stats, player.position)
  const color = ratingColor(overall)
  const posColor = getPositionColor(player.position)
  const isSm = size === "sm"

  return (
    <div
      className={`rounded-xl overflow-hidden ${isSm ? "w-[100px]" : "w-[140px]"}`}
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}18)`,
        border: `1.5px solid ${color}40`,
      }}
    >
      {/* Top: Overall + Position */}
      <div className={`flex items-center justify-between ${isSm ? "px-2 pt-1.5" : "px-3 pt-2"}`}>
        <span className={`font-black ${isSm ? "text-xl" : "text-2xl"} leading-none`} style={{ color }}>{overall}</span>
        <div className="text-right">
          <span
            className={`font-bold ${isSm ? "text-[9px]" : "text-[10px]"} px-1.5 py-0.5 rounded`}
            style={{ background: posColor.bg, color: posColor.color }}
          >
            {player.position}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className={`${isSm ? "px-2 py-1" : "px-3 py-1.5"}`}>
        <p
          className={`font-bold truncate ${isSm ? "text-[10px]" : "text-xs"}`}
          style={{ color: "#1f2937" }}
        >
          {player.name}
        </p>
      </div>

      {/* Stats */}
      <div className={`${isSm ? "px-2 pb-1.5 space-y-0.5" : "px-3 pb-2.5 space-y-1"}`}>
        {STAT_LABELS.map(({ key, short, color: statColor }) => {
          const val = stats[key]
          return (
            <div key={key} className="flex items-center gap-1">
              <span className={`font-bold ${isSm ? "text-[8px] w-5" : "text-[9px] w-6"}`} style={{ color: statColor }}>{short}</span>
              <div className="flex-1 h-1 rounded-full" style={{ background: "#e5e7eb" }}>
                <div className="h-full rounded-full" style={{ width: `${val}%`, background: statColor, transition: "width 0.3s" }} />
              </div>
              <span className={`font-bold ${isSm ? "text-[8px] w-4" : "text-[9px] w-5"} text-right`} style={{ color: "#374151" }}>{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
