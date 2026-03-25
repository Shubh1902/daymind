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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [tasks, contexts, completedWithTime] = await Promise.all([
    prisma.task.findMany({
      where: { userId, completed: false },
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    }),
    prisma.userContext.findMany({ where: { userId } }),
    prisma.task.findMany({
      where: {
        userId,
        completed: true,
        estimatedMinutes: { not: null },
        actualMinutes: { not: null },
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { category: true, estimatedMinutes: true, actualMinutes: true },
    }),
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

  // Compute time accuracy per category
  let timeAccuracyText = ""
  if (completedWithTime.length >= 3) {
    const byCategory = new Map<string, { est: number; act: number; count: number }>()
    for (const t of completedWithTime) {
      const cat = t.category ?? "uncategorized"
      const entry = byCategory.get(cat) ?? { est: 0, act: 0, count: 0 }
      entry.est += t.estimatedMinutes!
      entry.act += t.actualMinutes!
      entry.count++
      byCategory.set(cat, entry)
    }
    const lines: string[] = []
    for (const [cat, { est, act, count }] of byCategory) {
      if (count < 2) continue
      const ratio = (act / est).toFixed(1)
      lines.push(`- "${cat}" tasks (${count} samples): actual time = ${ratio}x estimated`)
    }
    if (lines.length > 0) {
      timeAccuracyText = `\n\nTIME ACCURACY (last 30 days):\n${lines.join("\n")}\nUse this data to adjust your estimatedMinutes in the plan. If a category consistently takes longer, increase the estimate.`
    }
  }

  const userPrompt = `Today is ${dayName}, ${dateStr} at ${timeStr}.

MY TASKS:
${tasksText}

MY CONTEXT:
${contextText}${timeAccuracyText}

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

export type WeeklyStats = {
  completedCount: number
  createdCount: number
  totalFocusMinutes: number
  completionRate: number
  avgAccuracy: number | null
  byCategory: { category: string; count: number; minutes: number }[]
  byPriority: { priority: string; count: number }[]
  mostDeferred: { id: string; text: string; deferCount: number }[]
  insight: string
}

export async function generateWeeklyDigest(userId: string): Promise<WeeklyStats> {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [completed, created, deferred] = await Promise.all([
    prisma.task.findMany({
      where: { userId, completed: true, completedAt: { gte: weekStart } },
    }),
    prisma.task.findMany({
      where: { userId, createdAt: { gte: weekStart } },
    }),
    prisma.task.findMany({
      where: { userId, deferCount: { gt: 0 } },
      orderBy: { deferCount: "desc" },
      take: 5,
    }),
  ])

  const completedCount = completed.length
  const createdCount = created.length
  const completionRate = createdCount > 0 ? Math.round((completedCount / createdCount) * 100) : 0

  const totalFocusMinutes = completed.reduce((sum, t) => sum + (t.actualMinutes ?? t.estimatedMinutes ?? 0), 0)

  const withBoth = completed.filter((t) => t.estimatedMinutes && t.actualMinutes)
  const avgAccuracy = withBoth.length >= 2
    ? Math.round(
        (withBoth.reduce((sum, t) => {
          const ratio = Math.min(t.actualMinutes!, t.estimatedMinutes!) / Math.max(t.actualMinutes!, t.estimatedMinutes!)
          return sum + ratio
        }, 0) / withBoth.length) * 100
      )
    : null

  const catMap = new Map<string, { count: number; minutes: number }>()
  for (const t of completed) {
    const cat = t.category ?? "Uncategorized"
    const entry = catMap.get(cat) ?? { count: 0, minutes: 0 }
    entry.count++
    entry.minutes += t.actualMinutes ?? t.estimatedMinutes ?? 0
    catMap.set(cat, entry)
  }
  const byCategory = [...catMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.count - a.count)

  const priMap = new Map<string, number>()
  for (const t of completed) {
    priMap.set(t.priority, (priMap.get(t.priority) ?? 0) + 1)
  }
  const byPriority = [...priMap.entries()].map(([priority, count]) => ({ priority, count }))

  const mostDeferred = deferred.map((t) => ({ id: t.id, text: t.text, deferCount: t.deferCount }))

  let insight = ""
  try {
    const summaryText = `This week: ${completedCount} tasks completed out of ${createdCount} created (${completionRate}% rate). ${totalFocusMinutes} minutes of focus time.${avgAccuracy ? ` Time estimate accuracy: ${avgAccuracy}%.` : ""} Most deferred: ${mostDeferred.slice(0, 3).map((t) => `"${t.text}" (${t.deferCount}x)`).join(", ") || "none"}. Categories: ${byCategory.map((c) => `${c.category} (${c.count})`).join(", ") || "none"}.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: "You are a productivity coach. Given weekly stats, provide 2-3 sentences of friendly, actionable insight. Be specific and encouraging. No fluff.",
      messages: [{ role: "user", content: summaryText }],
    })

    insight = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""
  } catch {
    insight = "Keep up the good work! Review your most-deferred tasks to see if they need to be broken down or reprioritized."
  }

  return {
    completedCount,
    createdCount,
    totalFocusMinutes,
    completionRate,
    avgAccuracy,
    byCategory,
    byPriority,
    mostDeferred,
    insight,
  }
}
