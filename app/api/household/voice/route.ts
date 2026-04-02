import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { CHORE_CATEGORIES } from "@/lib/household-chores"

let _anthropic: Anthropic | null = null
function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? "").trim() })
  }
  return _anthropic
}

const choreList = CHORE_CATEGORIES.map((c) => c.id).join(", ")

export async function POST(request: NextRequest) {
  const { transcript, members } = await request.json()

  if (!transcript?.trim()) {
    return Response.json({ error: "transcript is required" }, { status: 400 })
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })

  // Build member context from actual DB members
  const memberNames = (members ?? []).map((m: { name: string; slug: string }) => m.name)
  const member1 = memberNames[0] ?? "Shubhanshu"
  const member2 = memberNames[1] ?? "Partner"

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You parse natural language into household task data. Today is ${dateStr}.

The household has two members: "${member1}" (slug: "shubhanshu") and "${member2}" (slug: "partner").
- "I", "me", "my" → shubhanshu
- "she", "her", "wife", "wifey", "partner", "babe", "shanku", "shaa", "baba", "${member2.toLowerCase()}" → partner

Known task types: ${choreList}

Tasks can be household chores OR any other activity (booking, errands, creative work, admin, etc.).
- "booked a court" → booking
- "edited a reel" → creative
- "paid electricity bill" → admin
- "picked up dry cleaning" → errand
- "fixed the tap" → repair
- Anything that doesn't match a known type → "custom" (and put details in description)

IMPORTANT: The user may mention MULTIPLE tasks in one sentence. If so, return an array.

Return ONLY valid JSON in one of these formats:

For a SINGLE task:
{
  "action": "chore_logged",
  "chore": {
    "memberSlug": "shubhanshu" or "partner",
    "choreType": "closest match from known types, or custom",
    "durationMinutes": number or null,
    "description": "short note describing the specific activity" or null,
    "completedAt": "ISO date" or null
  }
}

For MULTIPLE tasks:
{
  "action": "multiple_chores",
  "chores": [
    { "memberSlug": "...", "choreType": "...", "durationMinutes": ..., "description": "...", "completedAt": ... },
    { "memberSlug": "...", "choreType": "...", "durationMinutes": ..., "description": "...", "completedAt": ... }
  ]
}

Rules:
- Map input to the closest choreType. "made rice" → cooking. "booked court" → booking. "edited reel" → creative.
- If duration is mentioned, extract it. Otherwise leave null.
- If time is mentioned ("yesterday", "this morning"), set completedAt.
- If unclear, return: {"action": "needs_clarification", "message": "short helpful message"}

Return ONLY valid JSON, nothing else.`,
    messages: [{ role: "user", content: transcript.trim() }],
  })

  const rawText =
    response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return Response.json({ action: "needs_clarification", message: "Sorry, I couldn't understand that. Try something like 'I did laundry for 30 minutes'." })
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)
  } catch {
    return Response.json({ action: "needs_clarification", message: "Sorry, I couldn't parse that. Please try again." })
  }
}
