"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import type { PlanItem } from "@/app/actions/ai"
import VoiceOrb from "./VoiceOrb"
import QuickCaptureToast from "./QuickCaptureToast"

type Task = {
  id: string
  text: string
  deadline: Date | null
  priority: string
  estimatedMinutes: number | null
  deferCount: number
}

type Mode = "quick" | "chat"
type ToastData = { text: string; key: number } | null

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
  const [mode, setMode] = useState<Mode>("quick")
  const [toast, setToast] = useState<ToastData>(null)
  const [quickLoading, setQuickLoading] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { tasks, currentPlan, sessionId },
    }),
    onFinish: () => {
      router.refresh()
    },
  })

  const isLoading = status === "submitted" || status === "streaming" || quickLoading
  const visibleMessages = messages.filter((m) => m.role !== "system")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleQuickCapture = useCallback(async (transcript: string) => {
    setQuickLoading(true)
    try {
      const res = await fetch("/api/tasks/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()

      if (data.action === "task_created" && data.task) {
        setToast({ text: data.task.text, key: Date.now() })
        router.refresh()
      } else {
        // Conversational intent — fall back to chat
        setMode("chat")
        sendMessage({ text: transcript })
      }
    } catch {
      // On error, fall back to chat
      setMode("chat")
      sendMessage({ text: transcript })
    } finally {
      setQuickLoading(false)
    }
  }, [router, sendMessage])

  function handleVoiceTranscript(text: string) {
    if (mode === "quick") {
      handleQuickCapture(text)
    } else {
      sendMessage({ text })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    setShowInput(false)
    if (mode === "quick") {
      handleQuickCapture(text)
    } else {
      sendMessage({ text })
    }
  }

  return (
    <div className="fixed left-0 right-0 flex flex-col items-center md:hidden pointer-events-none"
      style={{ bottom: "68px", paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 15 }}
    >
      {/* Toast for quick capture */}
      {toast && (
        <div className="mb-3 pointer-events-auto">
          <QuickCaptureToast
            key={toast.key}
            text={toast.text}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}

      {/* Message bubbles — chat mode responses */}
      {mode === "chat" && visibleMessages.length > 0 && (
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
            placeholder={mode === "quick" ? "Type a task..." : "Ask DayMind..."}
            autoFocus
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
      )}

      {/* Mode label */}
      <p
        className="text-xs text-center mb-1.5 pointer-events-none"
        style={{ color: "rgba(249, 115, 22, 0.35)" }}
      >
        {mode === "quick" ? "Quick add" : "Chat mode"}
      </p>

      {/* Voice Orb + controls */}
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
            background: showInput ? "rgba(249, 115, 22, 0.15)" : "var(--surface-2)",
            border: showInput
              ? "1px solid rgba(249, 115, 22, 0.3)"
              : "1px solid var(--border)",
          }}
          aria-label="Toggle text input"
        >
          <svg
            className="w-4 h-4"
            style={{ color: showInput ? "#ea580c" : "rgba(249, 115, 22, 0.5)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        {/* The main voice orb */}
        <VoiceOrb onTranscript={handleVoiceTranscript} disabled={isLoading} />

        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => setMode(mode === "quick" ? "chat" : "quick")}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: mode === "chat" ? "rgba(249, 115, 22, 0.15)" : "var(--surface-2)",
            border: mode === "chat"
              ? "1px solid rgba(249, 115, 22, 0.3)"
              : "1px solid var(--border)",
          }}
          aria-label={mode === "quick" ? "Switch to chat mode" : "Switch to quick add"}
        >
          {mode === "quick" ? (
            // Lightning bolt — quick add mode
            <svg
              className="w-4 h-4"
              style={{ color: "rgba(249, 115, 22, 0.5)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ) : (
            // Chat bubble — chat mode
            <svg
              className="w-4 h-4"
              style={{ color: "#ea580c" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
