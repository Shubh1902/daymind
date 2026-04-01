export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import HouseholdHistory from "@/components/household/HouseholdHistory"

export default async function HouseholdHistoryPage() {
  const members = await prisma.householdMember.findMany({ orderBy: { createdAt: "asc" } })

  // Fetch this week's tasks for initial render
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)

  const tasks = await prisma.householdTask.findMany({
    where: { completedAt: { gte: weekStart } },
    include: { member: true },
    orderBy: { completedAt: "desc" },
  })

  const serialized = tasks.map((t) => ({
    id: t.id, choreType: t.choreType, description: t.description,
    durationMinutes: t.durationMinutes, effortScore: t.effortScore,
    completedAt: t.completedAt.toISOString(), source: t.source,
    memberId: t.memberId,
    member: { id: t.member.id, name: t.member.name, slug: t.member.slug, color: t.member.color },
  }))

  const membersSerialized = members.map((m) => ({
    id: m.id, name: m.name, slug: m.slug, color: m.color,
  }))

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center gap-3 mb-5 animate-slide-up">
        <Link
          href="/household"
          className="p-2 rounded-lg"
          style={{ background: "#f3f4f6", color: "#374151" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gradient">History</h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>All logged household chores</p>
        </div>
      </div>

      <div className="animate-slide-up delay-100">
        <HouseholdHistory initialTasks={serialized} members={membersSerialized} />
      </div>
    </div>
  )
}
