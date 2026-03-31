import { streamText, convertToModelMessages } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { NextRequest } from "next/server"
import type { Capability } from "@/lib/classifier"

const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const CAPABILITY_PROMPTS: Record<string, string> = {
  email_draft: `You are a focused email drafting assistant. The user has a task that involves sending an email.
Your job:
1. If you don't have enough info (recipient, subject, key points), ask 1-2 quick questions first
2. Once you have enough context, draft a complete, professional email
3. Format the draft clearly with To:, Subject:, and body
4. Offer to adjust tone, length, or content
Keep responses concise and action-oriented.`,

  web_research: `You are a focused research assistant. The user has a research task.
Your job:
1. If the topic is vague, ask one clarifying question
2. Provide a structured, scannable research summary with:
   - Key findings (bullet points)
   - Top options/recommendations if comparing
   - What to watch out for
3. End with: "Want me to dig deeper into any of these?"
Be thorough but scannable. Use your knowledge to give real, useful information.`,

  flight_search: `You are a focused travel planning assistant. The user needs to search for flights.
Your job:
1. Ask for: origin city/airport, destination, travel dates, number of passengers (one message if possible)
2. Once you have the details, provide:
   - A ready-to-use Google Flights link (https://www.google.com/travel/flights?q=flights+from+ORIGIN+to+DESTINATION+DATES)
   - Tips on best days/times to fly this route if you know them
   - Rough price expectations
   - Recommended booking sites to compare
Keep it practical and action-oriented.`,

  document_draft: `You are a focused document drafting assistant. The user needs to write a document.
Your job:
1. Ask about: purpose, audience, key points to cover, approximate length (if not clear from the task)
2. Draft a complete, well-structured document
3. Use appropriate formatting (headings, bullets, sections)
4. Offer to refine specific sections
Be thorough - produce a real first draft, not an outline.`,

  meeting_prep: `You are a focused meeting preparation assistant. The user has a meeting to prepare for.
Your job:
1. Ask about: who the meeting is with, what it's about, your role/goal (if not clear)
2. Provide:
   - Key talking points (3-5 bullets)
   - Questions to ask
   - Potential objections/topics to anticipate
   - 1-line summary of your goal for this meeting
Be concise and practical - this is a prep brief, not an essay.`,
}

export async function POST(request: NextRequest) {
  const { messages, capability, taskText } = await request.json()

  const systemPrompt = CAPABILITY_PROMPTS[capability as string] ??
    `You are a helpful assistant. Help the user complete this task: "${taskText}"`

  const fullSystem = `${systemPrompt}

The user's task is: "${taskText}"

Start by understanding what's needed, then take action. Be concise and helpful.`

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system: fullSystem,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
