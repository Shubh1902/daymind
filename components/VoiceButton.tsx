"use client"

import { useEffect, useRef, useState } from "react"

type VoiceState = "idle" | "listening" | "error"

const SILENCE_MS = 3000       // 3s silence after speech → auto-stop
const MIN_LISTEN_MS = 10000   // keep listening at least 10s regardless of silence

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

function getSR(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  return (
    (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition ??
    null
  )
}

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  size?: "default" | "hero"  // hero = large prominent mic button
}

export default function VoiceButton({ onTranscript, disabled, size = "default" }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("idle")
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!getSR()) setSupported(false)
  }, [])

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  function stopListening() {
    clearSilenceTimer()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState("idle")
  }

  function startListening() {
    if (state === "listening") {
      stopListening()
      return
    }

    const SR = getSR()
    if (!SR) {
      setState("error")
      return
    }

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true
    recognitionRef.current = recognition

    let finalTranscript = ""
    let startedAt = 0

    recognition.onstart = () => {
      setState("listening")
      finalTranscript = ""
      startedAt = Date.now()
    }

    recognition.onresult = (event) => {
      clearSilenceTimer()
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) {
          finalTranscript += res[0].transcript
        } else {
          interim += res[0].transcript
        }
      }

      // Only auto-stop on silence AFTER the minimum listen window
      const elapsed = Date.now() - startedAt
      const delay = elapsed < MIN_LISTEN_MS
        ? Math.max(SILENCE_MS, MIN_LISTEN_MS - elapsed)
        : SILENCE_MS

      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTranscript + interim).trim()
        if (text) onTranscript(text)
        stopListening()
      }, delay)
    }

    recognition.onerror = (e) => {
      clearSilenceTimer()
      recognitionRef.current = null
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setState("error")
      } else {
        setState("idle")
      }
    }

    recognition.onend = () => {
      clearSilenceTimer()
      recognitionRef.current = null
      setState((prev) => (prev === "error" ? "error" : "idle"))
    }

    recognition.start()
  }

  if (!supported) return null

  if (state === "error") {
    return (
      <span className="text-xs px-2 whitespace-nowrap" style={{ color: "#fb7185" }}>
        Mic unavailable
      </span>
    )
  }

  const isHero = size === "hero"

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={disabled}
      aria-label={state === "listening" ? "Stop recording" : "Start voice input"}
      className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 ${
        isHero ? "w-20 h-20" : "w-10 h-10"
      }`}
      style={
        state === "listening"
          ? isHero
            ? {
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                boxShadow: "0 0 40px rgba(249, 115, 22, 0.4), 0 6px 24px rgba(249, 115, 22, 0.3)",
              }
            : {
                background: "rgba(244, 63, 94, 0.2)",
                border: "1px solid rgba(244, 63, 94, 0.4)",
                boxShadow: "0 0 16px rgba(244, 63, 94, 0.3)",
              }
          : isHero
            ? {
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                boxShadow: "0 6px 24px rgba(249, 115, 22, 0.35), 0 0 60px rgba(249, 115, 22, 0.1)",
              }
            : {
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }
      }
    >
      {state === "listening" ? (
        <span className="relative flex items-center justify-center">
          <span
            className={`absolute rounded-full opacity-40 ${isHero ? "w-14 h-14" : "w-7 h-7"}`}
            style={{
              background: isHero ? "rgba(255,255,255,0.3)" : "rgba(244, 63, 94, 0.5)",
              animation: "ping-soft 1s ease-out infinite",
            }}
          />
          <MicIcon
            className={`relative z-10 ${isHero ? "w-8 h-8" : "w-4 h-4"}`}
            style={{ color: isHero ? "#ffffff" : "#fb7185" }}
          />
        </span>
      ) : (
        <MicIcon
          className={isHero ? "w-8 h-8" : "w-4 h-4"}
          style={{ color: isHero ? "#ffffff" : "rgba(249, 115, 22, 0.5)" }}
        />
      )}
    </button>
  )
}

function MicIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}
