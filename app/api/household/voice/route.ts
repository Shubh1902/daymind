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
    max_tokens: 512,
    system: `You parse natural language into household chore data. Today is ${dateStr}.

The household has two members: "${member1}" and "${member2}".
- "I", "me", "my" → "${member1}"
- "she", "her", "wife", "partner", "${member2.toLowerCase()}" → "${member2}"

Known chore types: ${choreList}

Extract the chore and return ONLY valid JSON:
{
  "action": "chore_logged",
  "chore": {
    "memberSlug": "shubhanshu" or "partner",
    "choreType": "one of the known types or closest match",
    "durationMinutes": number or null (if not mentioned, leave null),
    "description": "optional short note" or null,
    "completedAt": "ISO date string" or null (null = just now)
  }
}

Rules:
- Map the input to the closest choreType from the list.
- If duration is mentioned ("for 45 minutes", "an hour", "half an hour"), extract it.
- If time is mentioned ("yesterday", "this morning", "last night"), set completedAt appropriately relative to today.
- If the input is unclear or not a chore, return: {"action": "needs_clarification", "message": "short helpful message"}

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
