"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import type { Capability } from "@/lib/classifier"

const CAPABILITY_CONFIG: Record<string, { icon: string; label: string; color: string; placeholder: string }> = {
  email_draft:    { icon: "✉️", label: "Draft Email",     color: "#60a5fa", placeholder: "Tell me who to email and what about…" },
  web_research:   { icon: "🔍", label: "Research",        color: "#a78bfa", placeholder: "What specifically do you want to know?" },
  flight_search:  { icon: "✈️", label: "Search Flights",  color: "#38bdf8", placeholder: "Where and when are you flying?" },
  document_draft: { icon: "📝", label: "Draft Document",  color: "#fb923c", placeholder: "What's the purpose and audience?" },
  meeting_prep:   { icon: "🎯", label: "Meeting Prep",    color: "#4ade80", placeholder: "Tell me about the meeting…" },
}

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("")
}

type Props = {
  taskId: string
  taskText: string
  capability: Capability
  onClose: () => void
}

export default function TaskAgentModal({ taskText, capability, onClose }: Props) {
  const config = CAPABILITY_CONFIG[capability as string] ?? { icon: "🤖", label: "AI Assistant", color: "#f97316", placeholder: "How can I help?" }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent",
      body: { capability, taskText },
    }),
  })

  const isLoading = status === "submitted" || status === "streaming"
  const visibleMessages = messages.filter((m) => m.role !== "system")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-send first message to kick off the agent
  const hasStarted = useRef(false)
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      sendMessage({ text: `Help me with this task: ${taskText}` })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text: input.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(67, 20, 7, 0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full md:max-w-lg mx-auto flex flex-col animate-slide-up"
        style={{
          background: "var(--surface-1)",
          border: "1px solid rgba(249, 115, 22, 0.15)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85vh",
          ...(typeof window !== "undefined" && window.innerWidth >= 768 ? { borderRadius: "24px", maxHeight: "80vh" } : {}),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(249, 115, 22, 0.1)" }}
        >
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</p>
            <p className="text-xs truncate" style={{ color: "#78716c" }}>{taskText}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all duration-200"
            style={{ color: "rgba(249, 115, 22, 0.4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(249, 115, 22, 0.8)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(249, 115, 22, 0.1)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(249, 115, 22, 0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {visibleMessages.map((m) => {
            const rawText = getMessageText(m.parts as { type: string; text?: string }[])
            if (!rawText) return null
            // Skip the initial "Help me with this task" message from user
            if (m.role === "user" && rawText.startsWith("Help me with this task:")) return null
            return (
              <div
                key={m.id}
                className={`flex animate-slide-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? {
                          background: `linear-gradient(135deg, ${config.color}33, ${config.color}55)`,
                          color: "#431407",
                          border: `1px solid ${config.color}44`,
                        }
                      : {
                          background: "var(--surface-2)",
                          color: "#431407",
                          border: "1px solid rgba(249, 115, 22, 0.1)",
                        }
                  }
                >
                  {rawText}
                </div>
              </div>
            )
          })}
          {isLoading && visibleMessages[visibleMessages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--surface-2)", border: "1px solid rgba(249, 115, 22, 0.1)" }}
              >
                <span className="flex gap-1.5 items-center" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "currentColor", animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "currentColor", animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "currentColor", animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 shrink-0" style={{ borderTop: "1px solid rgba(249, 115, 22, 0.1)" }}>
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--surface-2)",
                border: "1px solid rgba(249, 115, 22, 0.15)",
                color: "#431407",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `${config.color}66`
                e.currentTarget.style.boxShadow = `0 0 0 3px ${config.color}22`
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
              style={{ background: `linear-gradient(135deg, ${config.color}cc, ${config.color})` }}
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
    </div>
  )
}
