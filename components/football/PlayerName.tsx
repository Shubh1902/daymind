"use client"

import { useState } from "react"
import PlayerDetailModal from "./PlayerDetailModal"

type Player = {
  id: string; name: string; position: string; positions?: string[]; aliases?: string[]
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number
  skill: number; workRate: string; notes: string | null
}

interface Props {
  player: Player
  /** Text to display (defaults to player.name) */
  displayName?: string
  className?: string
  style?: React.CSSProperties
  onUpdated?: () => void
}

/**
 * Clickable player name that opens PlayerDetailModal for view/edit.
 * Drop this anywhere a player name is shown.
 */
export default function PlayerName({ player, displayName, className, style, onUpdated }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"edit" | "duplicate">("edit")

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setModalMode("edit"); setShowModal(true) }}
        className={`text-left truncate hover:underline decoration-dotted underline-offset-2 ${className ?? ""}`}
        style={{ cursor: "pointer", ...style }}
      >
        {displayName ?? player.name}
      </button>

      {showModal && (
        <PlayerDetailModal
          player={player}
          mode={modalMode}
          onSaved={() => { setShowModal(false); onUpdated?.() }}
          onClose={() => setShowModal(false)}
          onDelete={() => { setShowModal(false); onUpdated?.() }}
        />
      )}
    </>
  )
}
