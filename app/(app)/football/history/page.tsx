export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"

type TeamPlayer = { name: string; position: string; skill: number; role: string }

export default async function FootballHistoryPage() {
  const games = await prisma.footballGame.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { goals: { include: { player: true } } },
  })

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5 animate-slide-up">
        <Link href="/football" className="p-2 rounded-lg" style={{ background: "#f3f4f6", color: "#374151" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Game History</h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>{games.length} past games</p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-3xl block mb-2">⚽</span>
          <p className="text-sm" style={{ color: "#9ca3af" }}>No games yet — generate your first teams!</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up delay-100">
          {games.map((game) => {
            const teamA = (game.teamAPlayers as TeamPlayer[]) ?? []
            const teamB = (game.teamBPlayers as TeamPlayer[]) ?? []
            const goalsA = game.goals.filter((g) => g.team === "A")
            const goalsB = game.goals.filter((g) => g.team === "B")
            const hasResult = game.completed && game.scoreA != null && game.scoreB != null

            return (
              <div key={game.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                {/* Header + score */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: "#1f2937" }}>
                    {game.name ?? new Date(game.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  {hasResult ? (
                    <span className="text-lg font-bold px-3 py-0.5 rounded-lg" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                      <span style={{ color: "#f97316" }}>{game.scoreA}</span>
                      <span style={{ color: "#d1d5db" }}> - </span>
                      <span style={{ color: "#8b5cf6" }}>{game.scoreB}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>
                      No result
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div className="text-xs mb-1" style={{ color: "#6b7280" }}>
                  <span className="font-semibold" style={{ color: "#f97316" }}>A:</span>{" "}
                  {teamA.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
                </div>
                <div className="text-xs mb-2" style={{ color: "#6b7280" }}>
                  <span className="font-semibold" style={{ color: "#8b5cf6" }}>B:</span>{" "}
                  {teamB.filter((p) => p.role !== "sub").map((p) => p.name).join(", ")}
                </div>

                {/* Goal scorers */}
                {game.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
                    {game.goals.map((goal) => (
                      <span key={goal.id} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: goal.team === "A" ? "#fff7ed" : "#f5f3ff", color: goal.team === "A" ? "#f97316" : "#8b5cf6" }}>
                        ⚽ {goal.player.name}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs mt-2" style={{ color: "#d1d5db" }}>
                  {new Date(game.createdAt).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
