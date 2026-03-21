"use server"

import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT =
  "You are a personal chief of staff. You know everything about the user's tasks and context. " +
  "Your job is to produce a realistic, time-aware daily schedule. " +
  "Be direct and practical. Never pad the schedule — if something takes 20 minutes, say 20 minutes."

export type PlanItem = {
  taskId: string
  scheduledTime: string
  estimatedMinutes: number
  reason: string
}

export type DayPlanResult = {
  id: string
  briefing: string | null
  plan: PlanItem[]
  questions: string[]
}

function getTodayBounds() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { today, tomorrow }
}

export async function generateDayPlan(userId: string): Promise<DayPlanResult> {
  const { today, tomorrow } = getTodayBounds()

  const existing = await prisma.dailySession.findFirst({
    where: { userId, date: { gte: today, lt: tomorrow } },
  })

  if (existing?.plan) {
    return {
      id: existing.id,
      briefing: existing.briefing,
      plan: existing.plan as PlanItem[],
      questions: [],
    }
  }

  const [tasks, contexts] = await Promise.all([
    prisma.task.findMany({
      where: { userId, completed: false },
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    }),
    prisma.userContext.findMany({ where: { userId } }),
  ])

  if (tasks.length === 0) {
    const session = existing
      ? await prisma.dailySession.update({
          where: { id: existing.id },
          data: { briefing: "No open tasks. Add some tasks to get a plan.", plan: [] },
        })
      : await prisma.dailySession.create({
          data: {
            userId,
            date: today,
            briefing: "No open tasks. Add some tasks to get a plan.",
            plan: [],
            userInputs: [],
          },
        })
    return { id: session.id, briefing: session.briefing, plan: [], questions: [] }
  }

  const now = new Date()
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const tasksText = tasks
    .map((t) => {
      let line = `- ID: ${t.id} | "${t.text}"`
      if (t.deadline)
        line += ` | Due: ${new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      if (t.priority !== "medium") line += ` | Priority: ${t.priority}`
      if (t.deferCount > 0) line += ` | Deferred ${t.deferCount}x`
      if (t.estimatedMinutes) line += ` | Est: ${t.estimatedMinutes}min`
      if (t.notes) line += ` | Notes: ${t.notes}`
      return line
    })
    .join("\n")

  const contextText =
    contexts.length > 0
      ? contexts.map((c) => `- ${c.key}: ${c.value}`).join("\n")
      : "None recorded yet."

  const userPrompt = `Today is ${dayName}, ${dateStr} at ${timeStr}.

MY TASKS:
${tasksText}

MY CONTEXT:
${contextText}

Produce a day plan. Return ONLY valid JSON in this exact shape:
{
  "briefing": "2-3 sentences: why these tasks matter today, what the deadline pressure is",
  "plan": [
    {
      "taskId": "exact task ID from the list above",
      "scheduledTime": "9:00 AM",
      "estimatedMinutes": 30,
      "reason": "one sentence why this slot"
    }
  ],
  "questions": ["any context you need to schedule better, e.g. How long does writing a proposal take you?"]
}`

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })

  const response = await stream.finalMessage()

  const rawText =
    response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
      ?.text ?? ""

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Claude did not return valid JSON for day plan")

  const planData = JSON.parse(jsonMatch[0]) as {
    briefing: string
    plan: PlanItem[]
    questions?: string[]
  }

  const session = existing
    ? await prisma.dailySession.update({
        where: { id: existing.id },
        data: {
          briefing: planData.briefing,
          plan: planData.plan as object[],
          userInputs: [],
        },
      })
    : await prisma.dailySession.create({
        data: {
          userId,
          date: today,
          briefing: planData.briefing,
          plan: planData.plan as object[],
          userInputs: [],
        },
      })

  return {
    id: session.id,
    briefing: session.briefing,
    plan: planData.plan,
    questions: planData.questions ?? [],
  }
}

export async function forcePlanRegenerate(userId: string): Promise<DayPlanResult> {
  const { today, tomorrow } = getTodayBounds()
  await prisma.dailySession.deleteMany({
    where: { userId, date: { gte: today, lt: tomorrow } },
  })
  return generateDayPlan(userId)
}

export async function saveUserContext(
  userId: string,
  key: string,
  value: string
) {
  await prisma.userContext.upsert({
    where: { userId_key: { userId, key } },
    update: { value },
    create: { userId, key, value },
  })
  revalidatePath("/dashboard")
}

export async function applyPlanUpdate(
  userId: string,
  sessionId: string,
  update: {
    plan?: PlanItem[]
    briefing?: string
    newTasks?: Array<{
      text: string
      deadline?: string
      priority?: string
      estimatedMinutes?: number
    }>
    completedTaskIds?: string[]
    deferredTaskIds?: string[]
  }
) {
  // Create any new tasks
  if (update.newTasks?.length) {
    await Promise.all(
      update.newTasks.map((t) =>
        prisma.task.create({
          data: {
            text: t.text,
            deadline: t.deadline ? new Date(t.deadline) : null,
            priority: t.priority ?? "medium",
            estimatedMinutes: t.estimatedMinutes ?? null,
            userId,
          },
        })
      )
    )
  }

  // Mark tasks complete
  if (update.completedTaskIds?.length) {
    await prisma.task.updateMany({
      where: { id: { in: update.completedTaskIds }, userId },
      data: { completed: true, completedAt: new Date() },
    })
  }

  // Defer tasks (increment deferCount)
  if (update.deferredTaskIds?.length) {
    for (const id of update.deferredTaskIds) {
      await prisma.task.update({
        where: { id },
        data: { deferCount: { increment: 1 } },
      })
    }
  }

  // Update the day plan
  if (update.plan || update.briefing) {
    await prisma.dailySession.update({
      where: { id: sessionId },
      data: {
        ...(update.plan && { plan: update.plan as object[] }),
        ...(update.briefing && { briefing: update.briefing }),
      },
    })
  }

  revalidatePath("/dashboard")
}
