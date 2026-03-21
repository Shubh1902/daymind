import { streamText, convertToModelMessages } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import type { PlanItem } from "@/app/actions/ai"

const USER_ID = "user_me"

const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { messages, tasks, currentPlan, sessionId } = await request.json()

  const tasksText =
    tasks && tasks.length > 0
      ? tasks
          .map(
            (t: {
              id: string
              text: string
              deadline: string | null
              priority: string
              estimatedMinutes: number | null
              deferCount: number
            }) => {
              let line = `- ID: ${t.id} | "${t.text}"`
              if (t.deadline)
                line += ` | Due: ${new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              if (t.priority !== "medium") line += ` | Priority: ${t.priority}`
              if (t.deferCount > 0) line += ` | Deferred ${t.deferCount}x`
              if (t.estimatedMinutes) line += ` | Est: ${t.estimatedMinutes}min`
              return line
            }
          )
          .join("\n")
      : "No open tasks."

  const planText =
    currentPlan && currentPlan.length > 0
      ? currentPlan
          .map(
            (p: PlanItem) =>
              `- ${p.scheduledTime} (${p.estimatedMinutes}min): taskId=${p.taskId}`
          )
          .join("\n")
      : "No current plan."

  const systemPrompt = `You are DayMind, a personal chief of staff AI. You help the user manage their day.

CURRENT TASK LIST:
${tasksText}

CURRENT DAY PLAN:
${planText}

When the user sends a message:
- Respond conversationally in 1-3 sentences
- If they want to add a task, ignore a task, defer a task, or change priorities — acknowledge it and adjust the plan mentally
- Always end your response with a JSON block on its own line, like this:
<plan_update>
{"plan":[{"taskId":"...","scheduledTime":"9:00 AM","estimatedMinutes":30,"reason":"..."}],"briefing":"updated briefing","newTasks":[{"text":"...","deadline":"2026-03-21","priority":"medium"}],"completedTaskIds":[],"deferredTaskIds":[]}
</plan_update>

Rules for the JSON block:
- "plan": always return the FULL updated plan array (all tasks, reshuffled if needed). Omit tasks the user wants to ignore/remove.
- "briefing": short updated 1-2 sentence briefing reflecting changes
- "newTasks": array of tasks to create (only if user is adding something new). deadline in YYYY-MM-DD format.
- "completedTaskIds": task IDs to mark done (if user says "done with X" or "ignore X" meaning skip it today — use deferredTaskIds instead)
- "deferredTaskIds": task IDs to defer to tomorrow

Keep your conversational reply ABOVE the <plan_update> block. Do not explain the JSON.`

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      try {
        const planMatch = text.match(/<plan_update>\s*([\s\S]*?)\s*<\/plan_update>/)
        if (!planMatch) return

        const update = JSON.parse(planMatch[1]) as {
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

        // Create new tasks
        if (update.newTasks?.length) {
          await Promise.all(
            update.newTasks.map((t) =>
              prisma.task.create({
                data: {
                  text: t.text,
                  deadline: t.deadline ? new Date(t.deadline) : null,
                  priority: t.priority ?? "medium",
                  estimatedMinutes: t.estimatedMinutes ?? null,
                  userId: USER_ID,
                },
              })
            )
          )
        }

        // Mark tasks complete
        if (update.completedTaskIds?.length) {
          await prisma.task.updateMany({
            where: { id: { in: update.completedTaskIds }, userId: USER_ID },
            data: { completed: true, completedAt: new Date() },
          })
        }

        // Defer tasks
        if (update.deferredTaskIds?.length) {
          for (const id of update.deferredTaskIds) {
            await prisma.task.update({
              where: { id },
              data: { deferCount: { increment: 1 } },
            })
          }
        }

        // Save updated plan
        if (sessionId && (update.plan || update.briefing)) {
          await prisma.dailySession.update({
            where: { id: sessionId },
            data: {
              ...(update.plan && { plan: update.plan as object[] }),
              ...(update.briefing && { briefing: update.briefing }),
            },
          })
        }
      } catch (err) {
        console.error("Failed to apply plan update from chat:", err)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
