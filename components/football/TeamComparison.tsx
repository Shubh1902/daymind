"use client"

import { useState } from "react"
import { compareTeams, type ComparisonResult } from "@/lib/football-comparison"
import { getPositionColor } from "@/lib/football-positions"

type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

interface Props {
  manualA: TeamAssignment[]
  manualB: TeamAssignment[]
  manualBalance: number
  autoA: TeamAssignment[]
  autoB: TeamAssignment[]
  autoBalance: number
  onBack: () => void
}

export default function TeamComparison({ manualA, manualB, manualBalance, autoA, autoB, autoBalance, onBack }: Props) {
  const comparison = compareTeams(manualA, manualB, autoA, autoB)
  const diffIds = new Set(comparison.differences.map((d) => d.playerId))

  function TeamColumn({ team, label, accent, highlightDiffs }: { team: TeamAssignment[]; label: string; accent: string; highlightDiffs: boolean }) {
    return (
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
        <div className="px-2.5 py-2 text-center" style={{ background: `${accent}10` }}>
          <span className="text-xs font-bold" style={{ color: accent }}>{label}</span>
        </div>
        <div className="p-2 space-y-1">
          {team.map((p) => {
            const pc = getPositionColor(p.position)
            const isDiff = highlightDiffs && diffIds.has(p.playerId)
            return (
              <div
                key={p.playerId}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                style={{
                  background: isDiff ? "#fef3c7" : pc.bg,
                  border: isDiff ? "1.5px solid #f59e0b" : `1px solid ${pc.color}15`,
                }}
              >
                <span className="font-bold w-5 text-center" style={{ color: pc.color }}>{p.position.slice(0, 2)}</span>
                <span className="font-medium flex-1 truncate" style={{ color: "#1f2937" }}>{p.name}</span>
                <span className="font-bold" style={{ color: "#6b7280" }}>{p.skill}</span>
                {isDiff && <span className="text-[9px]" title="Different in auto">🔄</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-sm font-bold" style={{ color: "#1f2937" }}>Manual vs Auto Comparison</h3>

      {/* Side by side: Manual */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: "#1f2937" }}>Your Teams</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: manualBalance >= 90 ? "#ecfdf5" : "#fef3c7", color: manualBalance >= 90 ? "#059669" : "#d97706" }}
          >
            {manualBalance}%
          </span>
        </div>
        <div className="flex gap-2">
          <TeamColumn team={manualA} label="Team A" accent="#f97316" highlightDiffs={true} />
          <TeamColumn team={manualB} label="Team B" accent="#8b5cf6" highlightDiffs={true} />
        </div>
      </div>

      {/* Side by side: Auto */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: "#1f2937" }}>Algorithm's Teams</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: autoBalance >= 90 ? "#ecfdf5" : "#fef3c7", color: autoBalance >= 90 ? "#059669" : "#d97706" }}
          >
            {autoBalance}%
          </span>
        </div>
        <div className="flex gap-2">
          <TeamColumn team={autoA} label="Team A" accent="#f97316" highlightDiffs={false} />
          <TeamColumn team={autoB} label="Team B" accent="#8b5cf6" highlightDiffs={false} />
        </div>
      </div>

      {/* Differences summary */}
      {comparison.differences.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#92400e" }}>
            {comparison.differences.length} player{comparison.differences.length > 1 ? "s" : ""} on different teams
          </p>
          <div className="flex flex-wrap gap-1">
            {comparison.differences.map((d) => (
              <span key={d.playerId} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fff", color: "#92400e" }}>
                {d.name}: your {d.manualTeam} → algo {d.autoTeam}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Swap suggestions */}
      {comparison.suggestedSwaps.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "#1f2937" }}>Suggested Swaps to Improve Balance</p>
          <div className="space-y-1.5">
            {comparison.suggestedSwaps.map((swap, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="flex-1 text-xs">
                  <span className="font-medium" style={{ color: "#1f2937" }}>
                    Swap <strong>{swap.playerA.name}</strong> (A) ↔ <strong>{swap.playerB.name}</strong> (B)
                  </span>
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: "#16a34a" }}>
                  +{swap.improvement}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparison.suggestedSwaps.length === 0 && comparison.differences.length === 0 && (
        <div className="text-center py-4 rounded-xl" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <span className="text-sm font-bold" style={{ color: "#059669" }}>✅ Your teams match the algorithm!</span>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
      >
        Back to Teams
      </button>
    </div>
  )
}
