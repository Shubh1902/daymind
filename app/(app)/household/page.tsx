export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { getChoreEmoji } from "@/lib/household-chores"
import Link from "next/link"
import QuickTextInput from "@/components/household/QuickTextInput"
import FairnessRing from "@/components/household/FairnessRing"
import MemberStatCards from "@/components/household/MemberStatCards"
import StreakCards from "@/components/household/StreakCards"
import ChoreBreakdown from "@/components/household/ChoreBreakdown"
import RecentActivity from "@/components/household/RecentActivity"
import QuickLogFAB from "@/components/household/QuickLogFAB"

// Auto-seed members if none exist
const DEFAULT_MEMBERS = [
  { name: "Shubhanshu", slug: "shubhanshu", color: "#f97316" },
  { name: "Shanku", slug: "partner", color: "#8b5cf6" },
]

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  const daySet = new Set(dates.map((d) => d.toISOString().slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const check = new Date(today)
    check.setDate(today.getDate() - i)
    const key = check.toISOString().slice(0, 10)
    if (daySet.has(key)) {
      streak++
    } else {
      if (i === 0) continue
      break
    }
  }
  return streak
}

export default async function HouseholdPage() {
  // Ensure members exist
  let members = await prisma.householdMember.findMany({ orderBy: { createdAt: "asc" } })
  if (members.length === 0) {
    for (const m of DEFAULT_MEMBERS) {
      await prisma.householdMember.create({ data: m })
    }
    members = await prisma.householdMember.findMany({ orderBy: { createdAt: "asc" } })
  }

  // This week's range
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const tasks = await prisma.householdTask.findMany({
    where: { completedAt: { gte: weekStart } },
    include: { member: true },
    orderBy: { completedAt: "desc" },
  })

  // Member stats
  const memberStats = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.memberId === member.id)
    const totalMinutes = memberTasks.reduce((s, t) => s + t.durationMinutes, 0)
    const totalEffortPoints = memberTasks.reduce((s, t) => s + t.durationMinutes * t.effortScore, 0)

    const choreCounts = new Map<string, number>()
    for (const t of memberTasks) choreCounts.set(t.choreType, (choreCounts.get(t.choreType) ?? 0) + 1)
    let topChore = ""
    let topCount = 0
    for (const [chore, count] of choreCounts) {
      if (count > topCount) { topChore = chore; topCount = count }
    }

    return {
      id: member.id, name: member.name, slug: member.slug, color: member.color,
      totalMinutes, totalEffortPoints, choreCount: memberTasks.length, topChore,
      streak: computeStreak(memberTasks.map((t) => t.completedAt)),
    }
  })

  // Fairness
  const totalEffort = memberStats.reduce((s, m) => s + m.totalEffortPoints, 0)
  const fairness = {
    member1Pct: totalEffort > 0 ? Math.round(memberStats[0].totalEffortPoints / totalEffort * 100) : 50,
    member2Pct: totalEffort > 0 ? Math.round((memberStats[1]?.totalEffortPoints ?? 0) / totalEffort * 100) : 50,
    isBalanced: false,
  }
  fairness.isBalanced = fairness.member1Pct >= 40 && fairness.member1Pct <= 60

  // By category
  const categoryMap = new Map<string, { member1Minutes: number; member2Minutes: number }>()
  for (const t of tasks) {
    const entry = categoryMap.get(t.choreType) ?? { member1Minutes: 0, member2Minutes: 0 }
    if (t.memberId === members[0]?.id) entry.member1Minutes += t.durationMinutes
    else entry.member2Minutes += t.durationMinutes
    categoryMap.set(t.choreType, entry)
  }
  const byCategory = Array.from(categoryMap.entries())
    .map(([choreType, data]) => ({ choreType, emoji: getChoreEmoji(choreType), ...data }))
    .sort((a, b) => (b.member1Minutes + b.member2Minutes) - (a.member1Minutes + a.member2Minutes))

  // Week label
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

  // Recent (last 10) — serialize for client
  const recentTasks = tasks.slice(0, 10).map((t) => ({
    id: t.id, choreType: t.choreType, description: t.description,
    durationMinutes: t.durationMinutes, completedAt: t.completedAt.toISOString(),
    source: t.source, member: { name: t.member.name, color: t.member.color, slug: t.member.slug },
  }))

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Household</h1>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>This week: {weekLabel}</p>
        </div>
        <Link
          href="/household/history"
          className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Link>
      </div>

      {/* Quick text input — always visible */}
      <div className="mb-4 animate-slide-up delay-50">
        <QuickTextInput members={members.map((m) => ({ id: m.id, name: m.name, slug: m.slug, color: m.color }))} />
      </div>

      {/* Fairness Ring */}
      <div className="animate-slide-up delay-100">
        <FairnessRing members={memberStats} fairness={fairness} />
      </div>

      {/* Member Stat Cards */}
      <div className="mb-5 animate-slide-up delay-100">
        <MemberStatCards members={memberStats} />
      </div>

      {/* Streak Cards */}
      <div className="mb-5 animate-slide-up delay-150">
        <StreakCards members={memberStats} />
      </div>

      {/* Chore Breakdown */}
      {byCategory.length > 0 && (
        <div
          className="rounded-xl p-4 mb-5 animate-slide-up delay-200"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <ChoreBreakdown
            categories={byCategory}
            member1={{ name: memberStats[0]?.name ?? "", color: memberStats[0]?.color ?? "#f97316" }}
            member2={{ name: memberStats[1]?.name ?? "", color: memberStats[1]?.color ?? "#8b5cf6" }}
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="animate-slide-up delay-300">
        <RecentActivity tasks={recentTasks} />
      </div>

      {/* FAB */}
      <QuickLogFAB />
    </div>
  )
}
