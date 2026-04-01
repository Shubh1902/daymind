import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getChoreDefaults } from "@/lib/household-chores"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") ?? "week"
  const memberId = searchParams.get("memberId")

  let startDate: Date | undefined
  const now = new Date()

  if (range === "week") {
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1 // Monday = start of week
    startDate = new Date(now)
    startDate.setDate(now.getDate() - diff)
    startDate.setHours(0, 0, 0, 0)
  } else if (range === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const where: Record<string, unknown> = {}
  if (startDate) {
    where.completedAt = { gte: startDate }
  }
  if (memberId) {
    where.memberId = memberId
  }

  const tasks = await prisma.householdTask.findMany({
    where,
    include: { member: true },
    orderBy: { completedAt: "desc" },
  })

  return Response.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { choreType, memberId, durationMinutes, description, completedAt, source } = body

  if (!choreType || !memberId) {
    return Response.json({ error: "choreType and memberId are required" }, { status: 400 })
  }

  // Verify member exists
  const member = await prisma.householdMember.findUnique({ where: { id: memberId } })
  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 })
  }

  const defaults = getChoreDefaults(choreType)

  const task = await prisma.householdTask.create({
    data: {
      choreType,
      memberId,
      durationMinutes: durationMinutes ?? defaults.defaultMinutes,
      effortScore: defaults.effortScore,
      description: description ?? null,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      source: source ?? "form",
    },
    include: { member: true },
  })

  return Response.json(task, { status: 201 })
}
