"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { PlanItem } from "@/app/actions/ai"
import VoiceOrb from "./VoiceOrb"

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

export default function MobileVoicePanel({
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
  const [showInput, setShowInput] = useState(false)
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

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

  function handleVoiceTranscript(text: string) {
    sendMessage({ text })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    setShowInput(false)
    sendMessage({ text })
  }

  return (
    <div className="fixed left-0 right-0 flex flex-col items-center md:hidden pointer-events-none"
      style={{ bottom: "68px", paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 15 }}
    >
      {/* Message bubbles — show AI responses */}
      {visibleMessages.length > 0 && (
        <div
          className="w-full max-w-sm mx-auto px-4 mb-3 max-h-48 overflow-y-auto flex flex-col gap-2 pointer-events-auto"
        >
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
                          background: "linear-gradient(135deg, #059669, #10b981)",
                          color: "white",
                          boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                        }
                      : {
                          background: "var(--surface-3)",
                          color: "rgba(236, 253, 245, 0.85)",
                          border: "1px solid rgba(16, 185, 129, 0.12)",
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

      {/* Text input toggle — collapsed by default */}
      {showInput && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto px-4 mb-3 flex gap-2 items-center pointer-events-auto animate-slide-up"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type instead..."
            autoFocus
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              color: "rgba(236, 253, 245, 0.9)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.15)"
              e.currentTarget.style.boxShadow = "none"
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              boxShadow: "0 0 16px rgba(16, 185, 129, 0.3)",
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
      )}

      {/* Voice Orb + keyboard toggle */}
      <div className="flex items-end gap-4 pointer-events-auto mb-2">
        {/* Keyboard toggle */}
        <button
          type="button"
          onClick={() => {
            setShowInput(!showInput)
            if (!showInput) {
              setTimeout(() => inputRef.current?.focus(), 100)
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: showInput ? "rgba(16, 185, 129, 0.15)" : "var(--surface-2)",
            border: showInput
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid var(--border)",
          }}
          aria-label="Toggle text input"
        >
          <svg
            className="w-4 h-4"
            style={{ color: showInput ? "#6ee7b7" : "rgba(16, 185, 129, 0.5)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        {/* The main voice orb */}
        <VoiceOrb onTranscript={handleVoiceTranscript} disabled={isLoading} />

        {/* Spacer for symmetry */}
        <div className="w-10 h-10" />
      </div>
    </div>
  )
}
