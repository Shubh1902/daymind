export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import FootballApp from "@/components/football/FootballApp"
import Link from "next/link"

export default async function FootballPage() {
  const players = await prisma.footballPlayer.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { skill: "desc" }, { name: "asc" }],
  })

  const serialized = players.map((p) => ({
    id: p.id, name: p.name, position: p.position, positions: p.positions,
    skill: p.skill, workRate: p.workRate, notes: p.notes,
  }))

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Football</h1>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
            {players.length} players in roster
          </p>
        </div>
        <Link
          href="/football/history"
          className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Link>
      </div>

      <div className="animate-slide-up delay-100">
        <FootballApp initialPlayers={serialized} />
      </div>
    </div>
  )
}
