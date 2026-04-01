import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getChoreEmoji } from "@/lib/household-chores"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") ?? "week"

  const now = new Date()
  let startDate: Date

  if (range === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // Default: this week (Monday start)
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    startDate = new Date(now)
    startDate.setDate(now.getDate() - diff)
    startDate.setHours(0, 0, 0, 0)
  }

  // Fetch all members
  const members = await prisma.householdMember.findMany({ orderBy: { createdAt: "asc" } })

  // Fetch tasks in range
  const tasks = await prisma.householdTask.findMany({
    where: { completedAt: { gte: startDate } },
    include: { member: true },
    orderBy: { completedAt: "desc" },
  })

  // Per-member aggregation
  const memberStats = members.map((member) => {
    const memberTasks = tasks.filter((t) => t.memberId === member.id)
    const totalMinutes = memberTasks.reduce((s, t) => s + t.durationMinutes, 0)
    const totalEffortPoints = memberTasks.reduce((s, t) => s + t.durationMinutes * t.effortScore, 0)

    // Top chore by count
    const choreCounts = new Map<string, number>()
    for (const t of memberTasks) {
      choreCounts.set(t.choreType, (choreCounts.get(t.choreType) ?? 0) + 1)
    }
    let topChore = ""
    let topCount = 0
    for (const [chore, count] of choreCounts) {
      if (count > topCount) { topChore = chore; topCount = count }
    }

    // Streak: consecutive days with at least 1 task, counting backwards from today
    const streak = computeStreak(memberTasks.map((t) => t.completedAt))

    return {
      id: member.id,
      name: member.name,
      slug: member.slug,
      color: member.color,
      totalMinutes,
      totalEffortPoints,
      choreCount: memberTasks.length,
      topChore,
      streak,
    }
  })

  // Fairness (effort-weighted)
  const totalEffort = memberStats.reduce((s, m) => s + m.totalEffortPoints, 0)
  const fairness = {
    member1Pct: totalEffort > 0 ? Math.round((memberStats[0]?.totalEffortPoints ?? 0) / totalEffort * 100) : 50,
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

  const byCategory = Array.from(categoryMap.entries()).map(([choreType, data]) => ({
    choreType,
    emoji: getChoreEmoji(choreType),
    ...data,
  })).sort((a, b) => (b.member1Minutes + b.member2Minutes) - (a.member1Minutes + a.member2Minutes))

  // Recent tasks (last 10)
  const recentTasks = tasks.slice(0, 10)

  return Response.json({
    members: memberStats,
    fairness,
    byCategory,
    recentTasks,
  })
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  const daySet = new Set<string>()
  for (const d of dates) {
    daySet.add(d.toISOString().slice(0, 10))
  }

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const check = new Date(today)
    check.setDate(today.getDate() - i)
    const key = check.toISOString().slice(0, 10)
    if (daySet.has(key)) {
      streak++
    } else {
      // Allow today to be missing (day hasn't ended yet)
      if (i === 0) continue
      break
    }
  }

  return streak
}
