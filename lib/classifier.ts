import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Capability = "email_draft" | "web_research" | "flight_search" | "document_draft" | "meeting_prep" | null

export async function classifyTaskCapability(taskText: string): Promise<Capability> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      system: `Classify what AI can do to help complete this task. Return ONLY one of these exact strings (no quotes, no punctuation):
email_draft
web_research
flight_search
document_draft
meeting_prep
null

email_draft: task involves sending/writing an email, message, or reply to someone
web_research: task involves researching, finding, comparing, or looking up information
flight_search: task involves booking/searching flights or travel tickets
document_draft: task involves writing a report, proposal, document, or notes
meeting_prep: task involves preparing for a meeting, interview, or presentation
null: reminder, physical task, errand, or anything AI cannot meaningfully action

Return ONLY the single string, nothing else.`,
      messages: [{ role: "user", content: taskText }],
    })

    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text?.trim() ?? "null"
    const valid = ["email_draft", "web_research", "flight_search", "document_draft", "meeting_prep"]
    if (valid.includes(text)) return text as Capability
    return null
  } catch {
    return null
  }
}
