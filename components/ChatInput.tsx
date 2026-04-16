"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { PlanItem } from "@/app/actions/ai"
import VoiceButton from "./VoiceButton"

type Task = {
  id: string
  text: string
  deadline: Date | null
  priority: string
  estimatedMinutes: number | null
  deferCount: number
}

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
}

function stripPlanUpdate(text: string): string {
  return text.replace(/<plan_update>[\s\S]*?<\/plan_update>/g, "").trim()
}

export default function ChatInput({
  tasks,
  currentPlan,
  sessionId,
}: {
  tasks: Task[]
  currentPlan: PlanItem[]
  sessionId: string
}) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { tasks, currentPlan, sessionId },
    }),
    onFinish: () => {
      router.refresh()
    },
  })

  const isLoading = status === "submitted" || status === "streaming"
  const visibleMessages = messages.filter((m) => m.role !== "system")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text })
  }

  function handleVoiceTranscript(text: string) {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 hidden md:block"
      style={{
        background: "rgba(255, 247, 237, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(249, 115, 22, 0.12)",
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        {/* Message bubbles */}
        {visibleMessages.length > 0 && (
          <div className="mb-3 max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
            {visibleMessages.map((m) => {
              const rawText = getMessageText(
                m.parts as { type: string; text?: string }[]
              )
              const displayText =
                m.role === "assistant" ? stripPlanUpdate(rawText) : rawText
              if (!displayText) return null
              return (
                <div
                  key={m.id}
                  className={`flex animate-slide-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      m.role === "user"
                        ? {
                            background: "linear-gradient(135deg, #ea580c, #f97316)",
                            color: "white",
                            boxShadow: "0 4px 16px rgba(249, 115, 22, 0.3)",
                          }
                        : {
                            background: "var(--surface-3)",
                            color: "#431407",
                            border: "1px solid rgba(249, 115, 22, 0.12)",
                          }
                    }
                  >
                    {displayText}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <VoiceButton onTranscript={handleVoiceTranscript} disabled={isLoading} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask DayMind to adjust your plan…"
            suppressHydrationWarning
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(249, 115, 22, 0.15)",
              color: "#431407",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.4)"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249, 115, 22, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.15)"
              e.currentTarget.style.boxShadow = "none"
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              boxShadow: "0 0 16px rgba(249, 115, 22, 0.3)",
            }}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
