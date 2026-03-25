import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const { transcript } = await request.json()

  if (!transcript?.trim()) {
    return Response.json({ error: "transcript is required" }, { status: 400 })
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You parse natural language into task data. Today is ${dateStr}.

If the input is a task or action item, extract fields and return JSON:
{"action":"task_created","task":{"text":"...","deadline":null,"priority":"medium","estimatedMinutes":null,"category":null}}

Rules:
- text: the core task, cleaned up. Do NOT include time/priority/category words in the text.
- deadline: ISO 8601 string or null. "tomorrow" = next day, "Friday" = next Friday, etc.
- priority: "high", "medium", or "low". Default "medium".
- estimatedMinutes: integer or null. Only if the user mentions duration.
- category: short label like "work", "personal", "health", "errands", or null if unclear.

If the input is conversational (a question, request to reschedule, status check, greeting, or anything that isn't a task), return:
{"action":"needs_chat"}

Return ONLY valid JSON, nothing else.`,
    messages: [{ role: "user", content: transcript.trim() }],
  })

  const rawText =
    response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
      ?.text ?? ""

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return Response.json({ action: "needs_chat" })
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    action: "task_created" | "needs_chat"
    task?: {
      text: string
      deadline?: string | null
      priority?: string
      estimatedMinutes?: number | null
      category?: string | null
    }
  }

  if (parsed.action === "needs_chat" || !parsed.task?.text) {
    return Response.json({ action: "needs_chat" })
  }

  const task = await prisma.task.create({
    data: {
      text: parsed.task.text.trim(),
      deadline: parsed.task.deadline ? new Date(parsed.task.deadline) : null,
      estimatedMinutes: parsed.task.estimatedMinutes
        ? Number(parsed.task.estimatedMinutes)
        : null,
      priority: parsed.task.priority ?? "medium",
      category: parsed.task.category ?? null,
      userId: USER_ID,
    },
  })

  return Response.json({
    action: "task_created",
    task: {
      id: task.id,
      text: task.text,
      priority: task.priority,
      deadline: task.deadline,
      category: task.category,
      estimatedMinutes: task.estimatedMinutes,
    },
  })
}
