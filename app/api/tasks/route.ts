import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: { userId: USER_ID },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  })
  return Response.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { text, deadline, estimatedMinutes, priority, category, notes } = body

  if (!text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      text: text.trim(),
      deadline: deadline ? new Date(deadline) : null,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      priority: priority ?? "medium",
      category: category ?? null,
      notes: notes ?? null,
      userId: USER_ID,
    },
  })

  return Response.json(task, { status: 201 })
}
